import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/dal/users';
import { z } from 'zod';

const registerApiSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors[0].message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create the user
    await createUser({ name, email, password });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
