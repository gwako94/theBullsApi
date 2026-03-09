import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import depthLimit from 'graphql-depth-limit';
import { getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { GraphQLError } from 'graphql';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './utils/context';

dotenv.config();

const PORT = process.env.PORT || 4000;

// S2: Rate limiter — 200 requests per 15-minute window per IP
const graphqlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errors: [{ message: 'Too many requests, please try again later.' }] },
});

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const httpServer = http.createServer(app);

  // Build the schema once so it can be shared with the complexity plugin
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    // S2: Depth limit — reject queries nested deeper than 7 levels
    validationRules: [depthLimit(7)],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Enable Apollo Sandbox in all environments (mutations protected by auth)
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      // S2: Query complexity limit — reject queries scoring above 500
      {
        requestDidStart: async () => ({
          async didResolveOperation({ request, document }: any) {
            const complexity = getComplexity({
              schema,
              operationName: request.operationName,
              query: document,
              variables: request.variables,
              estimators: [simpleEstimator({ defaultComplexity: 1 })],
            });
            if (complexity > 500) {
              throw new GraphQLError(
                `Query too complex (${complexity}). Maximum allowed complexity is 500.`,
                { extensions: { code: 'QUERY_TOO_COMPLEX' } }
              );
            }
          },
        }),
      },
    ],
    // Enable introspection in all environments (mutations protected by auth)
    introspection: true,
    formatError: (error) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('GraphQL Error:', {
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        });

        // Don't expose internal errors in production
        if (error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'An internal server error occurred',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          };
        }
      } else {
        console.error('GraphQL Error:', error);
      }
      return error;
    },
  });

  await server.start();

  app.use(
    '/graphql',
    // S2: Apply rate limiter before all other middleware
    graphqlLimiter,
    cors<cors.CorsRequest>({
      origin: [
        'https://isiolocityfc.com',
        'https://www.isiolocityfc.com',
        // S10: HTTP origins removed — only HTTPS allowed for production domains
        'https://isiolocityfc.onrender.com',
        'https://thebullsclient.onrender.com',
        ...(process.env.NODE_ENV !== 'production'
          ? ['http://localhost:3000', 'http://localhost:3001']
          : []),
      ],
      credentials: true,
    }),
    // S4: Reduce body limit from 50 MB to 1 MB
    express.json({ limit: '1mb' }),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'Isiolo City FC GraphQL API',
      version: '2.0.0',
      graphql: '/graphql',
      health: '/health',
    });
  });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  console.log(`Server ready at ${baseUrl}/graphql`);
  console.log(`Health check at ${baseUrl}/health`);

  // E3: Graceful shutdown — let in-flight requests finish before the process exits
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down gracefully`);
    await server.stop();
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
