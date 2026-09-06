import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { OnboardingWizard } from './wizard';

// Consulta o banco a cada requisicao, nunca durante o build (Cloudflare + Prisma).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vamos descobrir quais plantas combinam com você',
  robots: { index: false },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ refazer?: string }>;
}) {
  const user = await requireUser('/onboarding');
  const { refazer } = await searchParams;

  const existing = await prisma.greenProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existing && !refazer) redirect('/recomendacoes');

  return <OnboardingWizard />;
}
