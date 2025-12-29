import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { GraphQLError } from 'graphql';

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
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.foundationProgram.create({
        data: {
          id: generateIcfcIdWithModel('program'),
          ...input,
        },
      });
    },

    enrollInProgram: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Must be logged in to enroll', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return context.prisma.enrollment.create({
        data: {
          id: generateIcfcIdWithModel('enrollment'),
          ...input,
        },
      });
    },
  },

  FoundationProgram: {
    enrollments: (parent: any, _: any, context: Context) => {
      return context.prisma.enrollment.findMany({
        where: { programId: parent.id },
      });
    },
  },
};
