import { PNG } from 'pngjs';
import { encrypt, decrypt } from './crypto';
import { ChaosEngine } from './prng';

const MAGIC = Buffer.from('PXLV'); 
const HEADER_VERSION = 1;

export class StegoPix {
  
  /**
   * Encrypts and hides data into the image.
   * @param imageBuffer Original PNG buffer.
   * @param data Secret data buffer.
   * @param password Password for encryption.
   * @param customSalt (Optional) Additional context/salt for higher security.
   */
  static seal(imageBuffer: Buffer, data: Buffer, password: string, customSalt?: string): Buffer {
    const png = PNG.sync.read(imageBuffer);
    
    // 1. Encrypt with optional salt
    const { encryptedData, iv, authTag } = encrypt(data, password, customSalt);

    const payload = Buffer.concat([
      MAGIC,
      Buffer.from([HEADER_VERSION]),
      iv,
      authTag,
      Buffer.from(new Uint32Array([encryptedData.length]).buffer),
      encryptedData
    ]);

    const totalBits = payload.length * 8;
    const availablePixels = png.width * png.height;

    if (totalBits > availablePixels) {
      throw new Error(`Capacity Exceeded: Image can hold ${availablePixels} bits, but data requires ${totalBits} bits.`);
    }

    // 2. Initialize Chaos Engine with the same salt
    const chaos = new ChaosEngine(password, customSalt);
    const usedPixels = new Set<number>();

    for (let i = 0; i < payload.length; i++) {
      const byte = payload[i];
      for (let bit = 0; bit < 8; bit++) {
        const bitValue = (byte >> bit) & 1;

        let pixelIndex;
        do {
          pixelIndex = chaos.next(availablePixels);
        } while (usedPixels.has(pixelIndex));
        
        usedPixels.add(pixelIndex);

        const bufferIndex = pixelIndex * 4;
        const blueChannel = bufferIndex + 2;
        
        png.data[blueChannel] = (png.data[blueChannel] & 0xFE) | bitValue;
      }
    }

    return PNG.sync.write(png);
  }

  /**
   * Extracts and decrypts data from the image.
   * @param imageBuffer Steganographic PNG buffer.
   * @param password Password used for sealing.
   * @param customSalt (Optional) Must match the salt used during sealing.
   */
  static open(imageBuffer: Buffer, password: string, customSalt?: string): Buffer {
    const png = PNG.sync.read(imageBuffer);
    
    // Initialize Chaos Engine with the same salt to find correct pixels
    const chaos = new ChaosEngine(password, customSalt);
    const usedPixels = new Set<number>();
    const availablePixels = png.width * png.height;

    const readNextByte = (): number => {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        let pixelIndex;
        do {
          pixelIndex = chaos.next(availablePixels);
        } while (usedPixels.has(pixelIndex));
        usedPixels.add(pixelIndex);

        const bufferIndex = pixelIndex * 4;
        const blueChannel = bufferIndex + 2;
        
        const bitValue = png.data[blueChannel] & 1;
        byte |= (bitValue << bit);
      }
      return byte;
    };

    // 1. Verify Magic
    const magic = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) magic[i] = readNextByte();
    
    if (!magic.equals(MAGIC)) {
      throw new Error('Invalid Password/Salt or Not a StegoPix Image.');
    }

    // 2. Verify Version
    const version = readNextByte();
    if (version !== HEADER_VERSION) throw new Error('Unsupported StegoPix version.');

    // 3. Extract Metadata
    const iv = Buffer.alloc(12);
    for (let i = 0; i < 12; i++) iv[i] = readNextByte();

    const authTag = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) authTag[i] = readNextByte();

    const lenBuf = Buffer.alloc(4);
    for (let i = 0; i < 4; i++) lenBuf[i] = readNextByte();
    const dataLen = lenBuf.readUInt32LE(0);

    // 4. Extract Encrypted Data
    const encryptedData = Buffer.alloc(dataLen);
    for (let i = 0; i < dataLen; i++) encryptedData[i] = readNextByte();

    // 5. Decrypt with optional salt
    try {
      return decrypt({ encryptedData, iv, authTag }, password, customSalt);
    } catch (error) {
      throw new Error('Integrity Check Failed! Image tampered or wrong credentials.');
    }
  }
}