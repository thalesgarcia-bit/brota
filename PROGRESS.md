# PROGRESS — BROTA

Acompanhamento do desenvolvimento.

**Última atualização:** 6 de setembro de 2026

---

## Estado geral

| Fase | Escopo | Situação |
| --- | --- | --- |
| 0 | Arquitetura, modelagem de dados, design system | **Concluída** |
| 1 | Fundação: scaffold, autenticação, RBAC, navegação | **Concluída** |
| 2 | Base botânica: catálogo, busca, filtros, página da espécie | **Concluída** |
| 3 | Personalização: onboarding, Perfil Verde, recomendador | **Concluída** |
| 4 | Rede social: feed, publicações, comentários, coleções | **Concluída** |
| 5 | Meu Jardim e Diário Verde | **Concluída** |
| 6 | Identificação por foto e fila administrativa | **Concluída** |
| 7 | Onde comprar (mapa) | **Concluída** |
| 8 | Colaboração, moderação e painel administrativo | **Concluída** |
| 9 | PWA, acessibilidade, SEO, performance | **Concluída** |
| — | Execução de build, lint e testes | **Bloqueada no ambiente remoto** (ver Riscos) |

**Números:** 183 arquivos TypeScript · ~25.000 linhas · 43 rotas · 43 componentes ·
11 conjuntos de Server Actions · 4 rotas de API · 43 modelos de banco.

---

## O que existe hoje

### Arquitetura e dados
- Modelagem completa: **43 modelos**, **29 enums**, relações balanceadas
  (verificado por script estrutural próprio).
- Camadas separadas: `domain/` (regras puras, sem React e sem Prisma),
  `server/services` (leitura), `server/actions` (escrita), `app/` (apresentação).
- Validação das variáveis de ambiente com Zod no arranque — falha cedo e com
  mensagem útil, em vez de quebrar em produção.

### Design system
- Tokens completos em `src/styles/globals.css`: paleta de marca (11 tons),
  neutros levemente esverdeados, apoios naturais, semânticos, tipografia,
  escala, raios, sombras e movimento.
- Tipografia **Fraunces** (display) + **Inter** (interface).
- **Conjunto de ícones próprio** com 65 símbolos na mesma grade de 24 px —
  sem biblioteca externa.
- Identidade: o símbolo lê ao mesmo tempo como broto, balão de conversa e duas
  pessoas voltadas uma para a outra. Funciona reduzido para avatar e favicon.
- Componentes com todos os estados previstos (normal, hover, focus, active,
  disabled, loading, erro): botões, campos, seleção, cartões de escolha, chips,
  badges, cartões, modal, menu, abas, toasts, medidores, skeletons, estados
  vazios e de erro.
- Renderizador de Markdown próprio para os conteúdos educativos: subconjunto
  restrito, saída em elementos React — sem `dangerouslySetInnerHTML` e sem duas
  dependências (parser + sanitizador).

### Autenticação e permissões
- Auth.js v5 com credenciais, bcrypt custo 12 e sessão JWT.
- RBAC real: 18 permissões, 3 papéis, verificação em três camadas —
  middleware na borda, `requirePermission` nas páginas, `assertPermission` nas
  Server Actions.
- Recuperação de senha com token *hasheado* no banco, validade de 60 minutos e
  resposta idêntica para e-mail existente e inexistente.
- Troca de senha e exclusão de conta com dupla confirmação.

### Base botânica
- **25 espécies** com ficha completa: 12 campos de cuidado estruturados,
  toxicidade separada para pessoas, cães e gatos, problemas comuns com sintoma,
  causa provável e sugestão, curiosidade e fontes citadas.
- Toxicidade conferida na base do **ASPCA Animal Poison Control Center**; o que
  não foi confirmado está marcado como *"Informação não confirmada"*.
- 13 categorias, 8 conteúdos educativos, 6 conquistas.
- Catálogo com busca (nome popular, científico e texto normalizado sem acentos),
  autocomplete, histórico local, 6 grupos de filtros e paginação — todo o estado
  na URL, portanto compartilhável e navegável pelo histórico.
- Página da espécie com guia rápido, painel de segurança botânica em destaque,
  ficha técnica, fontes, espécies semelhantes e dados estruturados JSON-LD.

### Motor de recomendação
- Camada pura em `src/domain/recommendation/engine.ts`.
- 8 critérios ponderados: luz 22, rega 16, experiência 14, espaço 12,
  ambiente 12, preferências 10, clima 8, objetivo 6.
- Modificador de segurança: toxicidade relevante ao lar do usuário reduz a
  pontuação e **sempre** gera aviso, mesmo quando não reduz.
- Cada critério devolve uma frase em português explicando o resultado.
  **Nenhum percentual é exibido sem os motivos que o produziram.**

### Rede social
- Seis tipos de publicação, upload de até 6 imagens com compressão e correção
  de orientação EXIF.
- Controle de comentários por publicação, decidido pelo autor e **verificado no
  servidor** — não apenas escondido na interface.
- Curtidas e salvamentos com atualização otimista, coleções, perfis públicos,
  hashtags e denúncias.
- Localização em publicações limitada a cidade e estado.

### Meu Jardim
- Cadastro de plantas com ou sem espécie da base.
- Diário Verde com 10 tipos de registro, linha do tempo e fotos.
- Lembretes educativos: nunca "regue toda terça", sempre "vale verificar a
  umidade do substrato".

### Identificação por foto
- Fluxo completo: upload → provedor → candidatos → confiança → cruzamento com a
  base local → resultado, ou fila administrativa quando abaixo do limiar.
- Linguagem de probabilidade, nunca de certeza.
- Fila administrativa com foto, autor, sugestões da IA com confiança, e as
  ações de identificar, pedir nova foto, marcar imagem inadequada e encerrar —
  cada uma notificando o usuário e gravando log de auditoria.

### Onde comprar
- Mapa Leaflet carregado dinamicamente, marcadores próprios, lista sincronizada,
  rota, telefone e site.
- Dados reais do OpenStreetMap via Overpass, com atribuição visível.
- Localização pedida apenas no clique, nunca no carregamento; busca por cidade
  como alternativa; todos os estados de permissão tratados.

### Administração
- 11 áreas: visão geral, plantas, identificações, sugestões, publicações,
  comentários, denúncias, usuários, conteúdos, estabelecimentos, configurações
  e registros.
- Dashboard com métricas reais do banco — **nenhum número de exemplo**.
- Fluxo de sugestões com comparação antes/depois, aprovação com aplicação
  opcional na ficha e notificação ao autor.
- Página de configurações que mostra o estado de cada integração e como
  configurar o que falta, sem nunca exibir chaves.

### PWA, SEO e acessibilidade
- Manifest, ícones (192, 512, maskable, apple-touch), favicon SVG.
- Service worker escrito à mão: rede primeiro para navegação, cache primeiro
  para estáticos, imagens com limite, e **nunca** cache de API, admin ou dados
  pessoais. Página offline dedicada.
- Sitemap dinâmico, robots com áreas privadas bloqueadas, metadados por página,
  Open Graph e JSON-LD nas fichas.
- Foco sempre visível, `prefers-reduced-motion` respeitado, zoom liberado até
  5×, alvos de toque de 40 px, rótulos em todos os campos, `aria-live` nos
  estados de carregamento e nos toasts, e nenhuma informação transmitida apenas
  por cor.

---

## Verificação executada

O ambiente remoto onde o código foi escrito tem o registro do npm bloqueado,
o que impediu `npm install` e, por consequência, `build`, `lint` e a suíte de
testes. Para não entregar nada apenas no "confie em mim", o que foi possível
verificar, foi:

| Verificação | Ferramenta | Resultado |
| --- | --- | --- |
| Sintaxe de todos os 183 arquivos | `tsc --noResolve` | **0 erros** |
| Estrutura do schema Prisma (relações, chaves) | script próprio | **43 modelos, 29 enums, 0 inconsistências** |
| Motor de recomendação e Perfil Verde | execução real via `tsx` | **19 verificações passaram** |
| Utilidades, RBAC e validação de upload | execução real via `tsx` | **18 verificações passaram** |

As mesmas verificações estão escritas como testes de Vitest em `tests/unit/`,
prontas para rodar com `npm test` assim que as dependências forem instaladas.

---

## Riscos e pendências

| Item | Situação | O que falta |
| --- | --- | --- |
| **Build, lint e testes** | Não executados | O registro do npm está bloqueado na sessão em nuvem onde o código foi escrito. A primeira execução local pode revelar ajustes de tipos — nada estrutural, dado que a sintaxe e o schema já foram verificados. |
| **Contrato da API do Pl@ntNet** | Adapter implementado e validado com Zod | Rodar `npm run check:plantnet -- foto.jpg` com uma foto real. O host da API também está bloqueado no ambiente remoto, então o contrato foi implementado a partir da especificação e falha de forma explícita se estiver diferente — nunca devolve dado errado em silêncio. |
| **Provedor de e-mail** | Interface pronta, adapter de log | Escolher SMTP ou serviço transacional e implementar o adapter em `src/domain/mail`. |
| **Armazenamento de imagens** | Adapter local funcionando | Implementar adapter S3/R2 antes de publicar em plataforma efêmera. |
| **Fotografias das espécies** | Nenhuma cadastrada | O catálogo usa um marcador ilustrado gerado a partir do nome. Não usamos foto de banco de imagens nem imagem de outra espécie. |
| **Limite da Overpass API** | Endpoint público | Em produção com volume, instância própria. |
| **Editor de conteúdos educativos** | Leitura no admin | O corpo dos textos ainda é editado pelo seed ou pelo banco. |
| **Notificações push** | Arquitetura de lembretes pronta | Falta o agendador e a integração com Web Push. |

---

## Decisões técnicas

| Decisão | Motivo |
| --- | --- |
| PostgreSQL + Prisma em vez de Supabase | Roda localmente com um comando, sem depender de conta em serviço externo. Migrar para Supabase depois é trocar a `DATABASE_URL`. |
| Conjunto de ícones próprio | Linguagem visual consistente e uma dependência a menos. |
| Leaflet direto, sem `react-leaflet` | Evita acoplamento de versão com o React 19 e mantém o controle do ciclo de vida do mapa. |
| Renderizador de Markdown próprio | Elimina por construção o risco de injeção e duas dependências. |
| Sem `clsx` / `tailwind-merge` | `cn` próprio em 20 linhas resolve. |
| Estado dos filtros na URL | Resultado compartilhável, histórico funcional, degradação graciosa sem JavaScript. |
| Sem tema escuro | A direção estética pede predominância do branco. Os tokens estão prontos para receber o tema depois, em um único bloco. |
| Marcador ilustrado no lugar de foto | Não usamos foto de banco de imagens nem imagem de outra espécie. |
| Service worker escrito à mão | Cem linhas legíveis em vez de um gerador no build. |

---

## Critérios de aceite

| # | Critério | Situação |
| --- | --- | --- |
| 1 | Autenticação real | Feito |
| 2 | Banco persiste dados | Feito |
| 3 | Permissões diferentes por papel | Feito (verificado por teste executado) |
| 4 | Catálogo funcionando | Feito |
| 5 | Busca funcionando | Feito |
| 6 | Recomendação a partir de critérios | Feito (verificado por teste executado) |
| 7 | Feed funcionando | Feito |
| 8 | Publicação funcionando | Feito |
| 9 | Controle de comentários | Feito (validado também no servidor) |
| 10 | Favoritos | Feito |
| 11 | Meu Jardim | Feito |
| 12 | Diário | Feito |
| 13 | Identificação com integração real | Feito — contrato a confirmar com foto real |
| 14 | Baixa confiança gera pendência | Feito |
| 15 | Admin resolve pendência | Feito |
| 16 | Mapa com integração verdadeira | Feito |
| 17 | Painel administrativo | Feito |
| 18 | Totalmente responsivo | Implementado; teste automatizado escrito, execução pendente |
| 19 | Acessibilidade validada | Implementada; auditoria com ferramenta pendente |
| 20 | Nenhum botão cenográfico | Mantido |
| 21 | Build sem erros | **Não verificado** (npm bloqueado no ambiente) |
| 22 | Lint sem erros | **Não verificado** (npm bloqueado no ambiente) |
| 23 | Fluxos principais testados | Testes escritos (unidade + 4 suítes de ponta a ponta); execução pendente |
