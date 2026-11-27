# ZoomERP — Etapa 0.2: login, empresas e permissões

Micro-ERP SaaS voltado a MEIs e pequenos negócios, no mesmo repositório do portfólio (`apps/zoomerp/`). A página pública `/zoomerp/` do GitHub Pages **continua sendo apenas uma apresentação do produto**; o código desta pasta é uma aplicação **Next.js**, que precisa ser executada em Node/Vercel, não no GitHub Pages.

**Estado real:** implementação de cadastro, login, criação de empresas, vínculo dono/funcionário, convite por link com destinatário verificado e políticas SQL RLS. Sem Supabase real configurado, não foi possível validar autenticação ponta a ponta nem executar migração ou testes SQL de isolamento. **Não usar com dados reais até realizar esses testes no projeto Supabase.** Ainda não há vendas, estoque, relatórios, PWA ou cobrança.

## 1. Pré-requisitos

- Node.js 22+ e npm; PostgreSQL/Supabase (projeto próprio do ZoomERP).
- Nunca coloque uma `service_role`, `sb_secret` ou chave de banco em `NEXT_PUBLIC_*` nem no repositório.
- Ative confirmação de e-mail em Supabase Auth. Os convites só funcionam com e-mail **confirmado**.

## 2. Instalar e rodar

```bash
cd apps/zoomerp
npm install
cp .env.example .env.local
# Preencha URL + publishable key do projeto Supabase e a URL da aplicação Next.js
npm run dev
```

Abra `http://localhost:3000`. A página pública pode abrir sem `.env.local`, mas login e páginas privadas só funcionam com Supabase configurado e migração aplicada.

O `.env.local` deve conter:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No Supabase **SQL Editor**, execute a migração `supabase/migrations/202611270001_auth_multiempresa.sql` **uma única vez** (ou use `supabase db push` após conectar seu projeto). Ela cria `empresas`, `usuarios_empresa`, `convites_empresa`, políticas RLS e três funções RPC transacionais. Revise a migração antes de aplicar em qualquer banco já existente.

**Auth / URL Configuration:** adicione `http://localhost:3000/auth/confirm` à lista de URLs permitidas (e sua URL futura da Vercel). Ajuste o template **Confirm signup** para utilizar a URL de confirmação com token hash gerada pelo Supabase, preservando o redirecionamento de convite:

```html
<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Confirmar meu e-mail</a>
```

O `emailRedirectTo` do cadastro aponta para `/auth/confirm?next=/inicio` ou `/auth/confirm?next=/convite/<token>`. O template requer `RedirectTo` configurado e confiável (restrito pelo allowlist do Supabase); teste o fluxo na sua instância. `/auth/callback` mantém suporte a fluxos de código PKCE, mas o cadastro atual usa `/auth/confirm` com `verifyOtp`.

## 3. Como verificar a Etapa 0.2

1. Abra `/cadastro`, cadastre um e-mail e senha com pelo menos 8 caracteres, e confirme pelo link enviado pelo Supabase.
2. Faça login em `/login` e preencha somente o nome da empresa em `/configurar` (ramo e CPF/CNPJ opcionais).
3. Confira `/inicio`: a empresa aparece com papel **Dono**. Crie uma segunda empresa, se desejar, para testar multiempresa.
4. Clique **Gerenciar equipe**, informe um e-mail de funcionário e use **Gerar link de convite**. Copie o link e envie manualmente ao destinatário — **a aplicação ainda NÃO envia e-mails de convite**.
5. Abra o link com o e-mail correto, confirme a conta e aceite. O acesso de funcionário será mostrado em `/inicio`, sem menu de gerência. Não existe relatório financeiro nesta etapa.
6. Tente aceitar com outro e-mail: o banco deve recusar. Um token usado ou vencido também deve falhar.
7. Em um banco **local isolado**, execute o teste SQL de separação entre empresas (próxima seção). **Não execute o teste SQL em produção.**

## 4. Segurança / RLS

- Cada empresa nasce com seu dono na **mesma transação** (`public.criar_empresa`).
- Todas as tabelas de negócio da etapa 0.2 têm RLS habilitado. `SELECT` retorna só vínculos autorizados e convites visíveis ao dono. **INSERT/UPDATE/DELETE diretos são negados** para `anon` e `authenticated`; só RPCs restritas executam criação da empresa e fluxo de convites.
- Funções de autorização usam `auth.uid()` e `SECURITY DEFINER` com `search_path` fixo. Nunca recebem identidade de usuário do navegador.
- Convites têm validade de 7 dias, token aleatório de 64 caracteres e **apenas o hash SHA-256 fica no banco**. O destinatário deve autenticar e confirmar o e-mail exato do convite.
- O redirecionamento de login aceita apenas `/inicio` ou `/convite/<token>`; outras URLs são rejeitadas.
- Documento opcional validado por dígitos verificadores de CPF/CNPJ na UI e no banco. Neste MVP a validação contempla apenas CNPJ **numérico**.
- Não há papel de administrador global, chave privilegiada no frontend ou acesso público às empresas.

**Isolamento real:** a verificação automática JS de RLS é **estrutural**, não substitui um teste com PostgreSQL. Execute em Supabase local: `psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/01_isolamento.sql`. Requer banco local com Supabase Auth e migração aplicada; cria usuários sintéticos e faz `ROLLBACK`. Confirme o resultado e repita com os fluxos de convite antes de liberar dados reais. *O teste ainda não foi executado nesta sessão.*

## 5. Qualidade

```bash
npm test            # funções puras: documento, URL, centavos e checagens estruturais
npm run lint        # requer npm install
npm run typecheck   # requer npm install
npm run build       # requer npm install
npm run check       # lint + types + tests
```

Sem acesso ao npm nesta sessão, o build do Next.js e o typecheck completo ficaram **pendentes**. Os testes Node independentes executam sem dependências externas. A CI do GitHub Actions tenta instalar e executar validações, mas a execução deve ser confirmada no histórico de Actions.

## 6. Estrutura da etapa

```text
src/
├── proxy.ts                    # refresh de sessão (Next 16)
├── app/
│   ├── cadastro/               # registro
│   ├── login/                  # login por senha
│   ├── auth/{callback,confirm}/ # confirmação de e-mail
│   ├── configurar/             # criação de empresa
│   ├── inicio/                 # empresas vinculadas
│   ├── equipe/                 # somente dono
│   └── convite/[token]/        # aceitar convite
├── components/{auth-frame,convite-form}.tsx
└── lib/{auth,supabase,documento.ts}
supabase/
├── migrations/202611270001_auth_multiempresa.sql
└── tests/01_isolamento.sql
```

## Decisões e próximos passos

- A partir de Next.js 16, o refresh de sessão é feito no `src/proxy.ts`. Cada página sensível consulta `auth.getUser()` **e** o banco com RLS; o proxy sozinho não é controle de autorização.
- A tela inicial do ERP é uma prévia técnica, não um sistema de produção. O portfólio estático continua preservado.
- Convites por e-mail são **links criados pelo dono**, sem envio automático. Integração de entrega de e-mails fica para etapa posterior.
- A implementação **0.3** (navegação e PWA) depende de autenticação, RLS e testes ponta a ponta realmente funcionando num Supabase configurado.
- Dados de exemplo e venda, estoque, caixa, auditoria detalhada e cobrança entram nas fases seguintes.

Veja `CHANGELOG.md` para mudanças por etapa.

## Deploy Next.js na Vercel (2026-11-27)

- Projeto Vercel: `zoomerp-next` (conta `adrianhenrrique's projects`).
- URL de produção: https://zoomerp-next.vercel.app/
- Repositório: `Adrianhenrrique/Adrianhenrrique.github.io`; **Root Directory**: `apps/zoomerp`.
- Build remoto do Next.js 16.4.6 realizado com sucesso na Vercel no commit `ef39c7b4`; a presença da aplicação pública não significa que o banco esteja conectado.
- Configuração da Vercel: Node.js 22, framework Next.js, acesso à página pública liberado. Não compartilhe chaves privadas.
- Login, criação de empresas e convites dependem de um projeto Supabase ativo, da migração SQL e das variáveis de ambiente **no painel da Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL=https://zoomerp-next.vercel.app`.
- Configure no Supabase Auth a URL do site e os redirecionamentos `/auth/confirm` e `/auth/callback`; valide o isolamento RLS com duas contas reais antes de habilitar clientes.
- A apresentação estática em https://adrianhenrrique.github.io/zoomerp/ continua separada do aplicativo Next.js.

## Supabase conectado — 2026-11-27

- Projeto Supabase **ZoomERP** em `sa-east-1`, ref `xietagebczbytejyqbkp`. Projeto separado de Atlas Vendas e ThunderBot.
- Migração `auth_multiempresa` aplicada no banco (versão registrada `20261127031809`): `empresas`, `usuarios_empresa`, `convites_empresa`, RPCs e RLS.
- As três tabelas têm RLS habilitado e política de consulta por associação/papel. Teste SQL transacional de isolamento entre duas empresas executado sem erros; dados de teste revertidos.
- Vercel `zoomerp-next` recebeu `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_APP_URL` para os ambientes de desenvolvimento, preview e produção (sem `service_role`).
- Corrigido `signUp.emailRedirectTo` para apontar a `/auth/callback` (fluxo PKCE).
- **Configuração manual ainda necessária no Supabase Dashboard → Authentication → URL Configuration**: definir Site URL como `https://zoomerp-next.vercel.app` e adicionar à lista de redirects `https://zoomerp-next.vercel.app/auth/callback` (além de `http://localhost:3000/**` para desenvolvimento local). O conector atual não permite editar esta configuração.
- O linter Supabase sinaliza as 3 RPCs públicas `SECURITY DEFINER` como avisos intencionais: estão restritas a `authenticated` e validam identidade/papel dentro da função. Revisar continuamente antes de liberar usuários reais.
- **Teste ponta a ponta de signup, confirmação por e-mail e convites reais ainda pendente**, pois a configuração de URLs de autenticação precisa ser concluída. O build remoto do Next.js está aprovado, mas isso não substitui o teste real de autenticação.

## Diagnóstico do cadastro — 2026-11-27

- Foi detectado `over_email_send_rate_limit` (429) após um `signUp` anterior retornar HTTP 200 e iniciar envio de confirmação. Repetir o cadastro não substitui confirmar a conta existente.
- A interface trata os códigos do Supabase com mensagens específicas, sem exibir dados pessoais, detalhes internos ou senhas; testes em `tests/signup-errors.test.ts`.
- **Atenção:** as requisições de Auth registraram `referer` com `http://localhost:3000`. Confirme em Supabase → Authentication → URL Configuration que `Site URL` é `https://zoomerp-next.vercel.app` e que `https://zoomerp-next.vercel.app/auth/callback` consta nas URLs de redirecionamento. Esse ajuste não é feito pelo conector disponível.
- Não desative a confirmação de e-mail para contornar limites de envio. Para produção, configure SMTP apropriado e monitore limites de Auth.
