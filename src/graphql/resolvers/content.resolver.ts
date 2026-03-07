import { Context } from '../../utils/context';
import { GraphQLError } from 'graphql';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { requireAdmin } from '../../utils/auth';

export const contentResolvers = {
  Query: {
    articles: async (_: any, { category, status, limit = 10, offset = 0 }: any, context: Context) => {
      const isAdmin = context.user?.role === 'ADMIN';
      const where: any = {};
      if (category) where.category = category;
      if (isAdmin) {
        if (status) where.status = status;
      } else {
        // Public callers can only see published content.
        where.status = 'PUBLISHED' as any;
      }

      return context.prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
        include: {
          author: true,
        },
      });
    },

    article: async (_: any, { slug }: { slug: string }, context: Context) => {
      const isAdmin = context.user?.role === 'ADMIN';
      const article = await context.prisma.article.findUnique({
        where: { slug },
        include: {
          author: true,
        },
      });

      if (!article) {
        throw new GraphQLError('Article not found');
      }

      if (!isAdmin && article.status !== ('PUBLISHED' as any)) {
        throw new GraphQLError('Article not found');
      }

      // B1: Use the return value of update() so viewCount reflects the incremented value
      return context.prisma.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
        include: { author: true },
      });
    },

    articleById: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      const article = await context.prisma.article.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!article) {
        throw new GraphQLError('Article not found');
      }

      return article;
    },

    latestNews: async (_: any, { limit = 5 }: any, context: Context) => {
      return context.prisma.article.findMany({
        where: { status: 'PUBLISHED' as any, publishedAt: { not: null } },
        orderBy: { publishedAt: 'desc' },
        take: Math.min(limit, 20),
        include: {
          author: true,
        },
      });
    },
  },

  Mutation: {
    createArticle: async (_: any, { input }: any, context: Context) => {
      requireAdmin(context);

      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      try {
        return await context.prisma.article.create({
          data: {
            id: generateIcfcIdWithModel('article'),
            ...input,
            slug,
            authorId: context.user.id,
            status: 'DRAFT' as any,
          },
          include: {
            author: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Article');
      }
    },

    updateArticle: async (_: any, { id, input }: any, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.article.update({
          where: { id },
          data: input,
          include: {
            author: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Article');
      }
    },

    publishArticle: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      try {
        return await context.prisma.article.update({
          where: { id },
          data: {
            status: 'PUBLISHED' as any,
            publishedAt: new Date(),
          },
          include: {
            author: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Article');
      }
    },

    deleteArticle: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context);

      try {
        await context.prisma.article.delete({ where: { id } });
      } catch (error) {
        handlePrismaError(error, 'Article');
      }
      return true;
    },
  },
};
