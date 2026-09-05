import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignUpForm } from './sign-up-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie sua conta no BROTA e descubra as plantas que combinam com você.',
  robots: { index: false },
};

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect('/feed');

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl">Vamos começar</h1>
      <p className="mt-2 text-sm text-ink-600">
        Em seguida você responde algumas perguntas rápidas e recebe as espécies
        que combinam com o seu espaço.
      </p>

      <SignUpForm />

      <p className="mt-6 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">
        Já tem conta?{' '}
        <Link
          href="/entrar"
          className="font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
