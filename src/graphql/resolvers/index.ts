import { authResolvers } from './auth.resolver';
import { contentResolvers } from './content.resolver';
import { playerResolvers } from './player.resolver';
import { teamResolvers } from './team.resolver';
import { matchResolvers } from './match.resolver';
import { foundationResolvers } from './foundation.resolver';
import { shopResolvers } from './shop.resolver';
import { sponsorResolvers} from './sponsor.resolver';
import { GraphQLScalarType, GraphQLError, Kind, ValueNode } from 'graphql';

// T4: Validate that the date string produces a real Date, not "Invalid Date"
function parseDate(value: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new GraphQLError(`Invalid DateTime value: "${value}"`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return date;
}

const dateScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return parseDate(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return parseDate(ast.value);
    }
    return null;
  },
});

// Recursively convert a GraphQL AST ValueNode to a plain JS value.
// Previously parseLiteral returned the raw AST node for objects, meaning
// inline literals in queries (not variables) produced malformed data.
function parseLiteralToValue(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.ENUM:
      return ast.value;
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return ast.values.map(parseLiteralToValue);
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseLiteralToValue(field.value)])
      );
    default:
      return null;
  }
}

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    return parseLiteralToValue(ast);
  },
});

export const resolvers = {
  DateTime: dateScalar,
  JSON: jsonScalar,
  Query: {
    ...authResolvers.Query,
    ...contentResolvers.Query,
    ...playerResolvers.Query,
    ...teamResolvers.Query,
    ...matchResolvers.Query,
    ...foundationResolvers.Query,
    ...shopResolvers.Query,
    ...sponsorResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...contentResolvers.Mutation,
    ...playerResolvers.Mutation,
    ...teamResolvers.Mutation,
    ...matchResolvers.Mutation,
    ...foundationResolvers.Mutation,
    ...shopResolvers.Mutation,
    ...sponsorResolvers.Mutation,
  },
  // Field resolvers
  Order: shopResolvers.Order,
  OrderItem: shopResolvers.OrderItem,           // G2
  FoundationProgram: foundationResolvers.FoundationProgram,
  Enrollment: foundationResolvers.Enrollment,   // G1
};
