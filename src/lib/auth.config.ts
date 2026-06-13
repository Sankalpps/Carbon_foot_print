import type { NextAuthConfig } from 'next-auth';

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.AUTH_SECRET &&
  !process.env.NEXTAUTH_SECRET &&
  process.env.NEXT_PHASE !== 'phase-production-build'
) {
  throw new Error('AUTH_SECRET environment variable is required in production');
}

export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Configured with credentials in auth.ts
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
