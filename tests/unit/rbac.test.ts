import { describe, expect, it } from 'vitest';

import { can, canAny, isStaff, PERMISSIONS } from '@/lib/auth/rbac';

/* Permissão é a única coisa que separa um usuário comum do painel
 * administrativo. Estes testes garantem que a matriz não afrouxe sem querer. */

describe('permissões por papel', () => {
  it('usuário comum não acessa nada de administração', () => {
    const adminPermissions = PERMISSIONS.filter((permission) =>
      permission.startsWith('admin:'),
    );
    for (const permission of adminPermissions) {
      expect(can('USER', permission)).toBe(false);
    }
  });

  it('usuário comum não modera', () => {
    expect(can('USER', 'moderation:hide_content')).toBe(false);
    expect(can('USER', 'moderation:handle_reports')).toBe(false);
  });

  it('usuário comum faz o que a comunidade precisa', () => {
    expect(can('USER', 'post:create')).toBe(true);
    expect(can('USER', 'post:comment')).toBe(true);
    expect(can('USER', 'plant:suggest')).toBe(true);
    expect(can('USER', 'garden:manage')).toBe(true);
    expect(can('USER', 'identification:create')).toBe(true);
  });

  it('moderador modera, mas não gerencia a base botânica', () => {
    expect(can('MODERATOR', 'moderation:hide_content')).toBe(true);
    expect(can('MODERATOR', 'moderation:handle_reports')).toBe(true);
    expect(can('MODERATOR', 'admin:manage_plants')).toBe(false);
    expect(can('MODERATOR', 'admin:manage_users')).toBe(false);
  });

  it('administrador tem todas as permissões', () => {
    for (const permission of PERMISSIONS) {
      expect(can('ADMIN', permission)).toBe(true);
    }
  });

  it('visitante (sem papel) não tem nenhuma permissão', () => {
    for (const permission of PERMISSIONS) {
      expect(can(null, permission)).toBe(false);
      expect(can(undefined, permission)).toBe(false);
    }
  });

  it('reconhece quem é da equipe', () => {
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('MODERATOR')).toBe(true);
    expect(isStaff('USER')).toBe(false);
    expect(isStaff(null)).toBe(false);
  });

  it('canAny exige ao menos uma permissão', () => {
    expect(canAny('USER', ['admin:view', 'post:create'])).toBe(true);
    expect(canAny('USER', ['admin:view', 'admin:manage_users'])).toBe(false);
  });
});
