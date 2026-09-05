# BROTA

**Comunidade Inteligente de Plantas**

> O conhecimento também brota quando é cultivado em comunidade.

O BROTA responde a uma pergunta: *qual planta combina comigo e com o lugar em que eu vivo?*
Ele reúne um catálogo botânico com fontes citadas, um motor de recomendação que
explica cada indicação, identificação de espécies por fotografia, diário de
cultivo, mapa de floriculturas com dados abertos e um processo editorial que
aceita contribuição da comunidade sem abrir mão do rigor.

Projeto desenvolvido pelo **Prof. Thales Garcia** e pelos **alunos do 9º ano da
Escola Criativa de Uberaba**, em parceria com as **Profas. Mikaella de Sousa** e
**Carol Manhezzo**, a partir de uma atividade da disciplina de **Projeto de Vida**.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Linguagem | TypeScript em modo estrito |
| Interface | React 19 + Tailwind CSS v4 (design system próprio, sem biblioteca de componentes) |
| Ícones | Conjunto SVG próprio (`src/components/ui/icon.tsx`) — zero dependência |
| Banco | PostgreSQL 16 + Prisma ORM |
| Autenticação | Auth.js v5 (credenciais com bcrypt, sessão JWT, RBAC no servidor) |
| Validação | Zod (mesmos esquemas no cliente e no servidor) |
| Formulários | React Hook Form + Server Actions |
| Identificação por imagem | Pl@ntNet (adapter trocável) |
| Mapas | OpenStreetMap — Overpass + Nominatim (adapter trocável) |
| Imagens | sharp (compressão, orientação EXIF, miniaturas) |
| Testes | Vitest (unidade) + Playwright (ponta a ponta) |

---

## Instalação

### 1. Requisitos

- Node.js 20.11 ou superior
- Um banco PostgreSQL 16

### 2. Dependências

```bash
npm install
```

### 3. Banco de dados

Escolha **um** dos caminhos:

**a) Docker (recomendado)**

```bash
docker compose up -d
```

Sobe um Postgres em `localhost:5432` com usuário, senha e banco `brota`.

**b) Postgres na nuvem (Neon, Supabase, Railway)**

Crie o banco no serviço e copie a string de conexão para `DATABASE_URL`.

**c) Postgres instalado na máquina**

Crie um banco vazio e aponte a `DATABASE_URL` para ele.

### 4. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha os valores. O mínimo para rodar:

```env
DATABASE_URL="postgresql://brota:brota@localhost:5432/brota?schema=public"
AUTH_SECRET="<gere com: npx auth secret>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 5. Migrations e dados iniciais

```bash
npm run db:migrate      # cria as tabelas
npm run db:seed         # popula categorias, espécies, conteúdos e o admin
```

### 6. Rodar

```bash
npm run dev
```

Acesse <http://localhost:3000>.

O seed cria uma conta administrativa com as credenciais definidas em
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. **Troque essa senha antes de
qualquer uso real.**

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (roda `prisma generate` antes) |
| `npm start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos sem emitir arquivos |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção |
| `npm run db:seed` | Popula o banco |
| `npm run db:reset` | Zera o banco e semeia de novo |
| `npm run db:studio` | Prisma Studio |
| `npm test` | Testes de unidade (Vitest) |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright) |

---

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](./.env.example). As essenciais:

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL |
| `AUTH_SECRET` | sim | Segredo de assinatura das sessões |
| `NEXT_PUBLIC_SITE_URL` | sim | URL pública, usada em metadados e links de e-mail |
| `PLANT_ID_PROVIDER` | não | `plantnet` ou `none` |
| `PLANTNET_API_KEY` | não | Chave gratuita de <https://my.plantnet.org> |
| `PLANT_ID_CONFIDENCE_THRESHOLD` | não | Abaixo desse valor, a identificação vai para a fila do administrador |
| `PLACES_PROVIDER` | não | `osm` ou `none` |
| `OSM_USER_AGENT` | não | Exigido pela política de uso do Nominatim |
| `STORAGE_PROVIDER` | não | `local` grava em `public/uploads` |

**Nenhuma chave privada é exposta ao navegador.** Só variáveis com o prefixo
`NEXT_PUBLIC_` chegam ao cliente, e nenhuma delas é secreta.

---

## Serviços externos e estado de configuração

O BROTA nunca simula um serviço externo em produção. Quando algo não está
configurado, a interface diz isso com todas as letras.

### Identificação por imagem — Pl@ntNet

1. Crie uma conta gratuita em <https://my.plantnet.org> (uso educacional é permitido).
2. Copie a chave de API do painel de configurações.
3. Coloque em `PLANTNET_API_KEY` no `.env.local`.

Sem chave, a página `/identificar` exibe *"Identificação automática
temporariamente indisponível"* e oferece o envio direto para a análise da
comunidade. **Nunca devolve uma espécie aleatória.**

> **Verificação do contrato da API.** O adapter valida a resposta do Pl@ntNet
> com Zod. Antes de usar em produção, rode `npm run check:plantnet -- foto.jpg`
> para confirmar o formato com uma imagem real — o script falha de forma
> explícita se a API tiver mudado.

### Mapas — OpenStreetMap

Não exige chave. Os estabelecimentos vêm da Overpass API (consulta ao vivo, sem
persistência de dados de terceiros como se fossem nossos) e a busca por endereço
usa o Nominatim.

Os endpoints públicos têm limite de uso. Em produção com volume, aponte
`OVERPASS_API_URL` para uma instância própria e mantenha o `OSM_USER_AGENT`
identificando a aplicação e um contato, como pede a política de uso.

### E-mail

Ainda não há provedor SMTP configurado. Em desenvolvimento, o link de
recuperação de senha é escrito no log do servidor. O `MailProvider`
(`src/domain/mail/index.ts`) está pronto para receber um adapter real.

---

## Arquitetura

```
src/
├── app/                    Rotas (App Router)
│   ├── (marketing)/        Página inicial e institucionais
│   ├── (auth)/             Entrar, cadastro, recuperação de senha
│   ├── (site)/             Aplicação: feed, catálogo, jardim, identificar…
│   ├── admin/              Painel administrativo
│   └── api/                Endpoints (auth, upload, identificação, lugares)
├── components/
│   ├── ui/                 Design system (botões, campos, modal, toasts…)
│   ├── layout/             Casca: sidebar, barra superior, navegação inferior
│   └── plants/ feed/ …     Componentes de domínio
├── domain/                 Regras e integrações, sem React e sem Prisma
│   ├── recommendation/     Motor de pontuação ponderada + Perfil Verde
│   ├── identification/     Interface do provedor + adapter Pl@ntNet + mock
│   ├── places/             Interface de lugares + adapter OpenStreetMap
│   ├── storage/            Interface de armazenamento + adapter local
│   └── mail/               Interface de e-mail
├── lib/                    Utilidades, validação (Zod), auth, rótulos
├── server/
│   ├── actions/            Server Actions (mutações)
│   └── services/           Consultas ao banco
└── styles/                 Tokens e base do design system
```

### Princípios

**A regra de negócio não mora no componente.** O motor de recomendação é uma
função pura que recebe o Perfil Verde e uma espécie e devolve pontuação,
critérios e explicações. Pode ser testado sem subir a aplicação e trocado sem
tocar em nenhuma tela.

**Todo serviço externo entra por uma interface.** `PlantIdentificationProvider`,
`PlacesProvider`, `StorageProvider` e `MailProvider` isolam o resto do sistema.
Trocar Pl@ntNet por um modelo próprio é escrever outro adapter.

**Permissão é verificada no servidor.** Esconder um botão não é controle de
acesso. Toda página protegida chama `requirePermission`, toda Server Action
chama `assertPermission`, e o middleware barra o acesso já na borda.

**Nada é inventado.** Toxicidade sem confirmação em fonte aparece como
"Informação não confirmada". Identificação abaixo do limiar de confiança vira
pendência administrativa. Estabelecimento sem nome no OpenStreetMap é
descartado, não preenchido.

---

## Papéis e permissões

| Papel | Pode |
| --- | --- |
| **Visitante** | Ver catálogo, páginas de espécies, conteúdos educativos e o mapa |
| **Usuário** | Publicar, comentar, curtir, salvar, identificar, cadastrar o jardim, sugerir informações |
| **Moderador** | Tudo do usuário + ocultar conteúdo e tratar denúncias |
| **Administrador** | Tudo + gerenciar plantas, usuários, conteúdos, identificações, sugestões, métricas e configurações |

A matriz completa está em `src/lib/auth/rbac.ts`.

---

## Privacidade (LGPD)

- **Coleta mínima.** Nome, e-mail e senha. Tudo além disso é opcional.
- **E-mail nunca é público.** Não está no modelo `Profile`.
- **Localização.** Só com consentimento explícito, apenas no momento do uso do
  mapa. Publicações guardam cidade e estado — nunca coordenadas.
- **Exclusão de conta.** Disponível em `/configuracoes`.
- **Consentimentos** ficam registrados com data e versão do documento aceito.
- **Como o projeto pode envolver estudantes**, nenhum dado pessoal sensível é
  coletado e o perfil pode ser mantido privado.

---

## Deploy

1. Provisione um PostgreSQL gerenciado.
2. Configure as variáveis de ambiente na plataforma (Vercel, Railway, Render…).
3. `npm run db:deploy` para aplicar as migrations.
4. `npm run build && npm start`.

Para armazenamento de imagens em produção, implemente um adapter de
`StorageProvider` apontando para S3, R2 ou equivalente — o `LocalStorageProvider`
grava no disco da aplicação, o que não funciona em plataformas efêmeras.

---

## Licença e créditos

- Dados de estabelecimentos: **© colaboradores do OpenStreetMap** (ODbL).
- Identificação de espécies: **Pl@ntNet** (CIRAD, INRAE, IRD, Inria).
- Informações de toxicidade: **ASPCA Animal Poison Control Center**.
- Referências botânicas: **Flora e Funga do Brasil** (JBRJ) e
  **Missouri Botanical Garden**.
