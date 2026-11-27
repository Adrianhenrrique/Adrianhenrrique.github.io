# ZoomERP — Etapa 0.3: interface e PWA

Micro-ERP SaaS voltado a MEIs e pequenos negócios, no mesmo repositório do portfólio (`apps/zoomerp/`). A página pública `/zoomerp/` do GitHub Pages **continua sendo apenas uma apresentação do produto**; o código desta pasta é uma aplicação **Next.js**, que precisa ser executada em Node/Vercel, não no GitHub Pages.

**Estado real:** implementação de cadastro, login, criação de empresas, vínculo dono/funcionário, convite por link com destinatário verificado e políticas SQL RLS. Sem Supabase real configurado, não foi possível validar autenticação ponta a ponta nem executar migração ou testes SQL de isolamento. **Não usar com dados reais até realizar esses testes no projeto Supabase.** Ainda não há vendas, estoque, relatórios ou cobrança. A navegação e o PWA estão na etapa 0.3.

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

**Auth / URL Configuration (histórico anterior à conexão real):** adicione `http://localhost:3000/auth/confirm` à lista de URLs permitidas (e sua URL futura da Vercel). Ajuste o template **Confirm signup** para utilizar a URL de confirmação com token hash gerada pelo Supabase, preservando o redirecionamento de convite:

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

A Vercel verifica builds Next.js na publicação. Lint, typecheck e testes Node são comandos separados; veja o estado da CI e rode npm run check quando possível.

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
- A implementação **0.3** entrega interface e PWA, sem armazenar dados privados offline. RLS permanece obrigatório.
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

## Recuperar uma conta ainda sem confirmação

O login agora distingue `email_not_confirmed` de credenciais inválidas. A rota `/reenviar-confirmacao` chama `supabase.auth.resend({ type: 'signup' })`, com redirecionamento HTTPS para `/auth/callback`. O resultado é genérico para evitar revelar a existência de contas. Se o provedor responder HTTP 429, exibimos um aviso de limite, sem tentar enviar repetidamente. Antes de reenviar, configure os Redirect URLs corretos no Supabase Auth.

## Etapa 0.3 — interface mobile-first e PWA

- Acesse https://zoomerp-next.vercel.app/login, entre e abra /inicio. A tela mostra somente as empresas vinculadas ao usuário autenticado por RLS.
- Com 360px: cinco abas (Início, Vender, Estoque, Caixa e Mais) e botão flutuante + com atalhos. Os módulos comerciais são PRÉVIAS, sem escrita de dados e sem saldos fictícios.
- Com largura de 900px ou mais: navegação lateral. Alterne o tema com o botão sol/lua; a preferência local é guardada no navegador, sem dados pessoais.
- Android: Chrome > Instalar aplicativo ou Adicionar à tela inicial. iPhone: Safari > Compartilhar > Adicionar à Tela de Início. Verifique em aparelho real.
- O manifesto e ícones 192/512/180 estão em public/. O service worker utiliza cache restrito: só ícones, código estático versionado e uma página offline pública.
- O app continua dependendo da rede para login, conta, estoque, vendas e caixa. HTML autenticado, API, cookies e respostas Supabase NÃO são armazenados no cache offline.
- Use npm test, npm run lint, npm run typecheck e npm run build após npm install; tests/pwa.test.mjs verifica a estrutura PWA. Instalação e usabilidade de 360px exigem testes nos dispositivos reais.
- No Supabase Auth, Site URL deve apontar para https://zoomerp-next.vercel.app e os Redirect URLs devem incluir https://zoomerp-next.vercel.app/auth/callback. Se apontar para localhost, o link de verificação falhará no celular.

## Fase 1.1 — Catálogo de produtos (2026-11-27)

- Rotas novas: `/estoque` (lista, busca por nome/SKU, filtros e paginação), `/produtos/novo`, `/produtos/[id]/editar`, `/categorias`, `/produtos/importar`.
- Supabase: migração `20261127035246_catalogo_produtos_fase_1_1.sql` aplicada. Tabelas `produtos` e `categorias_produto` com RLS por `empresa_id`. Membros leem, somente o dono cadastra e altera. Não há permissão de DELETE. `ativo=false` arquiva.
- SKU único por empresa (ignorando diferenças entre maiúsculas/minúsculas), categoria obrigada a pertencer à mesma empresa por chave estrangeira composta e empresa de registros imutável por gatilho.
- `preco_venda_centavos` e `custo_centavos` são inteiros de centavos com limites e sem floats. CPF/CNPJ, contas, convites e demais tabelas não foram alterados.
- CSV: modelo em `/modelos/produtos.csv`, cabeçalho `nome;sku;categoria;preco_venda;custo;unidade;descricao`; separador vírgula (com decimais entre aspas) ou ponto e vírgula; limite 150 KB/200 linhas; todas as linhas validadas, sem SKUs duplicados; um único INSERT atômico. Categorias da planilha devem existir previamente.
- A importação **não atualiza** itens existentes; SKU duplicado rejeita o lote inteiro. Não há importação parcial, nem sincronização offline.
- O cadastro **não representa estoque disponível**. Saldos e movimentos de entrada/saída ficam para Fase 1.2, vendas e caixa para fases seguintes. Nada foi lançado como compra, estoque ou venda nesta etapa.
- `npm run build` agora executa testes Node via `prebuild`, além da compilação Next.js. Não use senhas/chaves secretas no código público.

### Validação do catálogo

1. Entre com a conta dona, escolha sua empresa e abra Estoque.
2. Crie uma categoria e um produto com SKU, venda e custo; filtre e edite o produto.
3. Arquive e reative o produto usando o campo Produto ativo.
4. Baixe o modelo CSV, cadastre até 200 produtos e importe; para categorias no CSV, cadastre-as primeiro.
5. Confirme que outra empresa não enxerga nem edita os produtos da primeira; funcionários devem consultar sem botões de alteração.
6. Execute os testes SQL de RLS em transação com rollback e verifique os avisos de segurança Supabase antes de produção.

## Otimizações da versão 1.1.1 (2026-11-27)

- A resolução da empresa do usuário continua validando `auth.getUser()` no servidor e autorização por RLS, mas agora usa `usuarios_empresa` + `empresas` em **uma consulta PostgREST com join**, em vez de duas chamadas sequenciais.
- A listagem de produtos dispara filtros/lista, total de ativos e categorias **em paralelo**. Informações de custo que não aparecem na lista deixam de ser transmitidas.
- O Proxy de refresh atua **somente** nas rotas privadas; telas públicas e arquivos estáticos não acionam `auth.getClaims()` desnecessariamente.
- CSS interno separado do layout público, preservando visual de telas de login e marketing. A aba Estoque e formulários carregam `catalogo.css` apenas quando necessários.
- `src/app/loading.tsx` apresenta estado imediato enquanto rotas dinâmicas autenticadas consultam o banco. As abas exibem indicador visual de navegação e deixam de disparar pré-buscas em massa.
- Service Worker não intercepta mais bundles `/_next/static` (já servidos com cache HTTP imutável). Mantém apenas `/offline` no CacheStorage e não guarda requisições ou HTML privados.
- Nenhuma tabela, preço, política RLS ou migração foi alterada. Não há cache compartilhado de dados de empresas.

**Como testar:** abra /inicio e /estoque no celular, navegue entre as abas, confira a exibição imediata de carregamento e teste a troca de empresa. Teste também o PWA offline e o cadastro/edição de produto. A Vercel valida o build e `npm test`; dados reais de Web Vitals no aparelho ainda precisam ser coletados para quantificar a melhora.
