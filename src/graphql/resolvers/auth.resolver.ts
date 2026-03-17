import { Context } from '../../utils/context';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getJWTSecret, hashToken } from '../../utils/auth';

// Q10: Typed payload for refresh token JWTs
interface JWTRefreshPayload {
  userId: string;
  type: string;
  jti: string;
  iat: number;
  exp: number;
}

// S11/S12: Registration input validation schema
const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  // min 8 enforces meaningful passwords; max 72 prevents bcrypt truncation vulnerability
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(72, { message: 'Password must be at most 72 characters' }),
  name: z.string().min(1, { message: 'Name is required' }),
});

const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

function generateTokens(userId: string, email: string, role: string) {
  const JWT_SECRET = getJWTSecret();
  const accessTokenId = randomUUID();
  const refreshTokenId = randomUUID();

  const token = jwt.sign({ userId, email, role, jti: accessTokenId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh', jti: refreshTokenId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

  return { token, refreshToken };
}

export const authResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return context.prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },
  },

  Mutation: {
    register: async (
      _: any,
      {
        input,
      }: {
        input: {
          email: string;
          password: string;
          name: string;
          phone?: string;
        };
      },
      context: Context
    ) => {
      const { email, password, name, phone } = input;

      // S11/S12: Validate email format and password strength
      const validation = registerSchema.safeParse({ email, password, name });
      if (!validation.success) {
        throw new GraphQLError(
          validation.error.errors.map((e) => e.message).join('; '),
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      // Check if user already exists
      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await context.prisma.user.create({
        data: {
          id: generateIcfcIdWithModel('user'),
          email,
          passwordHash,
          name,
          phone,
          role: 'FAN',
          membershipTier: 'FREE',
        },
      });

      // Generate tokens
      const { token, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.role
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await context.prisma.session.create({
        data: {
          id: generateIcfcIdWithModel('session'),
          userId: user.id,
          token: hashToken(token),
          refreshToken: hashToken(refreshToken),
          expiresAt,
        },
      });

      return {
        token,
        refreshToken,
        user,
      };
    },

    login: async (
      _: any,
      { input }: { input: { email: string; password: string } },
      context: Context
    ) => {
      const { email, password } = input;

      // Find user
      const user = await context.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.passwordHash);

      if (!valid) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // S8: Block deactivated accounts
      if (!user.isActive) {
        throw new GraphQLError('Account is disabled', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // D5: Prune this user's expired sessions at login time to keep the table bounded
      await context.prisma.session.deleteMany({
        where: { userId: user.id, expiresAt: { lt: new Date() } },
      });

      // Generate tokens
      const { token, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.role
      );

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await context.prisma.session.create({
        data: {
          id: generateIcfcIdWithModel('session'),
          userId: user.id,
          token: hashToken(token),
          refreshToken: hashToken(refreshToken),
          expiresAt,
        },
      });

      return {
        token,
        refreshToken,
        user,
      };
    },

    refreshToken: async (
      _: any,
      { refreshToken }: { refreshToken: string },
      context: Context
    ) => {
      try {
        const JWT_SECRET = getJWTSecret();
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as JWTRefreshPayload;

        if (decoded.type !== 'refresh') {
          throw new Error('Invalid token type');
        }

        // Find session — compare against stored hash (S5)
        const session = await context.prisma.session.findUnique({
          where: { refreshToken: hashToken(refreshToken) },
          include: { user: true },
        });

        if (!session) {
          throw new Error('Session not found');
        }

        // S7: Enforce session expiry
        if (session.expiresAt < new Date()) {
          await context.prisma.session.delete({ where: { id: session.id } });
          throw new Error('Session expired');
        }

        // S8: Block deactivated accounts on token refresh
        if (!session.user.isActive) {
          await context.prisma.session.delete({ where: { id: session.id } });
          throw new Error('Account is disabled');
        }

        // Generate new tokens
        const tokens = generateTokens(
          session.user.id,
          session.user.email,
          session.user.role
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // S6: True token rotation — delete old session, create a new one.
        // This immediately invalidates the old refresh token so it cannot be reused.
        await context.prisma.session.delete({ where: { id: session.id } });
        await context.prisma.session.create({
          data: {
            id: generateIcfcIdWithModel('session'),
            userId: session.user.id,
            token: hashToken(tokens.token),
            refreshToken: hashToken(tokens.refreshToken),
            expiresAt,
          },
        });

        return {
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          user: session.user,
        };
      } catch (error) {
        throw new GraphQLError('Invalid or expired refresh token', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
    },
  },
};
