import Link from 'next/link';

import { BrotaLogo } from '@/components/ui/logo';
import { FOOTER_LINKS } from './navigation';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-25">
      <div className="container-page py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BrotaLogo size="md" withTagline />
            <p className="mt-4 max-w-xs text-sm text-ink-600">
              O conhecimento também brota quando é cultivado em comunidade.
            </p>
          </div>

          <nav aria-label="Rodapé">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-2.5 sm:grid-cols-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-ink-200 pt-6">
          <p className="text-xs leading-relaxed text-ink-500">
            Idealizado pela turma do 9º ano da Escola Criativa de Uberaba
            na disciplina de Projeto de Vida, sob a coordenação da Profª
            Carol Manhezzo. O BROTA foi desenvolvido pelos estudantes com
            apoio do Prof. Thales Garcia.
          </p>
          <p className="mt-2 text-xs text-ink-400">
            Dados de estabelecimentos: © colaboradores do OpenStreetMap.
          </p>
        </div>
      </div>
    </footer>
  );
}
