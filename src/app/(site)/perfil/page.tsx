import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';

export default async function MyProfileRedirect() {
  const user = await requireUser('/perfil');
  redirect(user.username ? `/perfil/${user.username}` : '/configuracoes');
}
