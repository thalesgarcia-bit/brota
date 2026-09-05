import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Carrega as variáveis de ambiente para scripts executados fora do Next.
 *
 * O Next lê `.env.local` sozinho; o seed e os scripts auxiliares, não.
 * A ordem segue a convenção do Next: o primeiro arquivo a definir uma
 * variável vence, e valores já presentes no ambiente nunca são sobrescritos.
 */
const FILES = ['.env.local', '.env.development.local', '.env'];

export function loadEnvFiles(cwd: string = process.cwd()): void {
  for (const file of FILES) {
    const fullPath = path.join(cwd, file);
    if (!existsSync(fullPath)) continue;

    for (const rawLine of readFileSync(fullPath, 'utf8').split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separator = line.indexOf('=');
      if (separator === -1) continue;

      const key = line.slice(0, separator).trim();
      if (!key || key in process.env) continue;

      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}
