#!/usr/bin/env node
/* =============================================================================
 * Confere o contrato da API do Pl@ntNet com uma fotografia real.
 *
 * Uso:  npm run check:plantnet -- caminho/da/foto.jpg [orgao]
 *       orgao: leaf | flower | fruit | bark | habit | auto   (padrão: auto)
 *
 * Por que este script existe: o adapter valida a resposta com Zod e falha de
 * forma explícita se a API mudar de formato. Rodar isto antes de subir para
 * produção confirma o contrato sem depender de uma tela.
 * ========================================================================== */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(process.cwd(), file);
    if (!existsSync(full)) continue;
    for (const raw of readFileSync(full, 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const at = line.indexOf('=');
      if (at === -1) continue;
      const key = line.slice(0, at).trim();
      if (key in process.env) continue;
      let value = line.slice(at + 1).trim();
      if (/^["'].*["']$/.test(value)) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

loadEnv();

const [, , filePath, organ = 'auto'] = process.argv;

if (!filePath) {
  console.error('Informe o caminho de uma foto.\n  npm run check:plantnet -- foto.jpg');
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

const apiKey = process.env.PLANTNET_API_KEY;
if (!apiKey) {
  console.error('PLANTNET_API_KEY não definida no .env.local.');
  process.exit(1);
}

const project = process.env.PLANTNET_PROJECT ?? 'all';
const url = new URL(`https://my-api.plantnet.org/v2/identify/${project}`);
url.searchParams.set('api-key', apiKey);
url.searchParams.set('include-related-images', 'true');
url.searchParams.set('no-reject', 'false');
url.searchParams.set('nb-results', '5');
url.searchParams.set('lang', 'pt');

const buffer = readFileSync(filePath);
const form = new FormData();
form.append('images', new Blob([buffer]), path.basename(filePath));
form.append('organs', organ);

console.log(`\nConsultando o Pl@ntNet (projeto "${project}", órgão "${organ}")…\n`);

const response = await fetch(url, { method: 'POST', body: form });

if (!response.ok) {
  console.error(`✗ HTTP ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const payload = await response.json();

/* Confere exatamente os campos que o adapter consome. */
const problems = [];
const require = (condition, message) => {
  if (!condition) problems.push(message);
};

require(Array.isArray(payload.results), 'results não é um array');

for (const [index, result] of (payload.results ?? []).entries()) {
  require(typeof result.score === 'number', `results[${index}].score não é número`);
  require(
    typeof result.species?.scientificNameWithoutAuthor === 'string',
    `results[${index}].species.scientificNameWithoutAuthor ausente`,
  );
  require(
    result.species?.commonNames === undefined ||
      Array.isArray(result.species.commonNames),
    `results[${index}].species.commonNames não é array`,
  );
  require(
    result.species?.family === undefined ||
      typeof result.species.family?.scientificNameWithoutAuthor === 'string',
    `results[${index}].species.family com formato inesperado`,
  );
}

console.log('Melhor correspondência:', payload.bestMatch ?? '—');
console.log('Consultas restantes:', payload.remainingIdentificationRequests ?? '—');
console.log('\nCandidatos:');
for (const result of payload.results ?? []) {
  const names = (result.species?.commonNames ?? []).slice(0, 2).join(', ');
  console.log(
    `  ${Math.round(result.score * 100).toString().padStart(3)}%  ` +
      `${result.species?.scientificNameWithoutAuthor}` +
      (names ? `  (${names})` : ''),
  );
}

if (problems.length > 0) {
  console.error('\n✗ O contrato da API MUDOU. Ajuste src/domain/identification/plantnet.ts:');
  problems.forEach((problem) => console.error('  •', problem));
  process.exit(1);
}

console.log('\n✓ Contrato confirmado: o adapter do BROTA lê esta resposta corretamente.\n');
