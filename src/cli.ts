#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { StegoPix } from './core/vault';
import { version } from '../package.json';

const program = new Command();

program
  .name('stegopix')
  .description('Military-grade steganography tool for sealing and opening data in PNG images.')
  .version(version);

// --- COMMAND: SEAL (Hide Data) ---
program
  .command('seal')
  .description('Encrypt and hide data into a PNG image')
  .requiredOption('-i, --image <path>', 'Input PNG image path')
  .requiredOption('-d, --data <path>', 'Path to the secret file to hide')
  .requiredOption('-p, --password <text>', 'Password for encryption')
  .option('-o, --output <path>', 'Output PNG path', 'sealed.png')
  .option('-s, --salt <text>', 'Optional custom salt/context for paranoid security')
  .action((options) => {
    try {
      const imagePath = path.resolve(process.cwd(), options.image);
      const dataPath = path.resolve(process.cwd(), options.data);
      const outputPath = path.resolve(process.cwd(), options.output);

      if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);
      if (!fs.existsSync(dataPath)) throw new Error(`Data file not found: ${dataPath}`);

      console.log(`🔒 Reading image: ${path.basename(imagePath)}`);
      const imageBuffer = fs.readFileSync(imagePath);
      const dataBuffer = fs.readFileSync(dataPath);

      console.log(`📦 Encrypting ${dataBuffer.length} bytes...`);
      const sealed = StegoPix.seal(imageBuffer, dataBuffer, options.password, options.salt);

      fs.writeFileSync(outputPath, sealed);
      console.log(`✅ Success! Sealed image saved to: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

// --- COMMAND: OPEN (Reveal Data) ---
program
  .command('open')
  .description('Extract and decrypt data from a sealed PNG image')
  .requiredOption('-i, --image <path>', 'Sealed PNG image path')
  .requiredOption('-p, --password <text>', 'Password used for sealing')
  .option('-o, --output <path>', 'Output file path for extracted data', 'extracted_data.bin')
  .option('-s, --salt <text>', 'Custom salt (must match the one used during sealing)')
  .action((options) => {
    try {
      const imagePath = path.resolve(process.cwd(), options.image);
      const outputPath = path.resolve(process.cwd(), options.output);

      if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);

      console.log(`🔓 Attempting to unlock: ${path.basename(imagePath)}`);
      const imageBuffer = fs.readFileSync(imagePath);

      const extracted = StegoPix.open(imageBuffer, options.password, options.salt);

      fs.writeFileSync(outputPath, extracted);
      console.log(`✅ Success! Decrypted data saved to: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Error: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.parse();