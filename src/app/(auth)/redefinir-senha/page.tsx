import type { Metadata } from 'next';
import Link from 'next/link';

import { ResetPasswordForm } from './reset-password-form';
import { Alert } from '@/components/ui/feedback';

export const metadata: Metadata = {
  title: 'Redefinir senha',
  robots: { index: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; e?: string }>;
}) {
  const { token, e } = await searchParams;

  if (!token || !e) {
    return (
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl">Link inválido</h1>
        <Alert tone="danger" className="mt-4">
          Esse link de recuperação está incompleto ou expirou.
        </Alert>
        <p className="mt-6 text-sm">
          <Link href="/recuperar-senha" className="font-medium text-brand-700 underline">
            Pedir um novo link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl">Criar nova senha</h1>
      <p className="mt-2 text-sm text-ink-600">
        Escolha uma senha com ao menos 8 caracteres, incluindo letras e números.
      </p>
      <ResetPasswordForm token={token} email={e} />
    </div>
  );
}
