import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { GraphQLError } from 'graphql';

export const matchResolvers = {
  Query: {
    matches: async (_: any, { status, limit = 20 }: any, context: Context) => {
      const where = status ? { status } : {};

      return context.prisma.match.findMany({
        where,
        orderBy: { kickoffTime: 'desc' },
        take: limit,
      });
    },

    match: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.match.findUnique({ where: { id } });
    },

    upcomingMatches: async (_: any, { limit = 5 }: any, context: Context) => {
      return context.prisma.match.findMany({
        where: {
          kickoffTime: { gte: new Date() },
          status: { in: ['SCHEDULED', 'LIVE'] as any[] },
        },
        orderBy: { kickoffTime: 'asc' },
        take: limit,
      });
    },
  },

  Mutation: {
    createMatch: async (_: any, { input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.match.create({
        data: {
          id: generateIcfcIdWithModel('match'),
          ...input,
        },
      });
    },

    updateMatchStatus: async (_: any, { id, status }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.match.update({
        where: { id },
        data: { status },
      });
    },

    updateMatchScore: async (_: any, { id, homeScore, awayScore }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.match.update({
        where: { id },
        data: { homeScore, awayScore },
      });
    },
  },

  Match: {
    homeTeam: (parent: any, _: any, context: Context) => {
      return context.prisma.team.findUnique({ where: { id: parent.homeTeamId } });
    },

    awayTeam: (parent: any, _: any, context: Context) => {
      return context.prisma.team.findUnique({ where: { id: parent.awayTeamId } });
    },

    venue: (parent: any, _: any, context: Context) => {
      return context.prisma.venue.findUnique({ where: { id: parent.venueId } });
    },
  },
};
