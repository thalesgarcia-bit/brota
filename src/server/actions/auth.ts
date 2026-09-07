'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { signOut } from '@/lib/auth';

export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
  // Sem isto, o cabeçalho e as páginas já visitadas continuariam sendo
  // servidos do cache do roteador com o avatar de quem acabou de sair.
  revalidatePath('/', 'layout');
  redirect('/');
}
