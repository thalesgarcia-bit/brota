'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { encerrarSessao } from '@/lib/auth/sign-out';

export async function signOutAction(): Promise<void> {
  await encerrarSessao();
  // Sem isto, o cabeçalho e as páginas já visitadas continuariam sendo
  // servidos do cache do roteador com o avatar de quem acabou de sair.
  revalidatePath('/', 'layout');
  redirect('/');
}
