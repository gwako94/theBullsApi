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

    bulkCreatePlayers: async (_: any, { input }: { input: any[] }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHORIZED' },
        });
      }

      const errors: string[] = [];
      const createdPlayers: any[] = [];
      let successCount = 0;
      let failedCount = 0;

      // Process each player input
      for (let i = 0; i < input.length; i++) {
        const playerInput = input[i];

        try {
          // Check for duplicate jersey number
          const existing = await context.prisma.player.findFirst({
            where: {
              jerseyNumber: playerInput.jerseyNumber,
              status: { not: 'RETIRED' }
            },
          });

          if (existing) {
            errors.push(`Player ${i + 1}: Jersey number ${playerInput.jerseyNumber} is already taken by ${existing.displayName}`);
            failedCount++;
            continue;
          }

          // Create the player
          const player = await context.prisma.player.create({
            data: {
              id: generateIcfcIdWithModel('player'),
              firstName: playerInput.firstName,
              lastName: playerInput.lastName,
              displayName: playerInput.displayName,
              position: playerInput.position,
              jerseyNumber: playerInput.jerseyNumber,
              nationality: playerInput.nationality,
              dateOfBirth: new Date(playerInput.dateOfBirth),
              height: playerInput.height,
              weight: playerInput.weight,
              preferredFoot: playerInput.preferredFoot,
              bio: playerInput.bio,
              joinedDate: new Date(playerInput.joinedDate),
              photoUrls: playerInput.photoUrls || [],
              status: 'ACTIVE',
            },
          });

          createdPlayers.push(player);
          successCount++;
        } catch (error: any) {
          errors.push(`Player ${i + 1} (${playerInput.displayName}): ${error.message}`);
          failedCount++;
        }
      }

      return {
        success: failedCount === 0,
        created: successCount,
        failed: failedCount,
        errors,
        players: createdPlayers,
      };
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
