import { Context } from '../../utils/context';
import { generateIcfcIdWithModel } from '../../utils/id-generator';
import { handlePrismaError } from '../../utils/prisma-errors';
import { GraphQLError } from 'graphql';

export const shopResolvers = {
  Query: {
    products: async (_: any, { category, featured, limit = 20 }: any, context: Context) => {
      const where: any = { isActive: true };
      if (category) where.category = category;
      if (featured !== undefined) where.featured = featured;

      return context.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
      });
    },

    product: async (_: any, { slug }: { slug: string }, context: Context) => {
      return context.prisma.product.findUnique({ where: { slug } });
    },
  },

  Mutation: {
    createOrder: async (_: any, { input }: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Must be logged in to create an order', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // B2: Fetch product prices server-side — never trust client-supplied amounts.
      // B3: Also check isActive and stock per item.
      const productIds: string[] = input.items.map((item: any) => item.productId);
      const products = await context.prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, price: true, stock: true, name: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Reject if any product is inactive, not found, or out of stock
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new GraphQLError(`Product ${item.productId} is unavailable`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        if (product.stock < item.quantity) {
          throw new GraphQLError(
            `Insufficient stock for "${product.name}": requested ${item.quantity}, available ${product.stock}`,
            { extensions: { code: 'BAD_USER_INPUT' } }
          );
        }
      }

      const orderItems = input.items.map((item: any) => ({
        id: generateIcfcIdWithModel('orderitem'),
        productId: item.productId,
        quantity: item.quantity,
        price: productMap.get(item.productId)!.price,
        size: item.size,
        color: item.color,
      }));

      const totalAmount = orderItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      const orderNumber = `ICFC-${Date.now()}`;
      try {
        return await context.prisma.order.create({
          data: {
            id: generateIcfcIdWithModel('order'),
            userId: context.user.id,
            orderNumber,
            shippingAddress: input.shippingAddress,
            paymentMethod: input.paymentMethod,
            totalAmount,
            status: 'PENDING' as any,
            items: { create: orderItems },
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Order');
      }
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

  // G2: OrderItem.product is non-nullable in the schema — must have a resolver
  OrderItem: {
    product: (parent: any, _: any, context: Context) => {
      return context.prisma.product.findUnique({ where: { id: parent.productId } });
    },
  },
};
