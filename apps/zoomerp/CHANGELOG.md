# Histórico de alterações — ZoomERP

## 1.1.1 — Navegação e carregamento mais leves (2026-11-27)

- Uma consulta Supabase para carregar vínculos e empresas, sem remover verificação de identidade ou RLS.
- Consultas independentes da listagem de produtos disparadas em paralelo e payload reduzido.
- Atualização de sessão no proxy limitada às rotas privadas; páginas públicas sem validação remota desnecessária.
- CSS do ERP e do catálogo carregado pelas áreas que realmente precisam dele, em vez de todas as páginas.
- Novo estado visual de carregamento nas rotas e indicadores de navegação; pré-buscas desnecessárias das abas desabilitadas.
- PWA utiliza cache nativo do navegador para bundles Next.js; Service Worker guarda somente a tela de offline, sem dados privados.
- Registro do service worker após ocioso para não disputar recursos com a primeira renderização.
- Testes automáticos adicionados para evitar regressões de desempenho estrutural.


## 1.1.0 — Catálogo de produtos (2026-11-27)

- Tabelas de produtos e categorias no Supabase, preços em centavos, SKU único e RLS multiempresa.
- Cadastro e edição de produtos, status ativo/arquivado e categorias com renomeação.
- Listagem responsiva, busca por nome/SKU, filtros e paginação na aba Estoque.
- Importação de CSV validado (200 linhas/150 KB) em lote atômico; modelo para baixar.
- Testes de validação monetária, CSV e isolamento de empresa; `prebuild` executa testes antes do build.
- Sem estoque quantitativo, venda, caixa ou emissão fiscal nesta fase.


## 0.3.0 — Navegação e PWA (2026-11-27)

- AppShell com cinco abas no celular, sidebar desktop, tema claro/escuro e atalhos rápidos.
- Painel por empresa sem métricas inventadas e com módulo de equipe apenas para dono.
- Prévia de Vender, Estoque, Caixa e Mais sem operações financeiras ainda.
- Manifesto PWA, ícones Android/iOS e service worker com fallback offline público sem cache de dados privados.
- Testes estruturais, documentação e versão atualizados.


## 0.2.4 — Reenvio de confirmação (2026-11-27)

- Nova rota `/reenviar-confirmacao` com reenvio seguro via Supabase Auth.
- Login identifica `email_not_confirmed` e oferece caminho para recuperar a confirmação.
- Mensagens de rate limit reaproveitadas, evitando novas contas e tentativas excessivas.

## 0.2.3 — Mensagens de cadastro e diagnóstico (2026-11-27)

- Identificado HTTP 429 de limite de envio de e-mails no Supabase Auth, após cadastro prévio aceito.
- Mensagens amigáveis para rate limit, senha fraca, e-mail inválido e conta existente; sete testes de mapeamento.
- Documentada a verificação de URLs de confirmação e a necessidade de SMTP apropriado em produção.


## 0.2.2 — Conexão Supabase (2026-11-27)

- Criado o projeto Supabase ZoomERP em São Paulo, com orçamento informado de US$ 0/mês.
- Migração multiempresa aplicada, RLS verificado nas três tabelas.
- Teste transacional de isolamento A/B executado sem erro; dados revertidos.
- Variáveis públicas de conexão configuradas na Vercel; confirmação via callback PKCE corrigida.
- Pendente ajustar Site URL/Redirect URLs no painel do Supabase e validar autenticação com e-mail real.


## 0.2.1 — Deploy inicial Next.js (2026-11-27)

- Projeto Vercel `zoomerp-next` implantado com build do Next.js 16.4.6 aprovado.
- Vercel configurada para build de `apps/zoomerp` com Node.js 22.
- Link para prévia Next.js adicionado à apresentação pública do ZoomERP.
- Banco Supabase e credenciais ainda pendentes, portanto cadastro real não foi validado.


## 0.2.0 — Contas, empresas e RLS (2026-11-27)

### Adicionado
- Rotas Next.js para cadastro, login, confirmação, configuração de empresa e painel privado.
- Proxy de sessão Supabase para Next.js 16; leitura de identidade em cada rota protegida.
- Formulário para dono convidar funcionários, geração de link manual, aceite com e-mail confirmado.
- Migração PostgreSQL com três tabelas, RLS, vínculos por empresa, papéis e funções transacionais de criação e convite.
- Regras CPF/CNPJ e de redirecionamento interno verificadas com testes Node.
- Teste SQL de isolamento para execução em Supabase local, ainda não executado.

### Limitações conhecidas
- Supabase não configurado nesta sessão; autenticação real e teste de isolamento no banco pendentes.
- Falha de DNS para registry.npmjs.org: npm install, lint, typecheck completo e build Next.js pendentes.
- Convite não envia e-mail automaticamente, apenas link para o dono compartilhar.

## 0.1.0 — Fundação (2026-11-26)

### Adicionado
- Scaffold Next.js (App Router) + TypeScript strict + Tailwind 4.
- Configuração shadcn/ui e componente `Button` reutilizável.
- Clientes Supabase browser/SSR com validação Zod e `.env.example` sem credenciais.
- Página inicial responsiva de apresentação técnica (dados fictícios claramente identificados).
- Endpoint `GET /health` e ícone SVG.
- ESLint, Prettier, testes Node para dinheiro em centavos e integridade da estrutura.
- Documentação e workflow CI do ZoomERP.
