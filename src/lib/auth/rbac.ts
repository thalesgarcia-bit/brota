import type { Role } from '@prisma/client';

/**
 * Controle de acesso baseado em papéis.
 *
 * Regra do projeto: esconder um botão no frontend NÃO é controle de acesso.
 * Toda rota de servidor, server action e endpoint verifica a permissão aqui.
 */

export const PERMISSIONS = [
  'post:create',
  'post:comment',
  'post:react',
  'post:save',
  'plant:suggest',
  'garden:manage',
  'identification:create',
  'report:create',

  'moderation:view',
  'moderation:hide_content',
  'moderation:handle_reports',

  'admin:view',
  'admin:manage_plants',
  'admin:review_identifications',
  'admin:review_suggestions',
  'admin:manage_users',
  'admin:manage_content',
  'admin:manage_settings',
  'admin:view_logs',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const USER_PERMISSIONS: Permission[] = [
  'post:create',
  'post:comment',
  'post:react',
  'post:save',
  'plant:suggest',
  'garden:manage',
  'identification:create',
  'report:create',
];

const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  'moderation:view',
  'moderation:hide_content',
  'moderation:handle_reports',
];

const ADMIN_PERMISSIONS: Permission[] = [...PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  USER: USER_PERMISSIONS,
  MODERATOR: MODERATOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(
  role: Role | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** Papéis com acesso a qualquer área do painel administrativo. */
export function isStaff(role: Role | null | undefined): boolean {
  return role === 'ADMIN' || role === 'MODERATOR';
}

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Usuário',
  MODERATOR: 'Moderador',
  ADMIN: 'Administrador',
};
