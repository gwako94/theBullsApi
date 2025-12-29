import { Context } from '../../utils/context';
import { GraphQLError } from 'graphql';
import { generateIcfcIdWithModel } from '../../utils/id-generator';

export const contentResolvers = {
  Query: {
    articles: async (_: any, { category, limit = 10, offset = 0 }: any, context: Context) => {
      const where = category ? { category, status: 'PUBLISHED' as any } : { status: 'PUBLISHED' as any };

      return context.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          author: true,
        },
      });
    },

    article: async (_: any, { slug }: { slug: string }, context: Context) => {
      const article = await context.prisma.article.findUnique({
        where: { slug },
        include: {
          author: true,
        },
      });

      if (!article) {
        throw new GraphQLError('Article not found');
      }

      // Increment view count
      await context.prisma.article.update({
        where: { slug },
        data: { viewCount: { increment: 1 } },
      });

      return article;
    },

    latestNews: async (_: any, { limit = 5 }: any, context: Context) => {
      return context.prisma.article.findMany({
        where: { status: 'PUBLISHED' as any },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: {
          author: true,
        },
      });
    },
  },

  Mutation: {
    createArticle: async (_: any, { input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized');
      }

      const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return context.prisma.article.create({
        data: {
          id: generateIcfcIdWithModel('article'),
          ...input,
          slug,
          authorId: context.user.id,
          status: 'DRAFT' as any,
        },
      });
    },

    updateArticle: async (_: any, { id, input }: any, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized');
      }

      return context.prisma.article.update({
        where: { id },
        data: input,
      });
    },

    publishArticle: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized');
      }

      return context.prisma.article.update({
        where: { id },
        data: {
          status: 'PUBLISHED' as any,
          publishedAt: new Date(),
        },
      });
    },

    deleteArticle: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized');
      }

      await context.prisma.article.delete({ where: { id } });
      return true;
    },
  },
};
