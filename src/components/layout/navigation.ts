import type { IconName } from '@/components/ui/icon';
import type { Permission } from '@/lib/auth/rbac';

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

/**
 * Áreas do painel.
 *
 * Cada uma declara aqui a mesma permissão que a página exige do servidor. Foi
 * assim para que o menu nunca ofereça uma porta que a pessoa não consegue
 * abrir — antes, a lista de quem vê o quê era mantida à mão em outro arquivo,
 * e bastava alguém mudar um papel para as duas discordarem.
 */
// Fora da lista por ora: /admin/estabelecimentos. A tela existe e lista a
// tabela de estabelecimentos escolhidos a dedo, mas ainda não há como
// cadastrar um, e a página pública não lê essa tabela — ela consulta o
// OpenStreetMap ao vivo. Uma aba que não faz nada confunde mais do que ajuda;
// ela volta quando o cadastro existir.
export const ADMIN_NAV: {
  href: string;
  label: string;
  icon: IconName;
  permission: Permission;
}[] = [
  { href: '/admin', label: 'Visão geral', icon: 'chart', permission: 'admin:view' },
  { href: '/admin/plantas', label: 'Plantas', icon: 'leaf', permission: 'admin:manage_plants' },
  { href: '/admin/identificacoes', label: 'Identificações', icon: 'scan', permission: 'admin:review_identifications' },
  { href: '/admin/sugestoes', label: 'Sugestões', icon: 'edit', permission: 'admin:review_suggestions' },
  { href: '/admin/publicacoes', label: 'Publicações', icon: 'image', permission: 'moderation:view' },
  { href: '/admin/comentarios', label: 'Comentários', icon: 'message', permission: 'moderation:view' },
  { href: '/admin/denuncias', label: 'Denúncias', icon: 'flag', permission: 'moderation:handle_reports' },
  { href: '/admin/usuarios', label: 'Usuários', icon: 'users', permission: 'admin:manage_users' },
  { href: '/admin/conteudos', label: 'Conteúdos', icon: 'book', permission: 'admin:manage_content' },
  { href: '/admin/configuracoes', label: 'Configurações', icon: 'settings', permission: 'admin:manage_settings' },
  { href: '/admin/logs', label: 'Registros', icon: 'list', permission: 'admin:view_logs' },
];
