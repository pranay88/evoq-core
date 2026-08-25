import { cookies } from 'next/headers';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'evoq_core_session';
// Fallback secret for local development
const SESSION_SECRET = process.env.AUTH_SECRET || 'local_development_secret_key_evoq_core_12345';

interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: 'HR' | 'ADMIN' | 'FRONT_DESK' | string;
  siteId: string | null;
  siteCode?: string | null;
  siteName?: string | null;
  departmentId: string | null;
}

// Ensure the secret is exactly 32 bytes for AES-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SESSION_SECRET).digest();
const ALGORITHM = 'aes-256-gcm';

// Encrypts payload with AES-256-GCM
export function encryptSession(payload: SessionPayload): string {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  // Format: iv.authTag.encryptedData
  return `${iv.toString('base64')}.${authTag}.${encrypted}`;
}

// Decrypts AES-256-GCM encrypted payload
export function decryptSession(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted) as SessionPayload;
  } catch (err) {
    return null;
  }
}

// Retrieves the current session on the server side
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptSession(token);
}

// Sets the session cookie
export async function setSession(payload: SessionPayload): Promise<void> {
  const token = encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours session timeout
  });
}

// Deletes the session cookie (logout)
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
