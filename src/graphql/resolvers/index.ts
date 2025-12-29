import { authResolvers } from './auth.resolver';
import { contentResolvers } from './content.resolver';
import { playerResolvers } from './player.resolver';
import { matchResolvers } from './match.resolver';
import { foundationResolvers } from './foundation.resolver';
import { shopResolvers } from './shop.resolver';
import { sponsorResolvers} from './sponsor.resolver';
import { GraphQLScalarType, Kind } from 'graphql';

const dateScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

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
    if (ast.kind === Kind.OBJECT) {
      return ast;
    }
    return null;
  },
});

export const resolvers = {
  DateTime: dateScalar,
  JSON: jsonScalar,
  Query: {
    ...authResolvers.Query,
    ...contentResolvers.Query,
    ...playerResolvers.Query,
    ...matchResolvers.Query,
    ...foundationResolvers.Query,
    ...shopResolvers.Query,
    ...sponsorResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...contentResolvers.Mutation,
    ...playerResolvers.Mutation,
    ...matchResolvers.Mutation,
    ...foundationResolvers.Mutation,
    ...shopResolvers.Mutation,
    ...sponsorResolvers.Mutation,
  },
  // Field resolvers
  Player: playerResolvers.Player,
  Match: matchResolvers.Match,
  Order: shopResolvers.Order,
  FoundationProgram: foundationResolvers.FoundationProgram,
};
