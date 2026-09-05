import { getSessionUser } from '@/lib/auth/session';
import { isStaff } from '@/lib/auth/rbac';
import { prisma } from '@/lib/db/prisma';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SiteFooter } from '@/components/layout/footer';

/**
 * Casca da aplicação.
 * A mesma estrutura serve páginas públicas e privadas: o que muda é o conteúdo
 * da navegação, nunca o esqueleto — assim a experiência não "troca de site"
 * quando o usuário entra na conta.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  const unreadNotifications = user
    ? await prisma.notification.count({
        where: { userId: user.id, readAt: null },
      })
    : 0;

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar isAuthenticated={Boolean(user)} isStaff={isStaff(user?.role)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={
            user
              ? {
                  name: user.name ?? 'Você',
                  username: user.username,
                  image: user.image,
                }
              : null
          }
          unreadNotifications={unreadNotifications}
          isStaff={isStaff(user?.role)}
        />

        <main
          id="conteudo"
          className="flex-1 pb-[calc(var(--spacing-tabbar)+1rem)] lg:pb-0"
        >
          {children}
        </main>

        <SiteFooter />
      </div>

      <BottomNav isAuthenticated={Boolean(user)} />
    </div>
  );
}
