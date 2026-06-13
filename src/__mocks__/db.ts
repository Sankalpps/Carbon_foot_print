import { vi } from 'vitest';

// Use vi.fn() for mock Prisma client
export const mockDb = {
  activity: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    createMany: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  goal: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  prediction: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  carbonIntensityCache: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));
