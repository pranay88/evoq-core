const cryptoNode = require('crypto');

const SESSION_SECRET = 'local_development_secret_key_evoq_core_12345';

// Node Encryption
const ENCRYPTION_KEY = cryptoNode.createHash('sha256').update(SESSION_SECRET).digest();
const ALGORITHM = 'aes-256-gcm';

function encryptSession(payload) {
  const iv = cryptoNode.randomBytes(12);
  const cipher = cryptoNode.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  return `${iv.toString('base64')}.${authTag}.${encrypted}`;
}

const token = encryptSession({ role: 'HR', status: 'ACTIVE' });
console.log('Token:', token);

// WebCrypto Decryption
async function edgeDecrypt(token) {
  const parts = token.split('.');
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  
  function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  const iv = base64ToUint8Array(ivBase64);
  const authTag = base64ToUint8Array(authTagBase64);
  const encrypted = base64ToUint8Array(encryptedBase64);
  
  const ciphertext = new Uint8Array(encrypted.length + authTag.length);
  ciphertext.set(encrypted);
  ciphertext.set(authTag, encrypted.length);
  
  const encoder = new TextEncoder();
  const secretBuffer = encoder.encode(SESSION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', secretBuffer);
  const cryptoKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, ['decrypt']);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext
  );
  
  return JSON.parse(new TextDecoder().decode(decryptedBuffer));
}

edgeDecrypt(token).then(res => console.log('Decrypted:', res)).catch(err => console.error(err));
