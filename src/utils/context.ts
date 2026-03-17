import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getJWTSecret, hashToken } from './auth';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export async function createContext({ req }: any): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user = null;

  if (token) {
    try {
      const JWT_SECRET = getJWTSecret();
      // Verify JWT signature and expiry before hitting the DB
      jwt.verify(token, JWT_SECRET);

      // Verify the access token has a live session row.
      // This ensures revoked/rotated tokens are rejected immediately.
      const session = await prisma.session.findUnique({
        where: { token: hashToken(token) },
        select: {
          expiresAt: true,
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (session && session.expiresAt > new Date() && session.user.isActive) {
        user = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
        };
      }
    } catch (error) {
      // Token verification failed - silently continue as unauthenticated
      if (process.env.NODE_ENV === 'development') {
        console.error('Invalid token:', error);
      }
    }
  }

  return {
    prisma,
    user,
  };
}

export { prisma };
