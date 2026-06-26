import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../database/prisma';
import { config } from '../config';
import { AuthProvider, AuthUser } from './authProvider';
import { ApiError } from '../middleware/errorHandler';

/**
 * Local authentication provider using bcrypt + PostgreSQL.
 * Implements the AuthProvider interface for easy swap to LDAP later.
 */
export class LocalAuthProvider implements AuthProvider {
  async authenticate(username: string, password: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async getUserById(id: number): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
    role: string;
  }): Promise<AuthUser> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });

    if (existing) {
      throw new ApiError(409, 'Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        displayName: data.displayName,
        role: data.role as any,
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async updateUser(id: number, data: Partial<{
    email: string;
    displayName: string;
    role: string;
    isActive: boolean;
  }>): Promise<AuthUser> {
    const user = await prisma.user.update({
      where: { id },
      data: data as any,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async changePassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async listUsers(): Promise<AuthUser[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
    }));
  }
}

// ─── JWT Helpers ──────────────────────────────────────────────────

export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}

export function generateRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload;
}

// Singleton instance
export const authProvider = new LocalAuthProvider();
