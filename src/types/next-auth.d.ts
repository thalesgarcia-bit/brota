import type { Role } from '@/generated/prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string | null;
      hasGreenProfile: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: Role;
    username?: string | null;
    hasGreenProfile?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    username: string | null;
    hasGreenProfile: boolean;
  }
}

export {};
