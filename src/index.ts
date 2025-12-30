import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { createContext } from './utils/context';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    introspection: true, // Enable introspection for GraphQL playground
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
    cors<cors.CorsRequest>({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3001', // Admin dashboard
      ],
      credentials: true,
    }),
    express.json({ limit: '50mb' }),
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

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 Health check at http://localhost:${PORT}/health`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
