import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como o BROTA coleta, usa e protege dados pessoais, em conformidade com a LGPD.',
  alternates: { canonical: '/privacidade' },
};

export default function PrivacyPage() {
  return (
    <div className="container-reading py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-ink-500">Versão de setembro de 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed text-ink-700">
        <section>
          <p>
            Esta política explica quais dados o BROTA coleta, por que coleta e o
            que você pode fazer a respeito. Ela segue a Lei Geral de Proteção de
            Dados Pessoais (Lei 13.709/2018).
          </p>
          <p className="mt-3">
            O BROTA é um projeto educacional e pode ser usado por estudantes. Por
            isso adotamos o princípio da <strong>coleta mínima</strong>: pedimos
            apenas o indispensável para o sistema funcionar.
          </p>
        </section>

        <section>
          <h2 className="text-xl">1. Quais dados coletamos</h2>
          <h3 className="mt-4 text-base font-semibold">Para criar a conta</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome de exibição e nome de usuário</li>
            <li>E-mail</li>
            <li>Senha (guardada apenas como hash criptográfico, nunca em texto)</li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">Se você escolher fornecer</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Foto de perfil e biografia</li>
            <li>Cidade e estado (nunca endereço nem coordenadas)</li>
            <li>Respostas do questionário do Perfil Verde</li>
            <li>Plantas do seu jardim, registros do diário e fotos</li>
            <li>Publicações, comentários e reações</li>
          </ul>

          <h3 className="mt-4 text-base font-semibold">Automaticamente</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Termos pesquisados no catálogo, para saber o que melhorar</li>
            <li>Registros técnicos de erro, sem conteúdo pessoal</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">2. Localização</h2>
          <p className="mt-2">
            A localização precisa recebe tratamento especial:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Só é solicitada quando você clica em “usar minha localização” na
              página Onde comprar, e apenas para aquela busca.
            </li>
            <li>Não é guardada no banco de dados nem associada à sua conta.</li>
            <li>
              Publicações registram no máximo cidade e estado, e apenas se você
              preencher.
            </li>
            <li>Você pode recusar a permissão e informar a cidade manualmente.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">3. Para que usamos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Autenticar você e manter sua sessão</li>
            <li>Gerar recomendações personalizadas de espécies</li>
            <li>Exibir seu perfil e suas publicações para a comunidade</li>
            <li>Avisar sobre comentários, identificações e sugestões</li>
            <li>Moderar conteúdo e investigar denúncias</li>
            <li>Entender o uso do sistema de forma agregada, para melhorá-lo</li>
          </ul>
          <p className="mt-3">
            <strong>Não vendemos dados.</strong> Não usamos os seus dados para
            publicidade e não os compartilhamos com anunciantes.
          </p>
        </section>

        <section>
          <h2 className="text-xl">4. O que é público</h2>
          <p className="mt-2">
            Seu nome de exibição, nome de usuário, foto de perfil, biografia,
            publicações, comentários e a cidade (se você marcar para exibir) são
            visíveis para outras pessoas.
          </p>
          <p className="mt-2">
            <strong>Seu e-mail nunca é público.</strong> Ele não aparece no seu
            perfil e não é acessível a outros usuários.
          </p>
          <p className="mt-2">
            Você pode marcar o perfil como privado nas configurações.
          </p>
        </section>

        <section>
          <h2 className="text-xl">5. Serviços de terceiros</h2>
          <ul className="mt-3 space-y-3">
            <li>
              <strong>Pl@ntNet</strong> — quando você usa a identificação por
              foto, a imagem é enviada ao serviço para análise. Nenhum dado
              pessoal seu acompanha a imagem.
            </li>
            <li>
              <strong>OpenStreetMap</strong> — a busca por estabelecimentos passa
              pelo nosso servidor, e não pelo seu navegador. As coordenadas
              consultadas não ficam associadas à sua conta.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">6. Seus direitos</h2>
          <p className="mt-2">A LGPD garante que você pode:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Confirmar que tratamos seus dados e acessá-los</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão da conta e dos dados pessoais</li>
            <li>Revogar consentimentos dados anteriormente</li>
            <li>Obter informação sobre com quem compartilhamos dados</li>
          </ul>
          <p className="mt-3">
            A exclusão da conta está disponível em{' '}
            <strong>Configurações → Excluir conta</strong>. Ela remove seus dados
            pessoais e anonimiza o que precisa ser preservado por integridade
            (como o registro de que uma sugestão foi aprovada).
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. Segurança</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Comunicação criptografada (HTTPS)</li>
            <li>Controle de acesso verificado no servidor, não só na interface</li>
            <li>Uploads validados pelo conteúdo do arquivo</li>
            <li>Registro de ações administrativas para auditoria</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">8. Menores de idade</h2>
          <p className="mt-2">
            O BROTA nasceu em contexto escolar e pode ser usado por adolescentes.
            Não coletamos dados pessoais sensíveis, não pedimos documento e não
            exibimos localização precisa de ninguém. Responsáveis podem solicitar
            a exclusão da conta de um menor a qualquer momento pelo contato
            abaixo.
          </p>
        </section>

        <section>
          <h2 className="text-xl">9. Contato</h2>
          <p className="mt-2">
            Dúvidas sobre privacidade podem ser enviadas pela página de{' '}
            <Link href="/contato" className="text-brand-700 underline underline-offset-2">
              contato
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
