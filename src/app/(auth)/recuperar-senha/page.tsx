import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { requestPasswordResetAction } from '@/server/actions/password';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  robots: { index: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl">Recuperar senha</h1>
      <p className="mt-2 text-sm text-ink-600">
        Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um
        link para você criar uma nova senha.
      </p>

      {enviado ? (
        <Alert tone="success" className="mt-6" title="Pedido registrado">
          Se houver uma conta com esse e-mail, o link de recuperação chegará em
          instantes. Confira também a caixa de spam.
        </Alert>
      ) : (
        <form action={requestPasswordResetAction} className="mt-6 space-y-4">
          <Field id="email" label="E-mail" required>
            {(props) => (
              <Input
                {...props}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                required
              />
            )}
          </Field>

          <SubmitButton fullWidth size="lg">
            Enviar link de recuperação
          </SubmitButton>
        </form>
      )}

      <p className="mt-6 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">
        <Link
          href="/entrar"
          className="font-medium text-brand-700 underline-offset-2 hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
