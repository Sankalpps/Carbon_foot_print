import { vi, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class MockPrismaClient {},
  };
});

import { db } from '../db';

describe('db singleton', () => {
  it('should export a PrismaClient instance', () => {
    expect(db).toBeDefined();
  });
});
