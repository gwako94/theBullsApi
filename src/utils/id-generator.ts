import { randomBytes } from 'crypto';

/**
 * Generates a custom ID with the format: icfc_<model>_<random_string>
 *
 * @param modelName - The name of the Prisma model (e.g., 'user', 'player', 'match')
 * @param length - The length of the random string portion (default: 12)
 * @returns A unique ID string starting with 'icfc_<model>_'
 *
 * @example
 * // Returns something like: "icfc_user_a1b2c3d4e5f6"
 * const userId = generateIcfcIdWithModel('user');
 */
export function generateIcfcIdWithModel(modelName: string, length: number = 12): string {
  const bytes = randomBytes(Math.ceil(length / 2));
  const randomString = bytes.toString('hex').substring(0, length);
  return `icfc_${modelName.toLowerCase()}_${randomString}`;
}
