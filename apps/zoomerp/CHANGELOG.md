# Histórico de alterações — ZoomERP

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
