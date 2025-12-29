import { Context } from '../../utils/context';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { generateIcfcIdWithModel } from '../../utils/id-generator';

const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

function getJWTSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
}

function generateTokens(userId: string, email: string, role: string) {
  const JWT_SECRET = getJWTSecret();

  const token = jwt.sign({ userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
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
          token,
          refreshToken,
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
          token,
          refreshToken,
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
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

        if (decoded.type !== 'refresh') {
          throw new Error('Invalid token type');
        }

        // Find session
        const session = await context.prisma.session.findUnique({
          where: { refreshToken },
          include: { user: true },
        });

        if (!session) {
          throw new Error('Session not found');
        }

        // Generate new tokens
        const tokens = generateTokens(
          session.user.id,
          session.user.email,
          session.user.role
        );

        // Update session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await context.prisma.session.update({
          where: { id: session.id },
          data: {
            token: tokens.token,
            refreshToken: tokens.refreshToken,
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
