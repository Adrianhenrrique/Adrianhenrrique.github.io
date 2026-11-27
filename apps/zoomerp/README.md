# ZoomERP — Fundação 0.1

Micro-ERP SaaS para microempresas e MEIs. O objetivo do produto é registrar uma venda em poucos toques e manter estoque e dinheiro organizados. **Esta etapa é apenas o scaffold técnico**: não existe login, banco conectado, venda real, instalação PWA ou cobrança de assinaturas.

Este projeto mora no mesmo repositório do portfólio, em `apps/zoomerp/`. A página pública de conceito está em `/zoomerp/` e é independente do aplicativo Next.js. **GitHub Pages não executa o backend Next.js**; no futuro, configure o projeto Vercel com *Root Directory* `apps/zoomerp`.

## Stack da fundação

- Next.js 16 com App Router, React 19 e TypeScript strict.
- Tailwind CSS 4 e configuração shadcn/ui (`components.json`, `button` reutilizável). Sem biblioteca de ícones customizada; Lucide.
- Supabase JS + SSR com clientes browser/server preparados para a etapa 0.2. **Nenhum usuário, conexão ou política RLS está ativo ainda.**
- Zod para verificar variáveis de ambiente quando o cliente Supabase for utilizado.
- ESLint (Next.js), Prettier e testes nativos do Node para a base.
- Dinheiro representado em **centavos inteiros** (`src/lib/money.ts`) com testes.

## Requisitos

- Node.js 22 ou superior e npm.
- Acesso à internet para instalar os pacotes do npm.

## Rodando localmente

```bash
cd apps/zoomerp
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000` e a verificação de saúde `http://localhost:3000/health`, que retorna `{ "status": "ok", "app": "zoomerp", "phase": "0.1" }`.

**Na Etapa 0.1, o Supabase é opcional**: a página inicial não consulta o banco e pode ser aberta com `.env.local` vazio. Quando iniciar autenticação, crie o projeto Supabase e preencha apenas as variáveis públicas fornecidas pelo painel. Nunca use `service_role` no navegador.

## Testes e qualidade

```bash
npm test             # funções monetárias, estrutura e env; não precisa de servidor
npm run lint         # ESLint Next.js
npm run typecheck    # TypeScript strict
npm run build        # build de produção
npm run check        # lint + typecheck + testes
npm run format:check # padrão Prettier
```

Os testes independentes de pacotes externos podem rodar apenas com Node.js 22:

```bash
node --experimental-strip-types --test tests/*.test.ts tests/*.test.mjs
```

### Estado das verificações

- O *scaffold* e os testes nativos podem ser validados com Node localmente.
- Caso o ambiente não alcance `registry.npmjs.org`, `npm install`, o build Next.js, o ESLint e o typecheck com tipos React ficam **pendentes**. Não confundir esse limite com aprovação de build.
- O workflow `.github/workflows/zoomerp-ci.yml` está preparado para executar instalação, lint, tipagem, testes e build no GitHub Actions.
- Ainda **não existe** lockfile: a instalação inicial gera `package-lock.json`. Versionar esse arquivo após a primeira instalação bem-sucedida para builds reprodutíveis.

## Próximas etapas (não implementadas)

- **0.2:** autenticação, multiempresa, papéis e RLS com testes de isolamento.
- **0.3:** interface do sistema, navegação responsiva e PWA instalável.
- **1.x:** produtos, movimentações imutáveis, PDV com transação única, caixa, dashboard e relatórios.
- Assinaturas e pagamentos ficam em fase posterior.

## Segurança e decisões

- `src/lib/supabase/env.ts` valida variáveis somente quando o cliente Supabase é criado. A página inicial não depende delas.
- O cliente SSR usa cookies; o proxy de atualização de sessão será adicionado na etapa 0.2.
- Nenhuma chave secreta deve entrar em `NEXT_PUBLIC_*` ou em commits.
- O projeto não emite documentos fiscais.
- PWA, gráficos, PDF e Recharts não foram adicionados para evitar dependências prematuras.

O `CHANGELOG.md` documenta cada etapa e o objetivo é manter commits pequenos e testáveis.
