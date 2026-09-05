import type { IconName } from '@/components/ui/icon';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Aparece na barra inferior do mobile. */
  primary?: boolean;
  requiresAuth?: boolean;
};

/** Navegação principal. A ordem no mobile foi pensada para o alcance do polegar. */
export const MAIN_NAV: NavItem[] = [
  { href: '/feed', label: 'Início', icon: 'home', primary: true, requiresAuth: true },
  { href: '/explorar', label: 'Explorar', icon: 'compass', primary: true },
  { href: '/publicar', label: 'Publicar', icon: 'plus', primary: true, requiresAuth: true },
  { href: '/identificar', label: 'Identificar', icon: 'scan', primary: true },
  { href: '/jardim', label: 'Meu Jardim', icon: 'sprout', requiresAuth: true },
  { href: '/onde-comprar', label: 'Onde comprar', icon: 'mapPin' },
  { href: '/aprender', label: 'Aprender', icon: 'book' },
  { href: '/salvos', label: 'Salvos', icon: 'bookmark', requiresAuth: true },
];

export const FOOTER_LINKS = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/explorar', label: 'Explorar' },
  { href: '/aprender', label: 'Aprender' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos' },
  { href: '/contato', label: 'Contato' },
];

export const ADMIN_NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: 'Visão geral', icon: 'chart' },
  { href: '/admin/plantas', label: 'Plantas', icon: 'leaf' },
  { href: '/admin/identificacoes', label: 'Identificações', icon: 'scan' },
  { href: '/admin/sugestoes', label: 'Sugestões', icon: 'edit' },
  { href: '/admin/publicacoes', label: 'Publicações', icon: 'image' },
  { href: '/admin/comentarios', label: 'Comentários', icon: 'message' },
  { href: '/admin/denuncias', label: 'Denúncias', icon: 'flag' },
  { href: '/admin/usuarios', label: 'Usuários', icon: 'users' },
  { href: '/admin/conteudos', label: 'Conteúdos', icon: 'book' },
  { href: '/admin/estabelecimentos', label: 'Estabelecimentos', icon: 'mapPin' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: 'settings' },
  { href: '/admin/logs', label: 'Registros', icon: 'list' },
];
