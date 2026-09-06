import type { Metadata } from 'next';
import Link from 'next/link';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';
import { DeleteAccountSection } from './delete-account';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Configurações',
  robots: { index: false },
};

export default async function SettingsPage() {
  const sessionUser = await requireUser('/configuracoes');

  const profile = await prisma.profile.findUnique({
    where: { userId: sessionUser.id },
  });

  if (!profile) {
    return (
      <div className="container-page py-10">
        <p className="text-ink-600">Não encontramos o seu perfil.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl">Configurações</h1>
          <p className="mt-1.5 flex items-center gap-2 text-ink-600">
            {sessionUser.email}
            <Badge tone="neutral">{ROLE_LABELS[sessionUser.role]}</Badge>
          </p>
        </header>

        <Card>
          <h2 className="text-lg">Perfil</h2>
          <p className="mt-1 text-sm text-ink-600">
            É o que outras pessoas veem sobre você. Seu e-mail nunca aparece aqui.
          </p>
          <div className="mt-5">
            <ProfileForm
              initial={{
                displayName: profile.displayName,
                username: profile.username,
                bio: profile.bio,
                city: profile.city,
                state: profile.state,
                showLocation: profile.showLocation,
                isPublic: profile.isPublic,
                experienceLevel: profile.experienceLevel,
                avatarUrl: profile.avatarUrl,
              }}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg">Perfil Verde</h2>
          <p className="mt-1 text-sm text-ink-600">
            As respostas que alimentam as suas recomendações.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/onboarding?refazer=1"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              <Icon name="refresh" size={15} />
              Refazer o questionário
            </Link>
            <Link
              href="/recomendacoes"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              <Icon name="sparkle" size={15} />
              Ver minhas recomendações
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg">Senha</h2>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg">Seus dados</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            O BROTA guarda apenas o necessário para o sistema funcionar. Leia a{' '}
            <Link href="/privacidade" className="text-brand-700 underline">
              política de privacidade
            </Link>{' '}
            para entender exatamente o quê e por quê.
          </p>
        </Card>

        <DeleteAccountSection />
      </div>
    </div>
  );
}
