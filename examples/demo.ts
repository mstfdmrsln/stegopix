import { StegoPix } from '../src';
import fs from 'node:fs';
import path from 'node:path';

// Configuration
const PASSWORD = 'correct-horse-battery-staple';
const INPUT_PATH = path.join(__dirname, 'input.png'); // Ensure this file exists
const OUTPUT_PATH = path.join(__dirname, 'secret.png');

// Sample sensitive payload
const SECRET_PAYLOAD = {
  project: 'Project Omega',
  api_key: 'sk_live_51Hz...',
  seed_phrase: 'witch collapse practice feed shame open despair creek road again ice least',
  timestamp: new Date().toISOString()
};

const main = () => {
  // Ensure input file exists
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`❌ Input file missing: ${INPUT_PATH}`);
    console.error('Please place a valid "input.png" file in the examples folder to run the demo.');
    process.exit(1);
  }

  try {
    // --- 1. Seal: Encrypt & Embed ---
    console.log('🔒 Sealing data into image...');
    
    const originalBuffer = fs.readFileSync(INPUT_PATH);
    const dataBuffer = Buffer.from(JSON.stringify(SECRET_PAYLOAD));

    // Encrypts and scatters data into the image pixels
    const sealedBuffer = StegoPix.seal(originalBuffer, dataBuffer, PASSWORD);
    
    fs.writeFileSync(OUTPUT_PATH, sealedBuffer);
    console.log(`✅ Data hidden successfully! Saved to: ${path.basename(OUTPUT_PATH)}`);


    // --- 2. Open: Extract & Decrypt ---
    console.log('\n🔓 Opening vault...');
    
    const secureImage = fs.readFileSync(OUTPUT_PATH);
    
    // Decrypts and verifies integrity
    const decryptedBuffer = StegoPix.open(secureImage, PASSWORD);
    const decryptedData = JSON.parse(decryptedBuffer.toString());

    console.log('✅ Access Granted. Payload:', decryptedData);


    // --- 3. Tamper Test: Integrity Check ---
    console.log('\n🕵️‍♂️ Simulating malicious tampering...');
    
    const tamperedImage = fs.readFileSync(OUTPUT_PATH);
    
    // Corrupt a single byte in the middle of the image data
    const corruptionIndex = Math.floor(tamperedImage.length / 2);
    tamperedImage[corruptionIndex] ^= 0xFF; 

    try {
      console.log('   Attempting to decrypt corrupted image...');
      StegoPix.open(tamperedImage, PASSWORD);
    } catch (error) {
      console.log(`🛡️ Security Alert: ${(error as Error).message}`);
    }

  } catch (error) {
    console.error('❌ Unexpected Error:', error);
  }
};

main();