import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hashes a plaintext password using Node.js native scrypt algorithm.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function comparePassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const hashToCompare = scryptSync(password, salt, 64).toString('hex');
  const buffer1 = Buffer.from(hash, 'hex');
  const buffer2 = Buffer.from(hashToCompare, 'hex');
  if (buffer1.length !== buffer2.length) return false;
  return timingSafeEqual(buffer1, buffer2);
}

