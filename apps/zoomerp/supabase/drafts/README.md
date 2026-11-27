# Estoque 1.2 — candidato de migration

Não aplicar em produção. O CLI Supabase não está disponível nesta execução, portanto o SQL fica como candidato até gerar o arquivo versionado com `supabase migration new estoque_fase_1_2` em ambiente local. Aplicar as migrations anteriores e este candidato em banco isolado, executar `psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/03_estoque.sql` e revisar advisors antes de publicar.

Saldo ausente = zero. Movimentação é atômica, bloqueada por produto, com chave de idempotência por produto, histórico sem escrita direta, ajuste por contagem absoluta e estorno compensatório. Dono escreve, membros leem. Quantidades até três casas decimais; un/cx/pct inteiras. O teste SQL ainda não foi executado. Testar também concorrência com duas conexões, papel funcionário, arquivo e saldo negativo antes do merge.
