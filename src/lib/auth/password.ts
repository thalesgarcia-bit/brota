import bcrypt from 'bcryptjs';

/**
 * O sistema nunca guarda senhas. Guarda apenas o hash bcrypt.
 * O custo 12 equilibra segurança e tempo de resposta em hardware modesto.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    // Compara mesmo assim contra um hash descartável para que o tempo de
    // resposta não revele se o e-mail existe (timing attack).
    await bcrypt.compare(plain, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu');
    return false;
  }
  return bcrypt.compare(plain, hash);
}
