import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';

export const shopResolvers = {
  Query: {
    products: async (_: any, { category, featured, limit = 20 }: any, context: Context) => {
      const where: any = { isActive: true };
      if (category) where.category = category;
      if (featured !== undefined) where.featured = featured;

      return context.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    },

    product: async (_: any, { slug }: { slug: string }, context: Context) => {
      return context.prisma.product.findUnique({ where: { slug } });
    },
  },

  Mutation: {
    createOrder: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new Error('Must be logged in to create an order');
      }

      const orderNumber = `ICFC-${Date.now()}`;
      const order = await context.prisma.order.create({
        data: {
          id: generateIcfcIdWithModel('order'),
          userId: context.user.id,
          orderNumber,
          ...input,
          status: 'PENDING' as any,
          items: {
            create: input.items.map((item: any) => ({
              id: generateIcfcIdWithModel('orderitem'),
              productId: item.productId,
              quantity: item.quantity,
              price: 0, // Should fetch from product
              size: item.size,
              color: item.color,
            })),
          },
        },
      });

      return order;
    },
  },

  Order: {
    user: (parent: any, _: any, context: Context) => {
      return context.prisma.user.findUnique({ where: { id: parent.userId } });
    },

    items: (parent: any, _: any, context: Context) => {
      return context.prisma.orderItem.findMany({
        where: { orderId: parent.id },
      });
    },
  },
};
