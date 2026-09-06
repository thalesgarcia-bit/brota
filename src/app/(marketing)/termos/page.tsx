import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Regras de uso da plataforma BROTA.',
  alternates: { canonical: '/termos' },
};

export default function TermsPage() {
  return (
    <div className="container-reading py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl">Termos de Uso</h1>
      <p className="mt-3 text-sm text-ink-500">Versão de setembro de 2026</p>

      <div className="mt-8 space-y-8 leading-relaxed text-ink-700">
        <section>
          <h2 className="text-xl">1. O que é o BROTA</h2>
          <p className="mt-2">
            O BROTA é uma plataforma educacional sobre plantas, desenvolvida no
            contexto da disciplina de Projeto de Vida da Escola Criativa de
            Uberaba. Ao criar uma conta, você concorda com estes termos.
          </p>
        </section>

        <section>
          <h2 className="text-xl">2. Aviso importante sobre as informações</h2>
          <p className="mt-2">
            O conteúdo botânico do BROTA tem finalidade educativa. Ele{' '}
            <strong>não substitui</strong> orientação de profissionais de
            agronomia, biologia, medicina ou veterinária.
          </p>
          <p className="mt-3">
            Em caso de ingestão de qualquer planta por pessoas, procure
            atendimento médico ou ligue para o Centro de Informação e Assistência
            Toxicológica (CIATox) pelo <strong>0800 722 6001</strong>. Em caso de
            ingestão por animais, procure um médico-veterinário.
          </p>
          <p className="mt-3">
            As informações de toxicidade são compiladas de fontes públicas
            reconhecidas e podem estar incompletas. Quando a informação não foi
            confirmada, o BROTA declara isso explicitamente — trate essa marcação
            com o cuidado que ela merece.
          </p>
        </section>

        <section>
          <h2 className="text-xl">3. Sua conta</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Você é responsável por manter sua senha em segurança.</li>
            <li>Informe dados verdadeiros no cadastro.</li>
            <li>Uma pessoa, uma conta.</li>
            <li>Você pode excluir sua conta a qualquer momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">4. Conteúdo que você publica</h2>
          <p className="mt-2">
            Você continua sendo dono do que publica. Ao publicar, concede ao
            BROTA licença não exclusiva para exibir esse conteúdo dentro da
            plataforma.
          </p>
          <p className="mt-3">Não é permitido publicar:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Conteúdo ofensivo, discriminatório ou de assédio</li>
            <li>Informação que possa causar dano — como afirmar que uma planta tóxica é comestível</li>
            <li>Material protegido por direitos autorais sem autorização</li>
            <li>Spam, propaganda não solicitada ou golpes</li>
            <li>Dados pessoais de terceiros sem consentimento</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl">5. Contribuições para a base botânica</h2>
          <p className="mt-2">
            Sugestões enviadas passam por revisão editorial antes de entrar na
            base. Ao enviar, você concorda que a informação aprovada passa a
            integrar o acervo público do BROTA, com registro de autoria.
          </p>
          <p className="mt-3">
            A equipe pode aceitar, ajustar ou recusar qualquer sugestão. O
            critério é a qualidade e a verificabilidade da informação.
          </p>
        </section>

        <section>
          <h2 className="text-xl">6. Moderação</h2>
          <p className="mt-2">
            Conteúdo que viole estes termos pode ser ocultado ou removido. Contas
            com violações graves ou reincidentes podem ser suspensas. Todas as
            ações de moderação ficam registradas.
          </p>
        </section>

        <section>
          <h2 className="text-xl">7. Disponibilidade</h2>
          <p className="mt-2">
            O BROTA é oferecido no estado em que se encontra. Como projeto
            educacional, pode passar por manutenções, mudanças e interrupções.
            Funcionalidades que dependem de serviços externos podem ficar
            temporariamente indisponíveis — quando isso acontece, o sistema avisa
            de forma clara em vez de apresentar dados falsos.
          </p>
        </section>

        <section>
          <h2 className="text-xl">8. Alterações</h2>
          <p className="mt-2">
            Estes termos podem mudar. Alterações relevantes serão comunicadas na
            plataforma com antecedência razoável.
          </p>
        </section>
      </div>
    </div>
  );
}
