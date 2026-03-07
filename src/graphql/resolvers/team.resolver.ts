import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';

export const teamResolvers = {
  Query: {
    teams: async (_: any, __: any, context: Context) => {
      return context.prisma.team.findMany({
        orderBy: { name: 'asc' },
      });
    },

    team: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.team.findUnique({ where: { id } });
    },
  },

  Mutation: {
    createTeam: async (_: any, { input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.team.create({
          data: {
            id: generateIcfcIdWithModel('team'),
            ...input,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Team');
      }
    },

    bulkCreateTeams: async (_: any, { input }: { input: any[] }, context: Context) => {
      requireAdmin(context);

      try {
        const createdTeams = await context.prisma.$transaction(
          input.map((teamInput) =>
            context.prisma.team.create({
              data: {
                id: generateIcfcIdWithModel('team'),
                name: teamInput.name,
                shortName: teamInput.shortName,
                badgeUrl: teamInput.badgeUrl,
              },
            })
          )
        );

        return {
          success: true,
          created: createdTeams.length,
          failed: 0,
          errors: [],
          teams: createdTeams,
        };
      } catch (error: any) {
        const message =
          error.code === 'P2002'
            ? 'Duplicate team name detected — no teams were created'
            : `Bulk create failed — no teams were created: ${error.message}`;

        return {
          success: false,
          created: 0,
          failed: input.length,
          errors: [message],
          teams: [],
        };
      }
    },

    updateTeam: async (_: any, { id, input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.team.update({
          where: { id },
          data: input,
        });
      } catch (error) {
        handlePrismaError(error, 'Team');
      }
    },

    deleteTeam: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      try {
        await context.prisma.team.delete({ where: { id } });
      } catch (error) {
        handlePrismaError(error, 'Team');
      }
      return true;
    },
  },
};
