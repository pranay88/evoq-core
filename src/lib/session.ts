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

// Signs a payload with HMAC-SHA256 and base64 encodes it
export function encryptSession(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const dataBase64 = Buffer.from(data).toString('base64');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(dataBase64);
  const signature = hmac.digest('hex');
  return `${dataBase64}.${signature}`;
}

// Decrypts and verifies the token signature
export function decryptSession(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [dataBase64, signature] = parts;
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(dataBase64);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      console.warn('Session signature mismatch!');
      return null;
    }
    
    const decoded = Buffer.from(dataBase64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as SessionPayload;
  } catch (error) {
    console.error('Session decryption error:', error);
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
