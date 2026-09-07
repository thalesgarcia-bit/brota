import type { Role } from '@prisma/client';
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
    /** Quando os dados do token foram conferidos no banco pela última vez. */
    conferidoEm?: number;
  }
}

export {};
