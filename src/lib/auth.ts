import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createToken, verifyToken } from '@/lib/session-token';

export type { UserRole, SessionUser } from '@/lib/session-token';
import type { SessionUser, UserRole } from '@/lib/session-token';

const SECRET_KEY = process.env.JWT_SECRET || 'kopi-mahasiswa-secret-key-2026';
const COOKIE_NAME = 'kopi_session';

// Simple deterministic hash for password
export function hashPassword(password: string): string {
  let hash = 0;
  const combined = password + SECRET_KEY;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'km_' + Math.abs(hash).toString(16) + '_hash';
}

export function verifyPassword(password: string, hash: string): boolean {
  if (hash === hashPassword(password)) return true;
  // Fallback check for HMAC SHA256 (e.g. from Prisma seed)
  try {
    const hmac = crypto.createHmac('sha256', SECRET_KEY).update(password).digest('hex');
    if (hash === hmac) return true;
  } catch {}
  return password === hash;
}

export async function setAuthSession(user: SessionUser) {
  const token = await createToken(user);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthSession() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get(COOKIE_NAME);
  if (!tokenCookie?.value) return null;
  return verifyToken(tokenCookie.value);
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getAuthSession();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
