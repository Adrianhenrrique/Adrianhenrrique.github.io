# Estoque 1.2 — relatório de homologação

O SQL aplicado e testado na homologação foi versionado em `supabase/migrations/20261127062304_estoque_fase_1_2.sql`, com o identificador retornado pelo Supabase. Não executar novamente no projeto de homologação. Não aplicar em produção antes dos gates finais.

Saldo ausente = zero. Movimentação é atômica, bloqueada por produto, com chave de idempotência por produto, histórico sem escrita direta, ajuste por contagem absoluta e estorno compensatório. Dono escreve, membros leem. Quantidades até três casas decimais; un/cx/pct inteiras. O teste SQL foi executado com sucesso em homologação. Testar também concorrência com duas conexões, papel funcionário, arquivo e saldo negativo antes do merge.

Estoque mínimo opcional em produtos; alerta de reposição quando saldo <= limite. A view `estoque_catalogo` usa `security_invoker=true`, exige PostgreSQL 15+ e não dá acesso a escrita. O teste SQL inclui limite zero, fração inválida, NaN, desativação e isolamento da view.

Concorrência: em banco descartável local, execute `ZOOMERP_ALLOW_LOCAL_FIXTURES=yes bash supabase/tests/04_estoque_concorrencia.sh` com `SUPABASE_TEST_DATABASE_URL` configurada. O script abre duas sessões reais, espera exatamente uma saída de 7 a partir de 10, verifica repetição simultânea da mesma chave e saldo final 5. As fixtures são limpas no encerramento; não usar em produção nem por túnel. O script local não foi executado; cenário equivalente passou via MCP em homologação.

## Homologação — 2026-11-27

Projeto Supabase separado `uaaqbftvjusfhdtkhcod`, São Paulo, cotação US$ 0/mês. Migrations aplicadas: auth_multiempresa (20261127062257), catalogo_produtos_fase_1_1 (20261127062300), estoque_fase_1_2 (20261127062304). Nenhuma migration aplicada em produção.

- Testes SQL 01_isolamento e 03_estoque executados com sucesso via MCP; corrigido delimitador dollar-quoted no teste 03. RLS, permissões de funcionário, saldo, estorno, ajuste, idempotência, limite e isolamento da view validados; rollback confirmado.
- Concorrência testada por duas chamadas de SQL em paralelo, não pelo script local 04: saldo inicial 10, duas saídas de 7, uma aceita e outra rejeitada com ESTOQUE_INSUFICIENTE; duas entradas de 2 com a mesma chave aceitas sem duplicação. Saldo final 5, soma do ledger 5, três movimentos, uma ocorrência da chave repetida. Fixtures removidas e contagens de empresas, produtos, movimentos e usuários iguais a zero.
- Advisors: três avisos de SECURITY DEFINER nas RPCs anteriores de autenticação; nenhuma nova advertência de segurança do estoque. Nove FKs sem índice de cobertura e três índices ainda não usados (INFO). Não remover índices por estatísticas de banco recém-criado.
- Vercel preview do commit f1d83d2: 39/39 testes e build TypeScript aprovados. CI GitHub ainda falha. A prévia da branch usa exclusivamente o Supabase Homologação por variáveis específicas de Preview. O deploy 7d0b040 foi aprovado (39/39 testes). Consultas agregadas confirmaram uma conta com e-mail confirmado e login, uma empresa e um produto; nenhuma movimentação pela interface ainda comprovada. A CI GitHub, lint e testes visuais permanecem pendentes. Produção v1.1.1 intacta.
