# Estoque 1.2 — candidato de migration

Não aplicar em produção. O CLI Supabase não está disponível nesta execução, portanto o SQL fica como candidato até gerar o arquivo versionado com `supabase migration new estoque_fase_1_2` em ambiente local. Aplicar as migrations anteriores e este candidato em banco isolado, executar `psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/03_estoque.sql` e revisar advisors antes de publicar.

Saldo ausente = zero. Movimentação é atômica, bloqueada por produto, com chave de idempotência por produto, histórico sem escrita direta, ajuste por contagem absoluta e estorno compensatório. Dono escreve, membros leem. Quantidades até três casas decimais; un/cx/pct inteiras. O teste SQL ainda não foi executado. Testar também concorrência com duas conexões, papel funcionário, arquivo e saldo negativo antes do merge.

Estoque mínimo opcional em produtos; alerta de reposição quando saldo <= limite. A view `estoque_catalogo` usa `security_invoker=true`, exige PostgreSQL 15+ e não dá acesso a escrita. O teste SQL inclui limite zero, fração inválida, NaN, desativação e isolamento da view.

Concorrência: em banco descartável local, execute `ZOOMERP_ALLOW_LOCAL_FIXTURES=yes bash supabase/tests/04_estoque_concorrencia.sh` com `SUPABASE_TEST_DATABASE_URL` configurada. O script abre duas sessões reais, espera exatamente uma saída de 7 a partir de 10, verifica repetição simultânea da mesma chave e saldo final 5. As fixtures são limpas no encerramento; não usar em produção nem por túnel. Ainda não executado.
