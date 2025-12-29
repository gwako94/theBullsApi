import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { GraphQLError } from 'graphql';

export const sponsorResolvers = {
  Query: {
    sponsors: async (_: any, { tier, isActive }: any, context: Context) => {
      const where: any = {};
      if (tier) where.tier = tier;
      if (isActive !== undefined) where.isActive = isActive;

      return context.prisma.sponsor.findMany({
        where,
        orderBy: { displayOrder: 'asc' },
      });
    },

    sponsor: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.sponsor.findUnique({ where: { id } });
    },
  },

  Mutation: {
    createSponsor: async (_: any, { input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.sponsor.create({
        data: {
          id: generateIcfcIdWithModel('sponsor'),
          ...input,
        },
      });
    },

    updateSponsor: async (_: any, { id, input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.sponsor.update({
        where: { id },
        data: input,
      });
    },

    subscribeNewsletter: async (_: any, { email }: { email: string }, context: Context) => {
      await context.prisma.newsletter.upsert({
        where: { email },
        update: { isActive: true },
        create: {
          id: generateIcfcIdWithModel('newsletter'),
          email,
        },
      });
      return true;
    },
  },
};
