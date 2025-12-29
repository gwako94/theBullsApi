import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { GraphQLError } from 'graphql';

export const playerResolvers = {
  Query: {
    players: async (_: any, { position, status }: any, context: Context) => {
      const where: any = {};
      if (position) where.position = position;
      if (status) where.status = status;
      else where.status = 'ACTIVE';

      return context.prisma.player.findMany({
        where,
        orderBy: { jerseyNumber: 'asc' },
      });
    },

    player: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.player.findUnique({
        where: { id },
      });
    },

    playersByPosition: async (_: any, { position }: any, context: Context) => {
      return context.prisma.player.findMany({
        where: { position, status: 'ACTIVE' as any },
        orderBy: { jerseyNumber: 'asc' },
      });
    },
  },

  Mutation: {
    createPlayer: async (_: any, { input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.player.create({
        data: {
          id: generateIcfcIdWithModel('player'),
          ...input,
        },
      });
    },

    updatePlayer: async (_: any, { id, input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      return context.prisma.player.update({ where: { id }, data: input });
    },

    deletePlayer: async (_: any, { id }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      await context.prisma.player.delete({ where: { id } });
      return true;
    },
  },

  Player: {
    stats: (parent: any, _: any, context: Context) => {
      return context.prisma.playerStats.findFirst({
        where: { playerId: parent.id },
        orderBy: { season: 'desc' },
      });
    },

    achievements: (parent: any, _: any, context: Context) => {
      return context.prisma.achievement.findMany({
        where: { playerId: parent.id },
        orderBy: { awardedAt: 'desc' },
      });
    },
  },
};
