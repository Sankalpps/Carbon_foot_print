import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockValues } = vi.hoisted(() => ({
  mockValues: {
    mockAuthorize: null as unknown as ((credentials: Record<string, unknown>) => Promise<Record<string, unknown> | null>) | null,
  },
}));

const mockFindUnique = vi.fn();
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(async (raw: string, hashed: string) => raw === hashed.replace('hashed-', '')),
  },
}));

vi.mock('next-auth', () => {
  return {
    default: vi.fn((config: Record<string, unknown>) => {
      // Find credentials provider and grab authorize function
      const providers = (config.providers || []) as Record<string, unknown>[];
      const credentialsProvider = providers.find((p) => p.id === 'credentials' || p.name === 'credentials');
      mockValues.mockAuthorize = credentialsProvider?.authorize as unknown as ((credentials: Record<string, unknown>) => Promise<Record<string, unknown> | null>);
      return {
        handlers: {},
        signIn: vi.fn(),
        signOut: vi.fn(),
        auth: vi.fn(),
      };
    }),
  };
});

vi.mock('next-auth/providers/credentials', () => {
  return {
    default: vi.fn((config: Record<string, unknown>) => ({
      id: 'credentials',
      name: 'credentials',
      ...config,
    })),
  };
});

import { authConfig } from '../auth.config';
import '../auth'; // imports auth to trigger the NextAuth config call
import bcrypt from 'bcryptjs';

describe('auth callbacks & config', () => {
  describe('auth.config.ts', () => {
    it('should have standard session config', () => {
      expect(authConfig.session?.strategy).toBe('jwt');
      expect(authConfig.pages?.signIn).toBe('/login');
    });

    it('should update jwt token with user ID', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      if (!jwtCallback) throw new Error('jwt callback is undefined');

      const token = {};
      const user = { id: 'user_123' };

      const result = await jwtCallback({ token, user } as unknown as Parameters<NonNullable<typeof authConfig.callbacks.jwt>>[0]);
      expect(result).toEqual({ id: 'user_123' });
    });

    it('should update session user with token ID', async () => {
      const sessionCallback = authConfig.callbacks?.session;
      if (!sessionCallback) throw new Error('session callback is undefined');

      const session = { user: { name: 'John' } };
      const token = { id: 'user_123' };

      const result = await sessionCallback({ session, token } as unknown as Parameters<NonNullable<typeof authConfig.callbacks.session>>[0]);
      expect(result.user.id).toBe('user_123');
    });

    it('should throw error in production if no AUTH_SECRET is set', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.AUTH_SECRET;
      const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;
      const originalNextPhase = process.env.NEXT_PHASE;

      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXT_PHASE;

      vi.resetModules();

      await expect(import('../auth.config')).rejects.toThrow(
        'AUTH_SECRET environment variable is required in production'
      );

      // Restore env vars
      process.env.NODE_ENV = originalEnv;
      process.env.AUTH_SECRET = originalSecret;
      process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
      process.env.NEXT_PHASE = originalNextPhase;
    });
  });

  describe('auth.ts credentials authorize', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should authorize user with valid credentials', async () => {
      expect(mockValues.mockAuthorize).toBeDefined();

      mockFindUnique.mockResolvedValue({
        id: 'user_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        hashedPassword: 'password123',
      });

      const user = await mockValues.mockAuthorize({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'jane@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'password123');
      expect(user).toEqual({
        id: 'user_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });

    it('should return null if login schema validation fails', async () => {
      const user = await mockValues.mockAuthorize({
        email: 'invalid-email',
        password: '',
      });
      expect(user).toBeNull();
    });

    it('should return null if user is not found in database', async () => {
      mockFindUnique.mockResolvedValue(null);

      const user = await mockValues.mockAuthorize({
        email: 'missing@example.com',
        password: 'password123',
      });

      expect(user).toBeNull();
    });

    it('should return null if password compare fails', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'user_999',
        name: 'Jane Doe',
        email: 'jane@example.com',
        hashedPassword: 'hashed-password123',
      });

      const user = await mockValues.mockAuthorize({
        email: 'jane@example.com',
        password: 'wrongpassword',
      });

      expect(user).toBeNull();
    });
  });
});
