# Estoque 1.2 — candidato de migration

Não aplicar em produção. O CLI Supabase não está disponível nesta execução, portanto o SQL fica como candidato até gerar o arquivo versionado com `supabase migration new estoque_fase_1_2` em ambiente local. Aplicar as migrations anteriores e este candidato em banco isolado, executar `psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/03_estoque.sql` e revisar advisors antes de publicar.

Saldo ausente = zero. Movimentação é atômica, bloqueada por produto, com chave de idempotência por produto, histórico sem escrita direta, ajuste por contagem absoluta e estorno compensatório. Dono escreve, membros leem. Quantidades até três casas decimais; un/cx/pct inteiras. O teste SQL foi executado com sucesso em homologação. Testar também concorrência com duas conexões, papel funcionário, arquivo e saldo negativo antes do merge.

Estoque mínimo opcional em produtos; alerta de reposição quando saldo <= limite. A view `estoque_catalogo` usa `security_invoker=true`, exige PostgreSQL 15+ e não dá acesso a escrita. O teste SQL inclui limite zero, fração inválida, NaN, desativação e isolamento da view.

Concorrência: em banco descartável local, execute `ZOOMERP_ALLOW_LOCAL_FIXTURES=yes bash supabase/tests/04_estoque_concorrencia.sh` com `SUPABASE_TEST_DATABASE_URL` configurada. O script abre duas sessões reais, espera exatamente uma saída de 7 a partir de 10, verifica repetição simultânea da mesma chave e saldo final 5. As fixtures são limpas no encerramento; não usar em produção nem por túnel. O script local não foi executado; cenário equivalente passou via MCP em homologação.

## Homologação — 2026-11-27

Projeto Supabase separado `uaaqbftvjusfhdtkhcod`, São Paulo, cotação US$ 0/mês. Migrations aplicadas: auth_multiempresa (20261127062257), catalogo_produtos_fase_1_1 (20261127062300), estoque_fase_1_2 (20261127062304). Nenhuma migration aplicada em produção.

- Testes SQL 01_isolamento e 03_estoque executados com sucesso via MCP; corrigido delimitador dollar-quoted no teste 03. RLS, permissões de funcionário, saldo, estorno, ajuste, idempotência, limite e isolamento da view validados; rollback confirmado.
- Concorrência testada por duas chamadas de SQL em paralelo, não pelo script local 04: saldo inicial 10, duas saídas de 7, uma aceita e outra rejeitada com ESTOQUE_INSUFICIENTE; duas entradas de 2 com a mesma chave aceitas sem duplicação. Saldo final 5, soma do ledger 5, três movimentos, uma ocorrência da chave repetida. Fixtures removidas e contagens de empresas, produtos, movimentos e usuários iguais a zero.
- Advisors: três avisos de SECURITY DEFINER nas RPCs anteriores de autenticação; nenhuma nova advertência de segurança do estoque. Nove FKs sem índice de cobertura e três índices ainda não usados (INFO). Não remover índices por estatísticas de banco recém-criado.
- Vercel preview do commit f1d83d2: 39/39 testes e build TypeScript aprovados. CI GitHub ainda falha. Preview ainda não vinculado ao banco de homologação; não testar movimentos com credenciais de produção. Validação mobile/autenticação ponta a ponta e publicação permanecem pendentes.
