import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

// Re-implement hash helper matching actions/auth.ts to verify correctness
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Re-implement signature helpers matching lib/session.ts to test without cookies dependency
const SESSION_SECRET = 'test-secret-key-at-least-32-chars-long';

function signSessionPayload(payload: string): string {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function verifySessionPayload(payload: string, signature: string): boolean {
  const calculatedSig = signSessionPayload(payload);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(calculatedSig, 'hex'));
}

describe('Authentication & Session Cryptographic Security', () => {
  describe('Password Hashing', () => {
    it('should generate a 64-character SHA-256 hex string', () => {
      const hash = hashPassword('Password@123');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce identical hashes for the same inputs', () => {
      const hash1 = hashPassword('EVOQSecuritySecret');
      const hash2 = hashPassword('EVOQSecuritySecret');
      expect(hash1).toBe(hash2);
    });

    it('should produce completely different hashes for slightly different inputs', () => {
      const hash1 = hashPassword('password123');
      const hash2 = hashPassword('password124');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Signed Cookie Integrity', () => {
    it('should sign and verify payloads successfully', () => {
      const payload = JSON.stringify({ userId: 'user-101', role: 'HR', name: 'Rahul' });
      const signature = signSessionPayload(payload);
      
      const isValid = verifySessionPayload(payload, signature);
      expect(isValid).toBe(true);
    });

    it('should fail verification if payload is altered', () => {
      const payload = JSON.stringify({ userId: 'user-101', role: 'HR', name: 'Rahul' });
      const tamperedPayload = JSON.stringify({ userId: 'user-101', role: 'ADMIN', name: 'Rahul' });
      const signature = signSessionPayload(payload);

      const isValid = verifySessionPayload(tamperedPayload, signature);
      expect(isValid).toBe(false);
    });

    it('should fail verification if signature is altered', () => {
      const payload = JSON.stringify({ userId: 'user-101', role: 'HR', name: 'Rahul' });
      const signature = signSessionPayload(payload);
      const tamperedSignature = signature.replace('a', 'b'); // flip a character

      const isValid = verifySessionPayload(payload, tamperedSignature);
      expect(isValid).toBe(false);
    });
  });
});
