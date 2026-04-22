/**
 * Admin authentication utilities — JWT signing, verification, and password hashing.
 * Server-side only (uses jsonwebtoken + bcryptjs).
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AdminRole, Permission } from './admin-roles';

const SESSION_DURATION_HOURS = 8;
const BCRYPT_ROUNDS = 10;

export interface AdminJwtPayload {
  sub: string;            // adminUser document id
  username: string;
  role: AdminRole;
  permissionsOverride?: Permission[] | null;
}

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_JWT_SECRET is missing or too short. Set a 48+ character secret in .env.local.'
    );
  }
  return secret;
}

export function signAdminToken(payload: AdminJwtPayload): {
  token: string;
  expiresIn: number;
} {
  const expiresIn = SESSION_DURATION_HOURS * 60 * 60; // seconds
  const token = jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn,
    issuer: 'flowbooks-admin',
    audience: 'flowbooks-admin-panel',
  });
  return { token, expiresIn };
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer: 'flowbooks-admin',
    audience: 'flowbooks-admin-panel',
  });
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  // jsonwebtoken adds iat, exp, iss, aud — strip them
  const { iat, exp, iss, aud, ...payload } = decoded as any;
  return payload as AdminJwtPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/**
 * Strict username validation — keeps URLs/queries safe and avoids ambiguity.
 * Rules: 3–32 chars, lowercase letters, digits, underscore, hyphen, dot.
 */
export function validateUsername(username: string): { ok: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { ok: false, error: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) return { ok: false, error: 'Username must be at least 3 characters' };
  if (trimmed.length > 32) return { ok: false, error: 'Username must be at most 32 characters' };
  if (!/^[a-z0-9._-]+$/.test(trimmed)) {
    return {
      ok: false,
      error: 'Username can only contain lowercase letters, digits, dot, underscore, hyphen',
    };
  }
  return { ok: true };
}

/**
 * Password policy — minimum 8 chars, at least one letter and one number.
 */
export function validatePassword(password: string): { ok: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { ok: false, error: 'Password is required' };
  }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters' };
  if (password.length > 128) return { ok: false, error: 'Password is too long' };
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, error: 'Password must contain at least one letter and one number' };
  }
  return { ok: true };
}

export function normalizeUsername(username: string): string {
  return (username || '').trim().toLowerCase();
}
