import { randomBytes } from 'crypto';

/**
 * Generates a custom ID with the format: icfc_<random_string>
 *
 * @param length - The length of the random string portion (default: 16)
 * @returns A unique ID string starting with 'icfc_'
 *
 * @example
 * // Returns something like: "icfc_a1b2c3d4e5f6g7h8"
 * const id = generateIcfcId();
 *
 * @example
 * // Returns something like: "icfc_a1b2c3d4e5f6g7h8i9j0k1l2"
 * const longId = generateIcfcId(24);
 */
export function generateIcfcId(length: number = 16): string {
  // Generate random bytes
  const bytes = randomBytes(Math.ceil(length / 2));

  // Convert to hexadecimal string
  const randomString = bytes.toString('hex').substring(0, length);

  // Return with icfc prefix
  return `icfc_${randomString}`;
}

/**
 * Generates a custom ID with the format: icfc_<model>_<random_string>
 * This version includes the model name for better identification
 *
 * @param modelName - The name of the Prisma model (e.g., 'user', 'player', 'match')
 * @param length - The length of the random string portion (default: 12)
 * @returns A unique ID string starting with 'icfc_<model>_'
 *
 * @example
 * // Returns something like: "icfc_user_a1b2c3d4e5f6"
 * const userId = generateIcfcIdWithModel('user');
 *
 * @example
 * // Returns something like: "icfc_player_a1b2c3d4"
 * const playerId = generateIcfcIdWithModel('player', 8);
 */
export function generateIcfcIdWithModel(modelName: string, length: number = 12): string {
  // Generate random bytes
  const bytes = randomBytes(Math.ceil(length / 2));

  // Convert to hexadecimal string
  const randomString = bytes.toString('hex').substring(0, length);

  // Return with icfc prefix and model name
  return `icfc_${modelName.toLowerCase()}_${randomString}`;
}

/**
 * Generates a timestamp-based ID with the format: icfc_<timestamp>_<random_string>
 * This version includes a timestamp for chronological ordering
 *
 * @param length - The length of the random string portion (default: 8)
 * @returns A unique ID string starting with 'icfc_' and including a timestamp
 *
 * @example
 * // Returns something like: "icfc_1703097600000_a1b2c3d4"
 * const id = generateIcfcIdWithTimestamp();
 */
export function generateIcfcIdWithTimestamp(length: number = 8): string {
  // Get current timestamp
  const timestamp = Date.now();

  // Generate random bytes
  const bytes = randomBytes(Math.ceil(length / 2));

  // Convert to hexadecimal string
  const randomString = bytes.toString('hex').substring(0, length);

  // Return with icfc prefix, timestamp, and random string
  return `icfc_${timestamp}_${randomString}`;
}

/**
 * Validates if a string is a valid ICFC ID
 *
 * @param id - The ID string to validate
 * @returns True if the ID starts with 'icfc_', false otherwise
 *
 * @example
 * isValidIcfcId('icfc_a1b2c3d4e5f6g7h8'); // true
 * isValidIcfcId('uuid-1234-5678'); // false
 */
export function isValidIcfcId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('icfc_');
}

/**
 * Extracts the model name from an ICFC ID with model name
 *
 * @param id - The ID string with model name (format: icfc_<model>_<random>)
 * @returns The model name or null if not found
 *
 * @example
 * extractModelFromId('icfc_user_a1b2c3d4'); // 'user'
 * extractModelFromId('icfc_a1b2c3d4'); // null
 */
export function extractModelFromId(id: string): string | null {
  if (!isValidIcfcId(id)) {
    return null;
  }

  const parts = id.split('_');

  // Format: icfc_model_random
  if (parts.length >= 3) {
    return parts[1];
  }

  return null;
}
