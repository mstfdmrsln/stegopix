import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../src/core/crypto';

describe('Crypto Layer (AES-256-GCM)', () => {
  const password = 'super-secret-key';
  const data = Buffer.from('Launch codes: 12345');

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(data, password);
    const decrypted = decrypt(encrypted, password);
    
    expect(decrypted.toString()).toBe(data.toString());
  });

  it('should fail decryption with wrong password', () => {
    const encrypted = encrypt(data, password);
    
    expect(() => {
      decrypt(encrypted, 'wrong-password');
    }).toThrow();
  });

  it('should detect tampering (Auth Tag mismatch)', () => {
    const encrypted = encrypt(data, password);
    
    // Maliciously modify the encrypted payload
    encrypted.encryptedData[0] = encrypted.encryptedData[0] ^ 0xFF; // Flip bits

    expect(() => {
      decrypt(encrypted, password);
    }).toThrow();
  });

  it('should produce different ciphertexts with different salts', () => {
    const enc1 = encrypt(data, password, 'salt-A');
    const enc2 = encrypt(data, password, 'salt-B');

    // Even if IVs were same (which they are random), keys would be different
    expect(enc1.encryptedData).not.toEqual(enc2.encryptedData);
  });
});