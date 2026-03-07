import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from './auth';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createContext({ req }: any): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  let user = null;

  if (token) {
    try {
      const JWT_SECRET = getJWTSecret();
      const decoded = jwt.verify(
        token,
        JWT_SECRET
      ) as JWTPayload;

      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (dbUser?.isActive) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
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
