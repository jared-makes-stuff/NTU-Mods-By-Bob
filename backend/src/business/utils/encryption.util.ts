/**
 * Encryption Utility
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * Used for encrypting sensitive data before storing in database
 */

import crypto from 'crypto';
import { logger } from '../../config/logger';

// AES-256-GCM configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment
 * Must be a 32-byte (64 hex characters) key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not found in environment variables');
  }
  
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string using AES-256-GCM
 * 
 * Format of encrypted output:
 * [salt:32][iv:16][authTag:16][ciphertext:variable]
 * Encoded as base64 for storage
 * 
 * @param plaintext - The text to encrypt
 * @returns Base64 encoded encrypted data
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  try {
    // Generate random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key using PBKDF2 with salt
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      100000, // iterations
      32, // key length in bytes
      'sha256'
    );
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the plaintext
    let ciphertext = cipher.update(plaintext, 'utf8');
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine: salt + iv + authTag + ciphertext
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      ciphertext
    ]);
    
    // Return as base64 string
    return result.toString('base64');
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * 
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    // Decode from base64
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = buffer.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Derive key using same salt
    const key = crypto.pbkdf2Sync(
      getEncryptionKey(),
      salt,
      100000, // same iterations as encrypt
      32,
      'sha256'
    );
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);
    
    return plaintext.toString('utf8');
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key is incorrect');
  }
}

/**
 * Check if data appears to be encrypted (simple heuristic)
 * Encrypted data should be base64 and longer than minimum length
 * 
 * @param data - Data to check
 * @returns True if data appears encrypted
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  
  // Check if it's valid base64 and has minimum length
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  const minEncryptedLength = ((SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) * 4) / 3; // base64 encoded
  
  return base64Regex.test(data) && data.length >= minEncryptedLength;
}



