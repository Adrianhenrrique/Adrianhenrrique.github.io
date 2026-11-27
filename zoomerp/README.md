# ZoomERP — conceito de produto

**Status:** projeto em planejamento / Fase 0 ainda não iniciada.

Este diretório contém **somente a apresentação estática do produto** no portfólio de Adrian Henrique. Não é o SaaS, não oferece contas, não armazena dados de clientes e não executa operações de estoque ou venda. Os dados mostrados na interface são **fictícios**.

## Visão

Micro-ERP por assinatura, voltado a MEIs e microempresas brasileiras, com promessa de registrar vendas rapidamente e visualizar estoque e dinheiro em linguagem simples, com foco em celulares.

## MVP planejado

- Produtos e movimentações imutáveis de estoque;
- Venda rápida, baixa de estoque e lançamento em caixa em transação atômica;
- Lançamentos de entrada e saída de dinheiro, contas, clientes e fornecedores;
- Dashboard, relatórios e histórico de auditoria;
- Multiempresa com Supabase Auth + RLS;
- PWA e layout responsivo de 360px ao desktop;
- Estrutura de planos; integração de pagamentos em fase posterior.

## Stack prevista

Next.js (App Router) + TypeScript, Tailwind CSS e shadcn/ui, Supabase (PostgreSQL/Auth/RLS), Zod, Recharts, PWA e Vercel.

## Decisões não iniciadas

Antes da implementação do SaaS: validar a estrutura de pastas, o esquema SQL inicial com RLS e o plano da Fase 0 com o responsável pelo produto. As regras de negócio devem ser testadas (saldo, custo médio, venda/estorno, isolamento multiempresa).

**Aviso:** o futuro MVP é uma solução de controle gerencial e não emite documentos fiscais.
