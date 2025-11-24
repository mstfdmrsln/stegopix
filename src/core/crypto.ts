import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
// Default static salt used if the user does not provide a custom context/salt.
export const DEFAULT_SALT = 'stegopix-static-salt-v1'; 
const KEY_LENGTH = 32; // 256 bits

interface EncryptedPayload {
  encryptedData: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Encrypts data using AES-256-GCM.
 * Supports an optional custom salt to prevent Rainbow Table attacks.
 */
export function encrypt(data: Buffer, password: string, customSalt?: string): EncryptedPayload {
  const salt = customSalt || DEFAULT_SALT;
  
  // Scrypt is used for key derivation (CPU/Memory hard)
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encryptedData = Buffer.concat([
    cipher.update(data),
    cipher.final()
  ]);

  return {
    encryptedData,
    iv,
    authTag: cipher.getAuthTag()
  };
}

/**
 * Decrypts data using AES-256-GCM.
 * Requires the same salt used during encryption.
 */
export function decrypt(payload: EncryptedPayload, password: string, customSalt?: string): Buffer {
  const salt = customSalt || DEFAULT_SALT;
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, payload.iv);
  decipher.setAuthTag(payload.authTag);

  return Buffer.concat([
    decipher.update(payload.encryptedData),
    decipher.final()
  ]);
}