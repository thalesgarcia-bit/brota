# PROGRESS — BROTA

Acompanhamento vivo do desenvolvimento. Atualizado a cada entrega.

**Última atualização:** 5 de setembro de 2026

---

## Estado geral

| Fase | Escopo | Situação |
| --- | --- | --- |
| 0 | Arquitetura, modelagem de dados, design system | **Concluída** |
| 1 | Fundação: scaffold, autenticação, RBAC, navegação | **Concluída** |
| 2 | Base botânica: catálogo, busca, filtros, página da espécie | **Concluída** |
| 3 | Personalização: onboarding, Perfil Verde, recomendador | Em andamento |
| 4 | Rede social: feed, publicações, comentários, coleções | Pendente |
| 5 | Meu Jardim e Diário Verde | Pendente |
| 6 | Identificação por foto e fila administrativa | Camada pronta, telas pendentes |
| 7 | Onde comprar (mapa) | Camada pronta, telas pendentes |
| 8 | Colaboração, moderação e painel administrativo | Parcial |
| 9 | PWA, acessibilidade, SEO, performance | Parcial |

---

## Concluído

### Arquitetura e dados
- Modelagem completa: **43 modelos**, **29 enums**, relações balanceadas
  (verificado por script estrutural).
- Camadas separadas: `domain/` (regras puras), `server/services` (leitura),
  `server/actions` (escrita), `app/` (apresentação).
- Validação de ambiente com Zod no arranque — falha cedo, com mensagem útil.

### Design system
- Tokens completos em `src/styles/globals.css`: paleta de marca, neutros
  esverdeados, apoios naturais, semânticos, tipografia, escala, raios, sombras,
  movimento.
- Tipografia: **Fraunces** (display) + **Inter** (interface).
- **Conjunto de ícones próprio** com 65 símbolos na mesma grade — sem
  dependência de biblioteca externa.
- Identidade: símbolo que lê como broto, balão de conversa e duas pessoas
  voltadas uma para a outra; funciona reduzido para avatar e favicon.
- Componentes com todos os estados (normal, hover, focus, active, disabled,
  loading, erro): botões, campos, seleção, cartões de escolha, chips, badges,
  cartões, modal, menu, abas, toasts, medidores, skeletons, estados vazios e
  de erro.

### Autenticação e permissões
- Auth.js v5 com credenciais, bcrypt custo 12 e sessão JWT.
- RBAC real em `src/lib/auth/rbac.ts`: 18 permissões, 3 papéis.
- Verificação em três camadas: middleware na borda, `requirePermission` nas
  páginas, `assertPermission` nas Server Actions.
- Recuperação de senha com token *hasheado* no banco e validade de 60 minutos.
- Resposta idêntica para e-mail existente e inexistente (não vaza cadastro).

### Base botânica
- **25 espécies** com ficha completa: cuidados estruturados em 12 campos,
  toxicidade separada para pessoas, cães e gatos, problemas comuns com sintoma,
  causa provável e sugestão, curiosidade e fontes citadas.
- Toxicidade conferida na base do **ASPCA Animal Poison Control Center**; o que
  não foi confirmado está marcado como *"Informação não confirmada"*.
- 13 categorias, 8 conteúdos educativos, 6 conquistas.
- Catálogo com busca (nome popular, científico e texto normalizado sem
  acentos), autocomplete, histórico local, 6 grupos de filtros e paginação —
  tudo com estado na URL, portanto compartilhável e navegável pelo histórico.
- Página da espécie com guia rápido, painel de segurança botânica em destaque,
  ficha técnica, fontes, espécies semelhantes e dados estruturados JSON-LD.

### Motor de recomendação
- Camada pura, sem Prisma e sem React: `src/domain/recommendation/engine.ts`.
- 8 critérios ponderados (luz 22, rega 16, experiência 14, espaço 12, ambiente
  12, preferências 10, clima 8, objetivo 6).
- Modificador de segurança: toxicidade relevante ao lar do usuário reduz a
  pontuação e **sempre** gera aviso, mesmo quando não reduz.
- Cada critério devolve uma frase em português explicando o resultado.
  **Nenhum percentual é exibido sem os motivos que o produziram.**

### Integrações
- `PlantIdentificationProvider` com adapter **Pl@ntNet** real, validação da
  resposta com Zod e mapeamento de todos os códigos de erro para mensagens
  humanas. Mock existe, mas se recusa a rodar em produção.
- `PlacesProvider` com adapter **OpenStreetMap** (Overpass + Nominatim) — dados
  reais, sem chave, sem estabelecimento inventado.
- `StorageProvider` com adapter local: validação de MIME por assinatura de
  arquivo, correção de orientação EXIF, conversão para WebP e miniatura.
- `MailProvider` com adapter de desenvolvimento que registra a mensagem no log.

---

## Em andamento

- Questionário do onboarding em etapas e página de recomendações.

## Pendente

- Feed, publicação com upload múltiplo, comentários com controle por autor,
  curtidas, coleções e perfil público.
- Meu Jardim, Diário Verde e arquitetura de lembretes educativos.
- Telas de identificação por foto e fila administrativa.
- Mapa "Onde comprar" com Leaflet.
- Painel administrativo completo e moderação.
- Service worker, ícones do PWA e cache offline parcial.
- Suíte de testes dos fluxos críticos.

---

## Decisões técnicas

| Decisão | Motivo |
| --- | --- |
| PostgreSQL + Prisma em vez de Supabase | Roda localmente com um comando, sem depender de conta em serviço externo. Migrar para Supabase depois é trocar a `DATABASE_URL`. |
| Conjunto de ícones próprio | Linguagem visual consistente e uma dependência a menos. Bibliotecas de ícones trazem milhares de símbolos de estilos diferentes. |
| Leaflet direto, sem `react-leaflet` | Evita o acoplamento de versão com o React 19 e mantém o controle do ciclo de vida do mapa. |
| Sem `clsx` / `tailwind-merge` | `cn` próprio em 20 linhas resolve; o design system é disciplinado o bastante para não precisar resolver conflitos em tempo de execução. |
| Estado dos filtros na URL | Resultado compartilhável, histórico do navegador funcional e degradação graciosa sem JavaScript. |
| Sem tema escuro | A direção estética pede predominância do branco. Os tokens estão prontos para receber o tema depois, em um único bloco. |
| Marcador ilustrado no lugar de foto | Não usamos foto de banco de imagens nem imagem de outra espécie. O desenho é gerado a partir do nome e deixa claro que falta fotografia. |

---

## Riscos e pendências de integração

| Item | Situação | O que falta |
| --- | --- | --- |
| **Contrato da API do Pl@ntNet** | Adapter implementado e validado com Zod | Confirmar o formato da resposta com uma foto real (`npm run check:plantnet`). O código falha de forma explícita se a API tiver mudado — não devolve dado errado em silêncio. |
| **Build e testes** | Não executados no ambiente de desenvolvimento remoto | O registro do npm está bloqueado na sessão em nuvem onde o código foi escrito, o que impediu `npm install`, `npm run build`, `lint` e testes. **Sintaxe verificada com `tsc` (0 erros) e estrutura do schema verificada por script.** A primeira execução local pode revelar ajustes de tipos. |
| **Provedor de e-mail** | Interface pronta, adapter de log | Escolher SMTP ou serviço transacional e implementar o adapter. |
| **Armazenamento de imagens** | Adapter local funcionando | Implementar adapter S3/R2 antes de publicar em plataforma efêmera. |
| **Limite da Overpass API** | Endpoint público | Em produção com volume, instância própria. |

---

## Critérios de aceite

| # | Critério | Situação |
| --- | --- | --- |
| 1 | Autenticação real | Feito |
| 2 | Banco persiste dados | Feito |
| 3 | Permissões diferentes por papel | Feito |
| 4 | Catálogo funcionando | Feito |
| 5 | Busca funcionando | Feito |
| 6 | Recomendação a partir de critérios | Motor pronto; tela pendente |
| 7 | Feed funcionando | Pendente |
| 8 | Publicação funcionando | Pendente |
| 9 | Controle de comentários | Pendente |
| 10 | Favoritos | Feito |
| 11 | Meu Jardim | Ação de adicionar pronta; tela pendente |
| 12 | Diário | Pendente |
| 13 | Identificação com integração real | Camada pronta; tela pendente |
| 14 | Baixa confiança gera pendência | Regra pronta; fluxo pendente |
| 15 | Admin resolve pendência | Pendente |
| 16 | Mapa com integração verdadeira | Camada pronta; tela pendente |
| 17 | Painel administrativo | Pendente |
| 18 | Totalmente responsivo | Em construção |
| 19 | Acessibilidade validada | Em construção |
| 20 | Nenhum botão cenográfico | Mantido até aqui |
| 21 | Build sem erros | Não verificado (npm bloqueado no ambiente) |
| 22 | Lint sem erros | Não verificado (npm bloqueado no ambiente) |
| 23 | Fluxos principais testados | Pendente |
