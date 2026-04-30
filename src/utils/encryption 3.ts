// Utility for Client-Side AES-GCM Encryption using Native Web Crypto API
// This ensures sensitive credentials (GSTIN, ITR logins) are encrypted
// before being stored in local state or transmitted over the network.

// A constant derivation salt (in production, fetch this securely or use a robust key management system)
const ENCRYPTION_SALT = "sannidh-ca-secure-portal-salt";

/**
 * Derives a CryptoKey from a given passphrase.
 */
async function getKeyMaterial(password: string) {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

/**
 * Uses PBKDF2 to derive an AES-GCM key from the key material.
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(password);
  const enc = new TextEncoder();
  const saltBuffer = enc.encode(ENCRYPTION_SALT);

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM.
 * @param text The plaintext string to encrypt.
 * @param secret Master secret/passphrase holding the credentials secure.
 * @returns Base64 encoded string containing IV + Ciphertext.
 */
export async function encryptData(text: string, secret: string = "default-ca-vault-key"): Promise<string> {
  const key = await deriveKey(secret);
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = enc.encode(text);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  // Combine IV and ciphertext for storage/transmission
  const combinedBuffer = new Uint8Array(iv.length + ciphertext.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(ciphertext), iv.length);

  // Convert to Base64 (btoa expects binary string)
  const binaryString = String.fromCharCode(...Array.from(combinedBuffer));
  return btoa(binaryString);
}

/**
 * Decrypts a Base64 encoded string containing IV + Ciphertext.
 * @param encryptedBase64 The combined encrypted string.
 * @param secret Master secret/passphrase used during encryption.
 * @returns The original plaintext string.
 */
export async function decryptData(encryptedBase64: string, secret: string = "default-ca-vault-key"): Promise<string> {
  const key = await deriveKey(secret);
  
  // Convert Base64 back to Uint8Array
  const binaryString = atob(encryptedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Extract IV and Ciphertext
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
