/**
 * Test file for ICFC ID Generator
 * Run with: npx ts-node src/utils/id-generator.test.ts
 * Or with a test framework like Jest
 */

import {
  generateIcfcId,
  generateIcfcIdWithModel,
  generateIcfcIdWithTimestamp,
  isValidIcfcId,
  extractModelFromId,
} from './id-generator';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${message}`);
  } else {
    console.log(`${RED}✗${RESET} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testSection(title: string) {
  console.log(`\n${YELLOW}${title}${RESET}`);
  console.log('='.repeat(title.length));
}

// ============================================
// Test 1: Basic ID Generation
// ============================================

testSection('Test 1: Basic ID Generation');

const basicId = generateIcfcId();
assert(basicId.startsWith('icfc_'), 'Basic ID should start with "icfc_"');
assert(basicId.length === 21, `Basic ID should be 21 characters (icfc_ + 16 chars), got ${basicId.length}`);
console.log(`Generated: ${basicId}`);

// Test different lengths
const shortId = generateIcfcId(8);
assert(shortId.length === 13, `Short ID should be 13 characters (icfc_ + 8 chars), got ${shortId.length}`);
console.log(`Short ID: ${shortId}`);

const longId = generateIcfcId(24);
assert(longId.length === 29, `Long ID should be 29 characters (icfc_ + 24 chars), got ${longId.length}`);
console.log(`Long ID: ${longId}`);

// ============================================
// Test 2: Uniqueness
// ============================================

testSection('Test 2: Uniqueness');

const ids = new Set();
const numIds = 10000;

for (let i = 0; i < numIds; i++) {
  ids.add(generateIcfcId());
}

assert(ids.size === numIds, `Generated ${numIds} unique IDs`);
console.log(`All ${numIds} IDs are unique`);

// ============================================
// Test 3: ID with Model Name
// ============================================

testSection('Test 3: ID with Model Name');

const userId = generateIcfcIdWithModel('user');
assert(userId.startsWith('icfc_user_'), 'User ID should start with "icfc_user_"');
console.log(`User ID: ${userId}`);

const playerId = generateIcfcIdWithModel('player');
assert(playerId.startsWith('icfc_player_'), 'Player ID should start with "icfc_player_"');
console.log(`Player ID: ${playerId}`);

const matchId = generateIcfcIdWithModel('match', 8);
assert(matchId.startsWith('icfc_match_'), 'Match ID should start with "icfc_match_"');
assert(matchId.length === 19, `Match ID should be 19 characters, got ${matchId.length}`);
console.log(`Match ID: ${matchId}`);

// ============================================
// Test 4: ID with Timestamp
// ============================================

testSection('Test 4: ID with Timestamp');

const timestampId1 = generateIcfcIdWithTimestamp();
assert(timestampId1.startsWith('icfc_'), 'Timestamp ID should start with "icfc_"');

// Extract timestamp from ID
const parts = timestampId1.split('_');
const timestamp = parseInt(parts[1]);
assert(!isNaN(timestamp), 'Timestamp should be a valid number');
assert(timestamp > 1700000000000, 'Timestamp should be recent (after 2023)');
console.log(`Timestamp ID: ${timestampId1}`);

// Test chronological ordering
const timestampId2 = generateIcfcIdWithTimestamp();
const timestamp1 = parseInt(timestampId1.split('_')[1]);
const timestamp2 = parseInt(timestampId2.split('_')[1]);
assert(timestamp2 >= timestamp1, 'Second timestamp should be >= first timestamp');
console.log(`Second ID: ${timestampId2}`);

// ============================================
// Test 5: ID Validation
// ============================================

testSection('Test 5: ID Validation');

assert(isValidIcfcId('icfc_a1b2c3d4e5f6g7h8'), 'Valid ICFC ID should return true');
assert(isValidIcfcId('icfc_user_xyz123'), 'Valid ICFC ID with model should return true');
assert(isValidIcfcId('icfc_1703097600000_a1b2'), 'Valid ICFC ID with timestamp should return true');
assert(!isValidIcfcId('uuid-1234-5678'), 'UUID should return false');
assert(!isValidIcfcId(''), 'Empty string should return false');
assert(!isValidIcfcId('random_string'), 'Random string should return false');
console.log('All validation tests passed');

// ============================================
// Test 6: Extract Model Name
// ============================================

testSection('Test 6: Extract Model Name');

const userIdWithModel = generateIcfcIdWithModel('user');
assert(extractModelFromId(userIdWithModel) === 'user', 'Should extract "user" from user ID');

const playerIdWithModel = generateIcfcIdWithModel('player');
assert(extractModelFromId(playerIdWithModel) === 'player', 'Should extract "player" from player ID');

const articleIdWithModel = generateIcfcIdWithModel('article');
assert(extractModelFromId(articleIdWithModel) === 'article', 'Should extract "article" from article ID');

const basicIdForExtraction = generateIcfcId();
assert(extractModelFromId(basicIdForExtraction) === null, 'Basic ID should return null');

const timestampIdForExtraction = generateIcfcIdWithTimestamp();
const extractedFromTimestamp = extractModelFromId(timestampIdForExtraction);
assert(extractedFromTimestamp !== null, 'Timestamp ID should extract timestamp as model');

console.log('All model extraction tests passed');

// ============================================
// Test 7: Character Set
// ============================================

testSection('Test 7: Character Set');

const testId = generateIcfcId(100);
const randomPart = testId.substring(5); // Remove 'icfc_' prefix
const isHex = /^[0-9a-f]+$/.test(randomPart);
assert(isHex, 'Random part should only contain hexadecimal characters (0-9, a-f)');
console.log('Character set validation passed');

// ============================================
// Test 8: Performance
// ============================================

testSection('Test 8: Performance');

const iterations = 10000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  generateIcfcId();
}

const endTime = Date.now();
const totalTime = endTime - startTime;
const avgTime = totalTime / iterations;

console.log(`Generated ${iterations} IDs in ${totalTime}ms`);
console.log(`Average time per ID: ${avgTime.toFixed(3)}ms`);
assert(avgTime < 1, 'Average generation time should be < 1ms');

// ============================================
// Test 9: Collision Test
// ============================================

testSection('Test 9: Collision Test');

const collisionTestSize = 100000;
const collisionTestIds = new Set<string>();

for (let i = 0; i < collisionTestSize; i++) {
  const id = generateIcfcId();
  if (collisionTestIds.has(id)) {
    console.log(`${RED}Collision detected at iteration ${i}${RESET}`);
    break;
  }
  collisionTestIds.add(id);
}

assert(collisionTestIds.size === collisionTestSize, `No collisions in ${collisionTestSize} IDs`);
console.log(`Generated ${collisionTestSize} unique IDs without collisions`);

// ============================================
// Test 10: Model Name Case Handling
// ============================================

testSection('Test 10: Model Name Case Handling');

const upperCaseId = generateIcfcIdWithModel('USER');
assert(upperCaseId.startsWith('icfc_user_'), 'Uppercase model name should be converted to lowercase');

const mixedCaseId = generateIcfcIdWithModel('MyModel');
assert(mixedCaseId.startsWith('icfc_mymodel_'), 'Mixed case model name should be converted to lowercase');

console.log('Case handling tests passed');

// ============================================
// Summary
// ============================================

testSection('Test Summary');

console.log(`${GREEN}All tests passed!${RESET}`);
console.log('\nExample IDs generated:');
console.log(`  Basic:     ${generateIcfcId()}`);
console.log(`  User:      ${generateIcfcIdWithModel('user')}`);
console.log(`  Player:    ${generateIcfcIdWithModel('player')}`);
console.log(`  Match:     ${generateIcfcIdWithModel('match')}`);
console.log(`  Timestamp: ${generateIcfcIdWithTimestamp()}`);

export {};
