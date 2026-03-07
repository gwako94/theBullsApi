import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { GraphQLError } from 'graphql';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';

export const foundationResolvers = {
  Query: {
    foundationPrograms: async (_: any, { type, isActive }: any, context: Context) => {
      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive;

      return context.prisma.foundationProgram.findMany({
        where,
        orderBy: { startDate: 'desc' },
      });
    },

    foundationProgram: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.foundationProgram.findUnique({ where: { id } });
    },
  },

  Mutation: {
    createProgram: async (_: any, { input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.foundationProgram.create({
          data: {
            id: generateIcfcIdWithModel('program'),
            ...input,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Program');
      }
    },

    enrollInProgram: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Must be logged in to enroll', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // B5: Validate program is active and has available capacity
      const program = await context.prisma.foundationProgram.findUnique({
        where: { id: input.programId },
        include: { _count: { select: { enrollments: true } } },
      });

      if (!program || !program.isActive) {
        throw new GraphQLError('Program is not available for enrollment', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (program._count.enrollments >= program.capacity) {
        throw new GraphQLError('Program is at full capacity', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // B6: Only write explicitly allowed fields — status must default to PENDING, never client-supplied
      try {
        return await context.prisma.enrollment.create({
          data: {
            id: generateIcfcIdWithModel('enrollment'),
            programId: input.programId,
            studentName: input.studentName,
            studentAge: input.studentAge,
            guardianName: input.guardianName,
            guardianEmail: input.guardianEmail,
            guardianPhone: input.guardianPhone,
            // status intentionally omitted — defaults to PENDING in the DB schema
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Enrollment');
      }
    },
  },

  FoundationProgram: {
    enrollments: (parent: any, _: any, context: Context) => {
      return context.prisma.enrollment.findMany({
        where: { programId: parent.id },
      });
    },
  },

  // G1: Enrollment.program is non-nullable in the schema — must have a resolver
  Enrollment: {
    program: (parent: any, _: any, context: Context) => {
      return context.prisma.foundationProgram.findUnique({
        where: { id: parent.programId },
      });
    },
  },
};
