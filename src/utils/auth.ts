import { GraphQLError } from 'graphql';
import { Context } from './context';

// Q2: Single source of truth for JWT secret retrieval — no more copy-paste
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

// Q1: Shared auth guards — consistent error codes across all resolvers
export function requireAuth(context: Context): asserts context is Context & { user: NonNullable<Context['user']> } {
  if (!context.user) {
    throw new GraphQLError('Not authenticated', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function requireAdmin(context: Context): asserts context is Context & { user: NonNullable<Context['user']> } {
  if (!context.user || context.user.role !== 'ADMIN') {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED' },
    });
  }
}
