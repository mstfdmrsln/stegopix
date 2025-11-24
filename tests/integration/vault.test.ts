import { describe, it, expect } from 'vitest';
import { StegoPix } from '../../src/core/vault';
import { PNG } from 'pngjs';

// Helper: Create a blank 100x100 PNG buffer in memory
function createDummyPNG(width = 100, height = 100): Buffer {
  const png = new PNG({ width, height });
  // Fill with random noise to simulate real image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = Math.floor(Math.random() * 255);     // R
      png.data[idx + 1] = Math.floor(Math.random() * 255); // G
      png.data[idx + 2] = Math.floor(Math.random() * 255); // B
      png.data[idx + 3] = 255;                             // A
    }
  }
  return PNG.sync.write(png);
}

describe('StegoPix Integration', () => {
  const imageBuffer = createDummyPNG();
  const secretData = Buffer.from('{"mission": "top_secret"}');
  const password = 'correct-horse-battery-staple';

  it('should seal and open data successfully', () => {
    const sealedImage = StegoPix.seal(imageBuffer, secretData, password);
    
    // Verify the image is still a valid PNG
    expect(sealedImage).toBeInstanceOf(Buffer);
    
    const revealed = StegoPix.open(sealedImage, password);
    expect(revealed.toString()).toBe(secretData.toString());
  });

  it('should support custom salt workflow', () => {
    const salt = 'unique-context-id';
    const sealed = StegoPix.seal(imageBuffer, secretData, password, salt);
    
    // Attempt to open without salt should fail (magic bytes won't match because pixels are wrong)
    expect(() => StegoPix.open(sealed, password)).toThrow();
    
    // Open with correct salt
    const revealed = StegoPix.open(sealed, password, salt);
    expect(revealed.toString()).toBe(secretData.toString());
  });

  it('should throw error when image capacity is exceeded', () => {
    const tinyImage = createDummyPNG(1, 1); // 1 pixel = 3 bits (in Blue channel? No, 1 bit per pixel)
    // 1 pixel can hold 1 bit. Our header alone is huge.
    
    expect(() => {
      StegoPix.seal(tinyImage, secretData, password);
    }).toThrow(/Capacity Exceeded/);
  });

  it('should detect tampering on the sealed image', () => {
    const sealed = StegoPix.seal(imageBuffer, secretData, password);
    
    // Simulate an attack: Modify a byte in the middle of the PNG buffer
    // Note: We must be careful not to break the PNG structure itself (header/IEND), 
    // but modify the IDAT chunk (pixel data).
    // For simplicity, let's just flip a byte in the middle which likely hits data.
    const middle = Math.floor(sealed.length / 2);
    sealed[middle] = sealed[middle] ^ 0xFF;

    // Depending on WHERE we hit, it might be a PNG error or a Vault integrity error.
    // Both are acceptable failures for security.
    expect(() => {
      StegoPix.open(sealed, password);
    }).toThrow();
  });

  it('should fail with wrong password', () => {
    const sealed = StegoPix.seal(imageBuffer, secretData, password);
    
    expect(() => {
      StegoPix.open(sealed, 'wrong-password');
    }).toThrow();
  });
});