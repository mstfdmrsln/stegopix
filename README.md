# StegoPix

<div align="center">

  <h3>🔒 StegoPix</h3>
  
  <p>
    <strong>Military-grade steganography library with AES-256 encryption and scattered LSB embedding.</strong>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/stegopix">
      <img src="https://img.shields.io/npm/v/stegopix?style=flat-square&color=blue" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/stegopix">
      <img src="https://img.shields.io/npm/dm/stegopix?style=flat-square" alt="downloads" />
    </a>
    <a href="https://github.com/mstfdmrsln/stegopix/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/stegopix?style=flat-square" alt="license" />
    </a>
    <a href="https://bundlephobia.com/result?p=stegopix">
      <img src="https://img.shields.io/bundlephobia/minzip/stegopix?style=flat-square&color=green" alt="bundle size" />
    </a>
  </p>
</div>

---

## 💡 Why StegoPix?

Standard steganography tools rely on "Security by Obscurity." They hide data sequentially (Linear LSB), making it easy to detect via statistical analysis, and often lack encryption.

- ❌ **The Problem:** Linear embedding creates visible noise patterns. If the image is intercepted, the data is easily extracted and read because it's rarely encrypted.
- ✅ **The Solution:** **StegoPix** uses a **Deterministic Chaos Engine (PRNG)** to scatter encrypted data randomly across the image, making it look like white noise. It secures data with **AES-256-GCM**, ensuring both confidentiality and integrity.

## ✨ Features

- **🛡️ Military-Grade Encryption:** AES-256-GCM with Scrypt Key Derivation.
- **🎲 Scattered LSB:** Uses a PRNG seeded by your password to distribute bits randomly, preventing pattern detection.
- **🚫 Tamper Proof:** HMAC authentication tags ensure the data hasn't been modified or corrupted.
- **📦 Any Data Type:** Hide JSON, Buffers, Text, or binary files.
- **🧂 Optional Custom Salt:** Support for "Paranoid Mode" to prevent Rainbow Table attacks.
- **💻 CLI Support:** Seal and open files directly from the terminal (v1.1).
- **⚡ Zero Bloat:** Minimal dependencies (only `pngjs` and `commander`).

---

## 📦 Installation

```bash
npm install stegopix
# or
yarn add stegopix
````

-----

## 💻 CLI Usage

You can use StegoPix directly from your terminal without writing code.

**1. Hide a file (Seal):**

```bash
npx stegopix seal -i vacation.png -d secrets.txt -p "my-password" -o safe.png
```

**2. Reveal a file (Open):**

```bash
npx stegopix open -i safe.png -p "my-password" -o recovered.txt
```

**Options:**

  - `-i, --image`: Input image path.
  - `-d, --data`: Data file to hide (Seal only).
  - `-p, --password`: Password for encryption.
  - `-o, --output`: Output file path.
  - `-s, --salt`: (Optional) Custom salt for paranoid mode.

-----

## 🚀 Quick Start (Programmatic)

```typescript
import { StegoPix } from 'stegopix';
import fs from 'node:fs';

const PASSWORD = 'super-secret-password';

// 1. Seal (Encrypt & Hide)
const originalImage = fs.readFileSync('vacation.png');
const secretData = Buffer.from(JSON.stringify({ wallet_seed: 'x9f...' }));

const safeImage = StegoPix.seal(originalImage, secretData, PASSWORD);
fs.writeFileSync('vacation_secure.png', safeImage);

console.log("✅ Data sealed successfully!");

// 2. Open (Extract & Decrypt)
try {
    const diskImage = fs.readFileSync('vacation_secure.png');
    const revealed = StegoPix.open(diskImage, PASSWORD);
    
    console.log("🔓 Decrypted Data:", revealed.toString());
} catch (error) {
    console.error("❌ Integrity Check Failed:", error.message);
}
```

-----

## 🧠 Architecture

### 1\. The Chaos Engine (PRNG)

Unlike traditional tools that fill pixels 1, 2, 3... StegoPix derives a numerical seed from your password. It uses this seed to generate a deterministic sequence of pseudo-random coordinates.

> *Effect: The data is "sprinkled" across the image, indistinguishable from random sensor noise.*

### 2\. Encryption Layer (AES-GCM)

Before touching the image, data is encrypted.

  - **Algorithm:** AES-256-GCM
  - **KDF:** Scrypt (Memory-hard to resist brute-force)
  - **Integrity:** GCM Auth Tag verifies that not a single bit has been flipped.

-----

## 🛡️ Advanced Usage: Paranoid Mode

By default, StegoPix uses a static internal salt to ensure determinism. However, to protect against pre-computed Rainbow Table attacks, you can provide a unique **Context (Salt)**.

**Note:** You must provide the exact same salt to decrypt the data.

```typescript
const image = fs.readFileSync('input.png');
const data = Buffer.from('Launch Codes');
const pass = 'correct-horse-battery-staple';
const context = 'Project_Apollo_2025'; // Acts as a unique Salt

// Seal with custom salt
const secure = StegoPix.seal(image, data, pass, context);

// Open with custom salt
const result = StegoPix.open(secure, pass, context);
```

-----

## 📚 API Reference

### `StegoPix.seal(imageBuffer, dataBuffer, password, salt?)`

Encrypts and hides the data within the image.

  - **imageBuffer**: `Buffer` of the source PNG.
  - **dataBuffer**: `Buffer` of the data to hide.
  - **password**: `string` used for encryption and PRNG seeding.
  - **salt** *(Optional)*: `string` for additional entropy.
  - **Returns**: `Buffer` (The new PNG file).

### `StegoPix.open(imageBuffer, password, salt?)`

Extracts and decrypts the data. Throws an error if authentication fails.

  - **imageBuffer**: `Buffer` of the steganographic PNG.
  - **password**: `string`.
  - **salt** *(Optional)*: Must match the encryption salt.
  - **Returns**: `Buffer` (The original data).

-----

## ⚠️ Limitations & Notes

  - **Format:** Currently supports **PNG** images only (due to lossless compression requirement). JPEG is not supported as compression artifacts destroy LSB data.
  - **Capacity:** The maximum data capacity depends on the image resolution (\~Width \* Height / 8 bytes).
  - **Tampering:** If the image is resized, cropped, or re-saved by software that optimizes PNGs, the data will be lost (This is a security feature; integrity check will fail).

-----

## 🤝 Contributing

Contributions are welcome\!

1.  Fork the project
2.  Create your feature branch
3.  Commit your changes
4.  Push to the branch
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.
