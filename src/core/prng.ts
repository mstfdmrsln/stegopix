import crypto from 'node:crypto';
import { DEFAULT_SALT } from './crypto';

/**
 * Deterministic Pseudo-Random Number Generator (PRNG).
 * Uses the Mulberry32 algorithm.
 */
export class ChaosEngine {
  private state: number;

  /**
   * Initializes the PRNG state based on the password and optional salt.
   * Changing the salt completely alters the pixel distribution sequence.
   */
  constructor(password: string, customSalt?: string) {
    const salt = customSalt || DEFAULT_SALT;
    
    // Combine password and salt to generate the seed hash
    const seedInput = `${password}::${salt}`;
    const hash = crypto.createHash('sha256').update(seedInput).digest('hex');
    
    // Take the first 8 characters (32-bit hex) as the integer seed
    this.state = parseInt(hash.slice(0, 8), 16);
  }

  /**
   * Generates the next random integer in the sequence [0, max).
   */
  next(max: number): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    
    const randomFloat = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    
    return Math.floor(randomFloat * max);
  }
}