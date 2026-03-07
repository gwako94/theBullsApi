import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';

const teamInclude = { homeTeam: true, awayTeam: true } as const;

export const matchResolvers = {
  Query: {
    matches: async (_: any, { status, limit = 20 }: any, context: Context) => {
      const where = status ? { status } : {};

      return context.prisma.match.findMany({
        where,
        orderBy: { kickoffTime: 'asc' },
        take: Math.min(limit, 100),
        include: teamInclude,
      });
    },

    match: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.match.findUnique({
        where: { id },
        include: teamInclude,
      });
    },

    upcomingMatches: async (_: any, { limit = 5 }: any, context: Context) => {
      return context.prisma.match.findMany({
        where: {
          kickoffTime: { gte: new Date() },
          status: { in: ['SCHEDULED', 'LIVE'] as any[] },
        },
        orderBy: { kickoffTime: 'asc' },
        take: Math.min(limit, 20),
        include: teamInclude,
      });
    },
  },

  Mutation: {
    createMatch: async (_: any, { input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.match.create({
          data: {
            id: generateIcfcIdWithModel('match'),
            ...input,
          },
          include: teamInclude,
        });
      } catch (error) {
        handlePrismaError(error, 'Match');
      }
    },

    bulkCreateMatches: async (_: any, { input }: { input: any[] }, context: Context) => {
      requireAdmin(context);

      try {
        const createdMatches = await context.prisma.$transaction(
          input.map((matchInput) =>
            context.prisma.match.create({
              data: {
                id: generateIcfcIdWithModel('match'),
                homeTeamId: matchInput.homeTeamId,
                awayTeamId: matchInput.awayTeamId,
                venue: matchInput.venue,
                kickoffTime: matchInput.kickoffTime,
                competition: matchInput.competition,
                season: matchInput.season,
              },
              include: teamInclude,
            })
          )
        );

        return {
          success: true,
          created: createdMatches.length,
          failed: 0,
          errors: [],
          matches: createdMatches,
        };
      } catch (error: any) {
        const message =
          error.code === 'P2003'
            ? 'One or more team IDs do not exist — no matches were created'
            : `Bulk create failed — no matches were created: ${error.message}`;

        return {
          success: false,
          created: 0,
          failed: input.length,
          errors: [message],
          matches: [],
        };
      }
    },

    updateMatch: async (_: any, { id, input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.match.update({
          where: { id },
          data: input,
          include: teamInclude,
        });
      } catch (error) {
        handlePrismaError(error, 'Match');
      }
    },

    deleteMatch: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      try {
        await context.prisma.match.delete({ where: { id } });
      } catch (error) {
        handlePrismaError(error, 'Match');
      }
      return true;
    },
  },
};
