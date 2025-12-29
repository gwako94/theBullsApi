/**
 * EXAMPLES: How to use the ICFC ID Generator with Prisma
 *
 * This file demonstrates different ways to use the custom ID generator
 * when creating new database records.
 */

import { PrismaClient } from '@prisma/client';
import {
  generateIcfcId,
  generateIcfcIdWithModel,
  generateIcfcIdWithTimestamp,
  isValidIcfcId,
  extractModelFromId,
} from './id-generator';

const prisma = new PrismaClient();

// ============================================
// EXAMPLE 1: Basic ID Generation
// ============================================

async function createUserWithBasicId() {
  const user = await prisma.user.create({
    data: {
      id: generateIcfcId(), // e.g., "icfc_a1b2c3d4e5f6g7h8"
      email: 'user@example.com',
      passwordHash: 'hashed_password',
      name: 'John Doe',
    },
  });

  console.log('Created user:', user.id);
  return user;
}

// ============================================
// EXAMPLE 2: ID with Model Name
// ============================================

async function createPlayerWithModelId() {
  const player = await prisma.player.create({
    data: {
      id: generateIcfcIdWithModel('player'), // e.g., "icfc_player_a1b2c3d4e5f6"
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'J. Doe',
      position: 'FORWARD',
      jerseyNumber: 10,
      nationality: 'Kenya',
      dateOfBirth: new Date('1995-01-15'),
      joinedDate: new Date(),
    },
  });

  console.log('Created player:', player.id);
  return player;
}

// ============================================
// EXAMPLE 3: ID with Timestamp (for chronological ordering)
// ============================================

async function createMatchWithTimestampId() {
  const match = await prisma.match.create({
    data: {
      id: generateIcfcIdWithTimestamp(), // e.g., "icfc_1703097600000_a1b2c3d4"
      homeTeamId: 'icfc_team_home123',
      awayTeamId: 'icfc_team_away456',
      venueId: 'icfc_venue_stadium1',
      kickoffTime: new Date('2024-12-25T15:00:00'),
      competition: 'FKF Premier League',
      season: '2024-2025',
    },
  });

  console.log('Created match:', match.id);
  return match;
}

// ============================================
// EXAMPLE 4: Multiple Records with IDs
// ============================================

async function createMultipleProductsWithIds() {
  const products = [
    {
      name: 'Home Jersey 2024/25',
      slug: 'home-jersey-2024-25',
      category: 'JERSEYS',
    },
    {
      name: 'Away Jersey 2024/25',
      slug: 'away-jersey-2024-25',
      category: 'JERSEYS',
    },
    {
      name: 'Training Kit',
      slug: 'training-kit',
      category: 'TRAINING_GEAR',
    },
  ];

  const createdProducts = await Promise.all(
    products.map((product) =>
      prisma.product.create({
        data: {
          id: generateIcfcIdWithModel('product'),
          ...product,
          description: `Official ${product.name}`,
          price: 4500,
          sku: `SKU-${generateIcfcId(8)}`,
        },
      })
    )
  );

  console.log('Created products:', createdProducts.map((p) => p.id));
  return createdProducts;
}

// ============================================
// EXAMPLE 5: Using ID Validation
// ============================================

function validateAndProcessId(id: string) {
  if (!isValidIcfcId(id)) {
    throw new Error(`Invalid ICFC ID: ${id}`);
  }

  const modelName = extractModelFromId(id);

  if (modelName) {
    console.log(`Processing ${modelName} with ID: ${id}`);
  } else {
    console.log(`Processing ID: ${id}`);
  }
}

// Usage examples:
// validateAndProcessId('icfc_user_a1b2c3d4'); // Processing user with ID: icfc_user_a1b2c3d4
// validateAndProcessId('icfc_1703097600000_a1b2'); // Processing ID: icfc_1703097600000_a1b2
// validateAndProcessId('invalid_id'); // Throws error

// ============================================
// EXAMPLE 6: Bulk Insert with Transaction
// ============================================

async function bulkCreateArticlesWithIds() {
  const articles = await prisma.$transaction(
    Array.from({ length: 5 }, (_, i) =>
      prisma.article.create({
        data: {
          id: generateIcfcIdWithModel('article'),
          title: `Article ${i + 1}`,
          slug: `article-${i + 1}`,
          excerpt: `Excerpt for article ${i + 1}`,
          content: `Content for article ${i + 1}`,
          category: 'NEWS',
          authorId: 'icfc_user_admin123', // existing user ID
        },
      })
    )
  );

  console.log('Created articles:', articles.map((a) => a.id));
  return articles;
}

// ============================================
// EXAMPLE 7: Custom Length IDs
// ============================================

async function createWithCustomLengthIds() {
  // Short ID (8 characters)
  const tag = await prisma.tag.create({
    data: {
      id: generateIcfcId(8), // e.g., "icfc_a1b2c3d4"
      name: 'Football',
      slug: 'football',
    },
  });

  // Medium ID (16 characters) - default
  const sponsor = await prisma.sponsor.create({
    data: {
      id: generateIcfcId(), // e.g., "icfc_a1b2c3d4e5f6g7h8"
      name: 'Sponsor Name',
      logo: 'https://example.com/logo.png',
      tier: 'GOLD',
      startDate: new Date(),
    },
  });

  // Long ID (24 characters)
  const enrollment = await prisma.enrollment.create({
    data: {
      id: generateIcfcId(24), // e.g., "icfc_a1b2c3d4e5f6g7h8i9j0k1l2"
      programId: 'icfc_program_academy1',
      studentName: 'Jane Doe',
      studentAge: 12,
      guardianName: 'John Doe',
      guardianEmail: 'john@example.com',
      guardianPhone: '+254700000000',
    },
  });

  console.log('Created with custom lengths:', {
    tag: tag.id,
    sponsor: sponsor.id,
    enrollment: enrollment.id,
  });
}

// ============================================
// EXAMPLE 8: Using in GraphQL Resolvers
// ============================================

// Example GraphQL mutation resolver
const createPlayerResolver = {
  Mutation: {
    createPlayer: async (_: any, { input }: any) => {
      return await prisma.player.create({
        data: {
          id: generateIcfcIdWithModel('player'),
          ...input,
        },
      });
    },
  },
};

// ============================================
// EXAMPLE 9: Using in REST API Controllers
// ============================================

async function createUserController(req: any, res: any) {
  try {
    const user = await prisma.user.create({
      data: {
        id: generateIcfcIdWithModel('user'),
        email: req.body.email,
        passwordHash: req.body.passwordHash,
        name: req.body.name,
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
}

// ============================================
// Export examples for testing
// ============================================

export {
  createUserWithBasicId,
  createPlayerWithModelId,
  createMatchWithTimestampId,
  createMultipleProductsWithIds,
  validateAndProcessId,
  bulkCreateArticlesWithIds,
  createWithCustomLengthIds,
  createPlayerResolver,
  createUserController,
};
