import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';

/**
 * Converts known Prisma runtime errors into user-friendly GraphQLErrors.
 *
 * P2002 — Unique constraint violation  → BAD_USER_INPUT
 * P2025 — Record not found             → NOT_FOUND
 * Everything else is re-thrown as-is so Apollo's formatError can handle it.
 */
export function handlePrismaError(error: unknown, entityName: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const fields = (error.meta?.target as string[])?.join(', ') ?? 'field';
      throw new GraphQLError(
        `${entityName} with this ${fields} already exists`,
        { extensions: { code: 'BAD_USER_INPUT' } }
      );
    }

    if (error.code === 'P2025') {
      throw new GraphQLError(
        `${entityName} not found`,
        { extensions: { code: 'NOT_FOUND' } }
      );
    }
  }

  throw error;
}
