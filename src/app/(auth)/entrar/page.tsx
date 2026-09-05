import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignInForm } from './sign-in-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Acesse sua conta no BROTA.',
  robots: { index: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const user = await getSessionUser();
  const { proximo } = await searchParams;

  if (user) redirect(proximo ?? '/feed');

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl">Que bom te ver de novo</h1>
      <p className="mt-2 text-sm text-ink-600">
        Entre para acompanhar seu jardim, suas recomendações e a comunidade.
      </p>

      <SignInForm next={proximo ?? null} />

      <p className="mt-6 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">
        Ainda não tem conta?{' '}
        <Link
          href="/cadastro"
          className="font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
