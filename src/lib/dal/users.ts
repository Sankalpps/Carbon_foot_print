import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

/**
 * Create a new user with hashed password.
 */
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  return db.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

/**
 * Find user by email (for authentication).
 */
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

/**
 * Find user by ID (for profile).
 */
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      region: true,
      createdAt: true,
    },
  });
}
