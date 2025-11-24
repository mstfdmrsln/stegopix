import { describe, it, expect } from 'vitest';
import { ChaosEngine } from '../../src/core/prng';

describe('ChaosEngine (PRNG)', () => {
  
  it('should be deterministic (Same seed = Same sequence)', () => {
    const seed = 'my-secret-password';
    const prng1 = new ChaosEngine(seed);
    const prng2 = new ChaosEngine(seed);

    // Generate 100 numbers from both engines
    for (let i = 0; i < 100; i++) {
      const max = 1000;
      expect(prng1.next(max)).toBe(prng2.next(max));
    }
  });

  it('should produce different sequences for different seeds', () => {
    const prng1 = new ChaosEngine('passwordA');
    const prng2 = new ChaosEngine('passwordB');

    const val1 = prng1.next(1000);
    const val2 = prng2.next(1000);

    expect(val1).not.toBe(val2);
  });

  it('should produce different sequences for same password but different salt', () => {
    const pass = 'password';
    const prng1 = new ChaosEngine(pass, 'salt1');
    const prng2 = new ChaosEngine(pass, 'salt2');

    expect(prng1.next(1000)).not.toBe(prng2.next(1000));
  });

  it('should respect the max bound', () => {
    const prng = new ChaosEngine('test');
    const max = 50;
    
    for (let i = 0; i < 1000; i++) {
      const val = prng.next(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
    }
  });
});