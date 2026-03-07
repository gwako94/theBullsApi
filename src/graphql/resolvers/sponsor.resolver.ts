import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';
import { GraphQLError } from 'graphql';
import { z } from 'zod';

const updateSponsorInputSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    logo: z.string().url().optional(),
    website: z.string().url().nullable().optional(),
    tier: z.enum(['TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER']).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    startDate: z.date().optional(),
    endDate: z.date().nullable().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
  })
  .strict();

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
      requireAdmin(context);

      try {
        return await context.prisma.sponsor.create({
          data: {
            id: generateIcfcIdWithModel('sponsor'),
            ...input,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Sponsor');
      }
    },

    updateSponsor: async (_: any, { id, input }: any, context: Context) => {
      requireAdmin(context);
      const parsed = updateSponsorInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError('Invalid sponsor update input', {
          extensions: {
            code: 'BAD_USER_INPUT',
            issues: parsed.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
        });
      }

      try {
        return await context.prisma.sponsor.update({
          where: { id },
          data: parsed.data,
        });
      } catch (error) {
        handlePrismaError(error, 'Sponsor');
      }
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
