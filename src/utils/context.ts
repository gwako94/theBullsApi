import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

function getJWTSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
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

      user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
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
