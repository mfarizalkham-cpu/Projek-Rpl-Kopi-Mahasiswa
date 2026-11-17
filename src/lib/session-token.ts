export type UserRole = 'ADMIN' | 'OWNER' | 'KASIR' | 'PELANGGAN' | 'SUPPLIER';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  employeeId?: string | null;
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'replace-with-a-long-random-secret') {
    throw new Error('JWT_SECRET harus diatur dengan nilai acak minimal 32 karakter.');
  }

  return globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    ['ADMIN', 'OWNER', 'KASIR', 'PELANGGAN', 'SUPPLIER'].includes(String(user.role))
  );
}

export async function createToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(
    encoder.encode(JSON.stringify({ user, issuedAt: now, expiresAt: now + TOKEN_TTL_SECONDS }))
  );
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    await getSigningKey(),
    encoder.encode(payload)
  );

  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const [payload, encodedSignature, ...extraParts] = token.split('.');
    if (!payload || !encodedSignature || extraParts.length > 0) return null;

    const isValid = await globalThis.crypto.subtle.verify(
      'HMAC',
      await getSigningKey(),
      decodeBase64Url(encodedSignature),
      encoder.encode(payload)
    );
    if (!isValid) return null;

    const decodedPayload = JSON.parse(decoder.decode(decodeBase64Url(payload)));
    if (
      !Number.isInteger(decodedPayload.expiresAt) ||
      decodedPayload.expiresAt <= Math.floor(Date.now() / 1000) ||
      !isSessionUser(decodedPayload.user)
    ) {
      return null;
    }

    return decodedPayload.user;
  } catch {
    return null;
  }
}
