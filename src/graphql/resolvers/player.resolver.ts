import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';
import { GraphQLError } from 'graphql';
import { z } from 'zod';

const updatePlayerInputSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    displayName: z.string().trim().min(1).optional(),
    position: z.enum(['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']).optional(),
    jerseyNumber: z.number().int().positive().optional(),
    nationality: z.string().trim().min(1).optional(),
    dateOfBirth: z.date().optional(),
    height: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    preferredFoot: z.string().trim().min(1).optional(),
    status: z.enum(['ACTIVE', 'INJURED', 'SUSPENDED', 'ON_LOAN', 'RETIRED']).optional(),
    bio: z.string().trim().max(5000).optional(),
    joinedDate: z.date().optional(),
    contractEndDate: z.date().nullable().optional(),
    photoUrls: z.array(z.string().url()).optional(),
  })
  .strict();

export const playerResolvers = {
  Query: {
    players: async (_: any, { position, status }: any, context: Context) => {
      const where: any = {};
      if (position) where.position = position;
      if (status) {
        where.status = status;
      } else if (context.user?.role !== 'ADMIN') {
        // B10: Admins can see all players regardless of status; public API defaults to ACTIVE only
        where.status = 'ACTIVE';
      }

      return context.prisma.player.findMany({
        where,
        orderBy: { jerseyNumber: 'asc' },
        include: { stats: { orderBy: { season: 'desc' } }, achievements: { orderBy: { awardedAt: 'desc' } } },
      });
    },

    player: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.player.findUnique({
        where: { id },
        include: { stats: { orderBy: { season: 'desc' } }, achievements: { orderBy: { awardedAt: 'desc' } } },
      });
    },

    playersByPosition: async (_: any, { position }: any, context: Context) => {
      return context.prisma.player.findMany({
        where: { position, status: 'ACTIVE' as any },
        orderBy: { jerseyNumber: 'asc' },
        include: { stats: { orderBy: { season: 'desc' } }, achievements: { orderBy: { awardedAt: 'desc' } } },
      });
    },
  },

  Mutation: {
    createPlayer: async (_: any, { input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.player.create({
          data: {
            id: generateIcfcIdWithModel('player'),
            ...input,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Player');
      }
    },

    bulkCreatePlayers: async (_: any, { input }: { input: any[] }, context: Context) => {
      requireAdmin(context);

      // B8: Wrap all inserts in a single transaction — either every player is
      // created or none are, preventing partial commits on crash or error.
      // B9: The DB-level @@unique([jerseyNumber]) constraint now atomically
      // enforces uniqueness, eliminating the prior TOCTOU race between
      // findFirst and create.
      try {
        const createdPlayers = await context.prisma.$transaction(
          input.map((playerInput) =>
            context.prisma.player.create({
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
            })
          )
        );

        return {
          success: true,
          created: createdPlayers.length,
          failed: 0,
          errors: [],
          players: createdPlayers,
        };
      } catch (error: any) {
        // Prisma P2002 = unique constraint violation (duplicate jersey number)
        const message =
          error.code === 'P2002'
            ? `Duplicate jersey number detected — no players were created`
            : `Bulk create failed — no players were created: ${error.message}`;

        return {
          success: false,
          created: 0,
          failed: input.length,
          errors: [message],
          players: [],
        };
      }
    },

    updatePlayer: async (_: any, { id, input }: any, context: Context) => {
      requireAdmin(context);
      const parsed = updatePlayerInputSchema.safeParse(input);
      if (!parsed.success) {
        throw new GraphQLError('Invalid player update input', {
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
        return await context.prisma.player.update({ where: { id }, data: parsed.data });
      } catch (error) {
        handlePrismaError(error, 'Player');
      }
    },

    deletePlayer: async (_: any, { id }: any, context: Context) => {
      requireAdmin(context);

      try {
        await context.prisma.player.delete({ where: { id } });
      } catch (error) {
        handlePrismaError(error, 'Player');
      }
      return true;
    },
  },

};
