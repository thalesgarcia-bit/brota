import type { ReactNode } from 'react';

/* ===========================================================================
 * RENDERIZADOR DE MARKDOWN
 *
 * Suporta apenas o subconjunto que os conteúdos educativos usam: títulos,
 * parágrafos, listas, tabelas, citações e ênfase. Nada de HTML bruto.
 *
 * Escrever isto — em vez de trazer uma biblioteca de markdown e um sanitizador —
 * evita duas dependências e elimina por construção o risco de injeção: o texto
 * vira elementos React, nunca `dangerouslySetInnerHTML`.
 * =========================================================================== */

/** Ênfase em linha: **negrito**, *itálico*, `código` e [link](url). */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    index += 1;

    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink-900">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-xs bg-ink-100 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(token);
      const label = linkMatch?.[1] ?? token;
      const href = linkMatch?.[2] ?? '#';
      const external = href.startsWith('http');
      nodes.push(
        <a
          key={key}
          href={href}
          {...(external
            ? { target: '_blank', rel: 'noreferrer noopener' }
            : {})}
          className="text-brand-700 underline underline-offset-2 hover:text-brand-800"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];

  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();

    // Linha em branco
    if (!trimmed) {
      index += 1;
      continue;
    }

    // Títulos
    const heading = /^(#{2,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1]!.length;
      const text = heading[2]!;
      const className =
        level === 2
          ? 'mt-10 text-2xl first:mt-0'
          : level === 3
            ? 'mt-8 text-xl'
            : 'mt-6 text-lg';

      blocks.push(
        level === 2 ? (
          <h2 key={key++} className={className}>
            {renderInline(text, `h${key}`)}
          </h2>
        ) : level === 3 ? (
          <h3 key={key++} className={className}>
            {renderInline(text, `h${key}`)}
          </h3>
        ) : (
          <h4 key={key++} className={className}>
            {renderInline(text, `h${key}`)}
          </h4>
        ),
      );
      index += 1;
      continue;
    }

    // Tabela
    if (trimmed.startsWith('|') && (lines[index + 1] ?? '').includes('---')) {
      const header = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && (lines[index] ?? '').trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index]!));
        index += 1;
      }

      blocks.push(
        <div key={key++} className="scroll-x my-6 rounded-lg border border-ink-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ink-50">
                {header.map((cell, cellIndex) => (
                  <th
                    key={cellIndex}
                    scope="col"
                    className="border-b border-ink-200 px-4 py-2.5 text-left font-semibold text-ink-800"
                  >
                    {renderInline(cell, `th-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-ink-100 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2.5 align-top text-ink-700">
                      {renderInline(cell, `td-${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Lista não ordenada
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={key++} className="my-4 list-disc space-y-1.5 pl-5 text-ink-700">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `li-${itemIndex}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Lista ordenada
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={key++} className="my-4 list-decimal space-y-1.5 pl-5 text-ink-700">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, `oli-${itemIndex}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Citação
    if (trimmed.startsWith('>')) {
      const quote: string[] = [];
      while (index < lines.length && (lines[index] ?? '').trim().startsWith('>')) {
        quote.push((lines[index] ?? '').trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-5 border-l-3 border-brand-300 bg-brand-50/50 py-3 pl-4 text-ink-700 italic"
        >
          {renderInline(quote.join(' '), `quote-${key}`)}
        </blockquote>,
      );
      continue;
    }

    // Parágrafo
    const paragraph: string[] = [];
    while (index < lines.length && (lines[index] ?? '').trim()) {
      const current = (lines[index] ?? '').trim();
      if (
        /^(#{2,4})\s/.test(current) ||
        /^[-*]\s/.test(current) ||
        /^\d+\.\s/.test(current) ||
        current.startsWith('>') ||
        current.startsWith('|')
      ) {
        break;
      }
      paragraph.push(current);
      index += 1;
    }

    if (paragraph.length > 0) {
      blocks.push(
        <p key={key++} className="my-4 leading-relaxed text-ink-700">
          {renderInline(paragraph.join(' '), `p-${key}`)}
        </p>,
      );
    }
  }

  return <div className="text-base">{blocks}</div>;
}
