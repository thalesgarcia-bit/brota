#!/usr/bin/env node
/* Verificação do ambiente antes do primeiro `npm run dev`. */

import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const problems = [];
const notes = [];

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20) problems.push(`Node ${process.versions.node} — o BROTA precisa da versão 20.11 ou superior.`);

if (!existsSync('.env.local')) {
  if (existsSync('.env.example')) {
    copyFileSync('.env.example', '.env.local');
    notes.push('Criamos o .env.local a partir do .env.example. Preencha DATABASE_URL e AUTH_SECRET.');
  } else {
    problems.push('Nenhum .env.local nem .env.example encontrado.');
  }
}

if (existsSync('.env.local')) {
  const env = readFileSync('.env.local', 'utf8');
  const value = (key) => (env.match(new RegExp(`^${key}="?([^"\n]*)"?`, 'm')) ?? [])[1] ?? '';

  if (!value('DATABASE_URL')) problems.push('DATABASE_URL está vazia no .env.local.');
  if (!value('DIRECT_URL')) {
    notes.push('DIRECT_URL está vazia. Sem ela o `npm run db:deploy` falha — é a conexão direta (porta 5432) que o Prisma usa para criar as tabelas.');
  }
  if (value('DATABASE_URL').includes(':5432') && value('DATABASE_URL').includes('pooler')) {
    notes.push('A DATABASE_URL parece estar usando a porta 5432. Para a aplicação, use a porta 6543 (pooler); deixe a 5432 para a DIRECT_URL.');
  }

  const secret = value('AUTH_SECRET');
  if (!secret || secret.includes('troque')) {
    notes.push(`Defina um AUTH_SECRET. Sugestão gerada agora:\n     AUTH_SECRET="${randomBytes(32).toString('base64')}"`);
  }

  if (!value('PLANTNET_API_KEY')) {
    notes.push('PLANTNET_API_KEY não definida — a identificação por foto ficará visivelmente indisponível.');
  }
}

console.log('\nBROTA — verificação do ambiente\n');

if (notes.length > 0) {
  console.log('Atenção:');
  notes.forEach((note) => console.log('  •', note));
  console.log('');
}

if (problems.length > 0) {
  console.log('Impedimentos:');
  problems.forEach((problem) => console.log('  ✗', problem));
  console.log('\nCorrija os itens acima e rode de novo.\n');
  process.exit(1);
}

console.log('✓ Ambiente pronto.\n');
console.log('Próximos passos:');
console.log('  1. docker compose up -d      (ou aponte DATABASE_URL para outro Postgres)');
console.log('  2. npm run db:migrate');
console.log('  3. npm run db:seed');
console.log('  4. npm run dev\n');
