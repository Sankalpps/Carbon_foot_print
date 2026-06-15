import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockFindUnique = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (pw: string) => `hashed-${pw}`),
  },
}));

import { createUser, getUserByEmail, getUserById } from '../users';
import bcrypt from 'bcryptjs';

describe('Users DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should hash the password and create the user', async () => {
      const mockResult = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      };
      mockCreate.mockResolvedValue(mockResult);

      const result = await createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          hashedPassword: 'hashed-password123',
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserByEmail', () => {
    it('should query user table by email address', async () => {
      const mockUser = {
        id: 'user_1',
        email: 'john@example.com',
        hashedPassword: 'hashed-password123',
      };
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await getUserByEmail('john@example.com');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should query user table by id with selected fields', async () => {
      const mockUser = {
        id: 'user_1',
        name: 'John Doe',
        email: 'john@example.com',
        region: 'uk',
        createdAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(mockUser);

      const result = await getUserById('user_1');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'user_1' },
        select: {
          id: true,
          name: true,
          email: true,
          region: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
