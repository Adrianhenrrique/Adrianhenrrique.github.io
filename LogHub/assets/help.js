/* LogHub Help v1.6 — orientações locais e pesquisa contextual. Nenhum dado é transmitido. */
(() => {
  'use strict';
  const tool = ({cargo:'cargo',sep:'sep',importar:'importar'})[document.body?.getAttribute('data-loghub-style')];
  if (!tool || document.getElementById('lh-help-root')) return;
  const toolNames = {cargo:'CargoQuery',sep:'Separador de números',importar:'Importar Caixas'};
  const toolURLs = {cargo:'../cargoquery/index.html',sep:'../separador/index.html',importar:'../importar-caixas/index.html'};
  const faq = [];
  function add(scope,id,title,keys,answer,more={}) { faq.push({scope,id,title,keys,answer,...more}); }

  // Ajuda geral, aplicável às três ferramentas.
  add('all','seguranca','Os meus dados ficam seguros?', 'seguranca privacidade sigilo confidencial dados enviados nuvem servidor offline local empresa',
    'As ferramentas processam planilhas e textos no próprio navegador. O assistente de ajuda também trabalha localmente e não envia sua pergunta ou seus dados a um serviço de IA. Evite compartilhar informações sigilosas sem autorização da empresa. Arquivos só vão para o sistema de destino quando você fizer a importação por conta própria.');
  add('all','ciencia','Isso é uma inteligência artificial?', 'inteligencia artificial ia algoritmo robo bot respostas como responde entende perguntas',
    'É um assistente de ajuda com busca inteligente sobre as funções do LogHub, não um chatbot de IA conectado à internet. Ele identifica palavras, sinônimos, assuntos próximos e erros de digitação. Se não encontrar uma orientação confiável, oferece as dúvidas mais relacionadas sem inventar procedimentos.');
  add('all','numerocientifico','O Excel mudou meus códigos para notação científica. E agora?', 'excel numero cientifico notacao 1e+ zeros esquerda 18 digitos rg caixa rg pallet perdeu codigo',
    'O Excel pode interpretar identificadores longos como números e alterar dígitos depois da 15ª posição. Para conferir, abra pelo recurso Dados → De Texto/CSV e configure as colunas RG Caixa e RG Pallet como TEXTO antes de carregar; ou use o botão “Conferir no Excel (.xlsx)” do Importar Caixas. Se o Excel já modificou os dígitos, recupere o identificador da fonte original: não é possível reconstruir os números perdidos só pela notação científica.', {target:{importar:'#conferirExcel'}});
  add('all','qual','Qual ferramenta devo usar?', 'qual ferramenta usar escolher melhor cargo separador importar ajuda finalidade recursos diferença',
    'Use CargoQuery quando tiver uma tabela de caixas/estados e quiser separar COLETADO dos demais ou extrair listas para MySQL. Use Separador para transformar uma lista solta de códigos em uma linha separada por vírgulas. Use Importar Caixas quando precisar preparar o CSV de entrada de caixas a partir de uma planilha.', {related:['cargo-como','sep-como','imp-como']});
  add('all','internet','Preciso instalar alguma coisa?', 'instalar instalar programa cadastro login senha internet navegador celular requisitos',
    'Não é necessário instalar programa nem criar conta para usar as ferramentas. Abra o LogHub no navegador. A página e suas bibliotecas precisam carregar inicialmente; depois que carregam, o processamento acontece no seu dispositivo. A compatibilidade depende do navegador e do arquivo utilizado.');
  add('all','erro','Algo não funciona. Como resolver?', 'erro travou nao funciona bug problema tela branco falhou nao carrega lentidao botao',
    'Primeiro confira se o arquivo está no formato aceito e se todos os campos obrigatórios estão preenchidos. Observe as mensagens da ferramenta. Se os dados forem importantes, faça uma cópia antes de atualizar a página. Em importações muito grandes, espere o processamento terminar antes de clicar novamente. Se persistir, anote a mensagem de erro, a ferramenta e o que você estava tentando fazer.', {related:['imp-erros','cargo-colunas','sep-entrada']});
  add('all','atualizar','Como o LogHub recebe atualizações?', 'atualiza atualizacao nova versao recarregar aviso atualização navegador cache atualizar pagina',
    'As melhorias são publicadas pelo GitHub Pages. Normalmente você recebe os arquivos novos quando navega para outra página ou abre o site novamente. Evite recarregar com informações ainda não copiadas ou exportadas. O assistente não força atualizações nem altera seu trabalho.');

  // CargoQuery.
  add('cargo','cargo-como','Como usar o CargoQuery?', 'como funciona iniciar passo passo trabalhar usar cargoquery consulta carga tabelas',
    '1. Cole a tabela no campo “Entrada de dados” ou clique em “Importar Excel / CSV”.\n2. Se for Excel com várias abas, confira “Aba do Excel”.\n3. Clique em “Processar dados”.\n4. Consulte os indicadores e as duas seções de resultado: COLETADO e os outros estados.\n5. Escolha o campo, o formato da lista e copie ou exporte o resultado.', {target:'#source',related:['cargo-formato','cargo-status','cargo-copiar']});
  add('cargo','cargo-formato','Quais arquivos o CargoQuery aceita?', 'formatos aceitos excel xlsx xls xlsm csv tsv markdown md txt tabela planilha arquivo enviar upload',
    'Aceita arquivos .xlsx, .xls, .xlsm, .csv, .tsv, .md e .txt. Também é possível colar tabelas do Excel, CSV separado por vírgula ou ponto e vírgula e tabelas Markdown. Clique em “Importar Excel / CSV”, arraste um arquivo para a caixa ou cole o conteúdo.', {target:'#fileBtn',related:['cargo-colunas','cargo-aba']});
  add('cargo','cargo-status','Como o CargoQuery separa COLETADO, VERIFICADO e outros estados?', 'status estado verificado significado coletado pendente outros nao coletado separa filtro classificação diferencia',
    'A ferramenta coloca no grupo COLETADO as linhas cujo Estado é COLETADO. No grupo VERIFICADO / OUTROS ficam os demais estados, inclusive vazios. Ela preserva o texto original de Estado nos dados da tabela. As listas e exportações são independentes entre esses dois grupos.', {target:'#collected',related:['cargo-filtro','cargo-contagem']});
  add('cargo','cargo-copiar','Como copiar a consulta para o MySQL?', 'mysql sql in consulta copiar rg caixa lote pallet aspas virgulas formato banco select query',
    'Depois de processar, escolha “CAMPO PARA EXTRAIR” (por exemplo RG Caixa, Lote ou Nº Pallet) e um formato: “Com aspas”, “Só vírgulas” ou “SQL IN (...)”. Em COLETADO ou VERIFICADO / OUTROS, clique em “Copiar lista”. Use aspas para identificadores textuais, especialmente com zeros à esquerda.', {target:'#fieldSelect',related:['cargo-repetidos','cargo-status']});
  add('cargo','cargo-colunas','O arquivo não reconhece as colunas. O que faço?', 'colunas cabeçalho identificou reconhece nao achou arquivo errado coluna lote estado rg cabecalho',
    'Confira se a primeira linha útil contém os nomes das colunas e se RG Caixa, Estado e os campos desejados estão disponíveis. Ao colar dados, mantenha os separadores entre colunas. Se a planilha tiver várias abas, selecione a que contém a tabela. Se a origem veio por chat, tente colar como tabela tabulada ou use o arquivo original.', {target:'#source',related:['cargo-aba','cargo-formato']});
  add('cargo','cargo-aba','Como escolher outra aba do Excel?', 'aba excel planilha worksheet sheet selecionar mudou outra pagina guia',
    'Após importar um arquivo Excel com mais de uma aba, procure o seletor “Aba do Excel” abaixo do campo de entrada. Escolha a aba que contém as informações desejadas; a ferramenta atualiza os dados a partir dela.', {target:'#sheetSelect'});
  add('cargo','cargo-repetidos','Como remover códigos repetidos?', 'duplicados remover repetidos duplicidade unico unico distintos eliminar iguais',
    'Marque “Remover repetidos” ao lado das opções de formato. Essa opção modifica a lista que será copiada; por padrão, RG Caixa mantém todos os registros e os demais campos podem trabalhar com valores distintos. Confira as contagens antes de exportar.', {target:'#distinctCheck'});
  add('cargo','cargo-filtro','Como localizar uma caixa ou lote?', 'pesquisar localizar encontrar busca filtro filtrar rg caixa pallet produto lote registro especifico',
    'Nas tabelas COLETADO e VERIFICADO / OUTROS há campos de busca. Digite parte de um código, lote ou expedição para filtrar a tabela daquele grupo e a lista correspondente. Limpe o filtro para voltar a visualizar todos os registros.', {target:'#coletadoFilter'});
  add('cargo','cargo-contagem','O que significam os indicadores?', 'contador total registros coletados outros lotes estatistica visao geral numero',
    'A “Visão geral” mostra o total de linhas processadas, quantas estão como COLETADO, quantas estão nos demais estados e quantos lotes distintos foram identificados. Eles ajudam a conferir o resultado antes de copiar ou exportar.', {target:'#totalCounter'});
  add('cargo','cargo-exportar','Como exportar as tabelas do CargoQuery?', 'exportar tabela arquivo baixar csv download coletado verificado dados',
    'Depois de processar, use “Exportar CSV” na seção COLETADO ou VERIFICADO / OUTROS. Os resultados são separados por estado. Se houver filtro de busca aplicado, revise os registros exibidos antes de exportar.', {target:'#collected'});
  add('cargo','cargo-udc','Qual a diferença entre UdC e DC?', 'udc dc unidade distribuição diferenca coluna separadas',
    'O CargoQuery trata UdC e DC como colunas diferentes. Se seu relatório tem UdC, não presuma que seja DC. Escolha exatamente o campo presente na origem; a própria ferramenta destaca essa distinção.', {target:'#fieldSelect'});
  add('cargo','cargo-exemplo','Quero testar sem usar uma planilha real.', 'exemplo demo testar simular dados demonstraçao botao',
    'Clique em “Testar exemplo” no painel de entrada. Depois pressione “Processar dados” para explorar as duas categorias, formatos e filtros sem precisar usar uma planilha operacional.', {target:'#demoBtn'});
  add('cargo','cargo-vazio','Por que não apareceu resultado?', 'nao aparece resultado vazio nenhum registro nenhuma caixa sem dados processar branco',
    'Confira se você inseriu ou carregou uma tabela e clicou em “Processar dados”. Verifique as mensagens abaixo da entrada, os nomes de coluna e os filtros de busca. Se uma categoria não tiver registros com aquele Estado, a lista dela ficará vazia.', {target:'#message',related:['cargo-colunas','cargo-status']});

  // Separador de números.
  add('sep','sep-como','Como funciona o Separador de números?', 'como funciona separador usar passo passo colar converter numeros codigos lista',
    'Cole os códigos no campo “Seus números”, um por linha ou separados por espaços, vírgulas e outros separadores reconhecidos. A ferramenta forma automaticamente uma lista em uma linha no campo “Pronto para consultar”. Ajuste as opções de aspas, parênteses, espaços e repetidos; depois clique em “Copiar lista”.', {target:'#entrada',related:['sep-formatar','sep-repetidos','sep-copiar']});
  add('sep','sep-entrada','Que tipo de lista posso colar?', 'colar dados whatsapp teams chat mensagem texto excel tabula quebra linha espaços virgula',
    'Você pode colar códigos recebidos por chat, copiados do Excel ou digitados manualmente. O separador lê os valores e monta uma saída única; ele não precisa de uma planilha completa. Se houver rótulos e comentários misturados, confira o resultado antes de copiar.', {target:'#entrada'});
  add('sep','sep-formatar','Como colocar aspas, vírgulas e parênteses?', 'aspas simples parenteses virgulas espaço formatacao sql in lista quotation',
    'Use as opções em “Formato da lista”: “Espaço depois da vírgula”, “Entre aspas simples” e “Entre parênteses”. Exemplo: com aspas e parênteses, 001 e 002 podem virar (\'001\',\'002\'). A saída muda na hora, sem clicar em Processar.', {target:'#optAspas',related:['sep-repetidos','cargo-copiar']});
  add('sep','sep-repetidos','Como tirar itens repetidos?', 'duplicado duplicata repetidos iguais eliminar remover tirar valores',
    'Marque “Tirar repetidos” na parte de baixo da página. O sistema mantém uma ocorrência de cada código na lista resultante e informa quantos repetidos foram retirados.', {target:'#optRepetidos'});
  add('sep','sep-copiar','Como copiar o resultado?', 'copiar resultado clipboard área transferencia copiar lista botão não copia',
    'Cole os dados à esquerda, confira a saída à direita e clique em “Copiar lista”. Se o navegador bloquear a área de transferência, a ferramenta seleciona o texto para você copiar manualmente (Ctrl+C ou o comando de copiar do celular).', {target:'#copiar'});
  add('sep','sep-zeros','Os zeros à esquerda são preservados?', 'zero a esquerda zeros rg caixa rg pallet 18 digitos codigo grande notacao cientifica',
    'O Separador trabalha com textos de códigos; se você colar 000123, ele não precisa transformá-lo em número. Porém, se o Excel já alterou um RG longo para notação científica ou descartou dígitos, recupere o código original antes de colar.', {target:'#entrada',related:['numerocientifico']});
  add('sep','sep-limpar','Como limpar o Separador?', 'apagar limpar reset começar novamente reiniciar caixa entrada',
    'Clique em “Limpar” abaixo do campo “Seus números”. A entrada e a saída calculada ficam vazias. As preferências de formato podem continuar marcadas para a próxima utilização.', {target:'#limpar'});
  add('sep','sep-vazio','Por que a lista de saída está vazia?', 'nao gerou resultado em branco vazio sem lista botão desabilitado sem resultado',
    'Primeiro digite ou cole algum código em “Seus números”. A conversão é automática. Se a saída continuar vazia, revise o conteúdo colado: textos sem códigos aproveitáveis podem não gerar valores.', {target:'#entrada'});
  add('sep','sep-sql','Posso usar a lista em uma consulta SQL?', 'mysql sql in banco select where consulta codigo aspas parenteses',
    'Sim, a lista pode ajudar a preencher uma condição IN (...), especialmente com “Entre aspas simples” e “Entre parênteses”. Verifique se o nome da coluna e a consulta estão corretos no seu banco. Se você precisa separar caixas por status, prefira o CargoQuery.', {target:'#optParenteses',related:['cargo-copiar']});
  add('sep','sep-conta','O que significam os contadores?', 'quantidade total numeros contagem quantidade repetidos tirados',
    'O contador de entrada indica quantos valores foram identificados. O contador da lista mostra quantos ficaram no resultado e, quando a remoção de repetidos está marcada, quantos foram excluídos da lista.', {target:'#contaEntrada'});
  add('sep','sep-arquivo','O Separador importa arquivo Excel diretamente?', 'abrir arquivo excel planilha xlsx csv importar upload separador',
    'O Separador é destinado à colagem de códigos em texto, não à leitura direta de planilhas. Para importar Excel ou CSV, use o CargoQuery; para gerar CSV de entrada de caixas, use Importar Caixas.', {related:['cargo-formato','imp-arquivo']});

  // Importar Caixas.
  add('importar','imp-como','Como preparar uma importação de caixas?', 'como funciona importacao caixas passo passo iniciar gerar csv dissolve usar',
    '1. Informe a Filial (obrigatória) e, se necessário, Expedição, Pedido e UdC.\n2. Clique em “Selecionar arquivo” ou arraste uma planilha; também pode colar as linhas no campo.\n3. Confira as caixas e as mensagens de validação na pré-visualização.\n4. Baixe o CSV ou ZIP, de acordo com a quantidade.\n5. Faça a importação no sistema de destino, na ordem das sequências.', {target:'#arquivoArea',related:['imp-arquivo','imp-filial','imp-lotes']});
  add('importar','imp-arquivo','Como importar um Excel automaticamente?', 'selecionar arquivo abrir excel upload xls xlsx xlsm csv tsv txt arrastar planilha carregar detectar colunas',
    'Use “Selecionar arquivo” ou arraste um .xls, .xlsx, .xlsm, .csv, .tsv ou .txt para a área de importação. O LogHub procura uma aba com o cabeçalho esperado e preenche o campo de dados automaticamente. Confira a tabela de pré-visualização; se a planilha tiver nomes de coluna diferentes, pode ser necessário ajustá-la na origem.', {target:'#abrirArquivo',related:['imp-colunas','imp-erros']});
  add('importar','imp-colar','Posso copiar e colar em vez de enviar um arquivo?', 'colar planilha ctrl v texto campo manual whatsapp teams copiar',
    'Sim. Cole as linhas com colunas separadas por TAB no campo abaixo da área de arquivos. Pode incluir ou não a linha de cabeçalho. A tabela de pré-visualização e a validação são atualizadas conforme você digita ou cola.', {target:'#entrada'});
  add('importar','imp-filial','Por que preciso informar a Filial?', 'filial obrigatoria preencher campo necessario salva codigo ex 0001',
    'A Filial é obrigatória no CSV. O valor é aplicado a todas as caixas e fica salvo no navegador para facilitar a próxima utilização. Expedição, Pedido e UdC são campos opcionais; quantidade de caixas e status de entrada são preenchidos automaticamente.', {target:'#filial'});
  add('importar','imp-colunas','Quais colunas a planilha deve conter?', 'colunas cabeçalho formato layout item produto lote rg pallet nr pallet rg caixa peso liquido bruto peso padrao mínimo maximo',
    'O modelo de origem espera Item, Lote, RG Pallet, RG Caixa, Peso Pad., Peso Liq., Peso Bru., Pes. Min. e Pes. Max. O CSV final utiliza Produto, Lote, Nº Pallet, RG Caixa, Peso Líquido e Peso Bruto; pesos padrão, mínimo e máximo não entram nesse CSV. A Filial é informada separadamente.', {target:'#entrada'});
  add('importar','imp-lotes','Como funciona a divisão dos CSVs em ZIP?', 'zip dividido divisão 4500 4.500 7000 7 mil 9000 lotes partes sequencia arquivos maximo baixar separar',
    'Até 4.500 caixas, o download é um CSV único. Acima disso, o sistema cria um ZIP com quantos CSVs forem necessários, cada um com no máximo 4.500 caixas e seu próprio cabeçalho. Exemplo: 7.000 caixas geram dois CSVs, com 4.500 e 2.500 registros. Os nomes mostram SEQ_01_DE_02 e SEQ_02_DE_02. Importe um por vez, na sequência.', {target:'#baixar',related:['imp-csv','imp-limite']});
  add('importar','imp-limite','Quantas caixas cada arquivo pode ter?', 'limite maximo linhas quantidade 4500 quatro mil quinhentos registro cabeçalho quantos csv',
    'O limite é 4.500 registros de caixas por CSV, sem contar o cabeçalho. Com 4.501 caixas, são dois arquivos (4.500 + 1). Com 9.001 caixas, são três (4.500 + 4.500 + 1). A divisão é automática no download.', {target:'#lotesInfo'});
  add('importar','imp-sequencia','Em que ordem devo importar os CSVs?', 'ordem importar sequencia seq_01 seq_02 espera servidor dissolve intervalo zip ordem',
    'Depois de extrair o ZIP, envie primeiro o arquivo SEQ_01, espere a importação terminar no sistema de destino e só então envie SEQ_02, SEQ_03 etc. O LogHub prepara os arquivos, mas não os envia nem controla a fila de importação no sistema da empresa.', {target:'#baixar',related:['imp-lotes']});
  add('importar','imp-csv','Qual é o formato do CSV final?', 'csv modelo layout separador ponto virgula aspas utf8 colunas download estrutura',
    'O CSV gerado utiliza UTF-8, ponto e vírgula (;) entre colunas e todos os campos entre aspas. Mantém o modelo exigido: Filial, Expedição, Pedido, Nr Pallet, Produto, Lote, Rg Caixa, Peso Líquido, Peso Bruto, UdC, Quantidade de Caixas e Status da Caixa. O status é ENTRADA e a quantidade por linha é 1.', {target:'#baixar'});
  add('importar','imp-excel','Como conferir os RGs no Excel sem perder dígitos?', 'excel xlsx conferencia rg 18 digitos notacao científica zeros codigo numero grande verificar',
    'Clique em “Conferir no Excel (.xlsx)” para baixar uma planilha de conferência que armazena os identificadores como TEXTO. Ela é só para revisão; não use esse XLSX como substituto do CSV de importação. Evite abrir e salvar o CSV comum pelo Excel, pois o programa pode alterar os RGs.', {target:'#conferirExcel',related:['numerocientifico']});
  add('importar','imp-erros','Por que o botão Baixar está desabilitado?', 'baixar cinza bloqueado erro invalidos faltando obrigatório download desabilitado corrigir',
    'O botão só é habilitado quando há registros e os campos obrigatórios estão válidos. Preencha Filial; confira Item/Produto, Lote, RG Pallet, RG Caixa, Peso Líquido e Peso Bruto. Consulte as mensagens abaixo dos botões: elas indicam os campos ou linhas com problema.', {target:'#status',related:['imp-filial','imp-pesos']});
  add('importar','imp-pesos','Como preencher os pesos?', 'peso liquido bruto virgula decimal ponto peso ruim valido negativo maior',
    'Os pesos líquido e bruto são necessários. A ferramenta aceita vírgula decimal e converte para ponto no CSV. Valores vazios ou inválidos bloqueiam a exportação. Se o peso líquido for maior que o bruto, aparece um aviso para conferência.', {target:'#msgs'});
  add('importar','imp-duplicados','Como identificar RG Caixa repetido?', 'repetido duplicado rg caixa duplicidade linha amarela avisa',
    'Quando encontra RG Caixa repetido, a pré-visualização destaca as linhas em amarelo e informa quantas duplicidades foram detectadas. É um aviso para revisão. Confira o relatório de origem antes de continuar.', {target:'#prev'});
  add('importar','imp-previa','O que aparece na pré-visualização?', 'prévia visualizar preview tabela conferencia caixas campos erros marcados contagem',
    'A tabela final mostra como cada linha ficará na importação: Filial, Pedido, Pallet, Produto, Lote, RG Caixa, pesos e demais campos. As células problemáticas são destacadas, e o total de caixas aparece no título. Revise essa etapa antes de baixar.', {target:'#prev'});
  add('importar','imp-copiar','Posso copiar o CSV em vez de baixar?', 'copiar csv clipboard transferir resultado texto',
    'Sim. Depois que os dados estiverem válidos, o botão “Copiar CSV” disponibiliza o conteúdo para a área de transferência. Para grandes volumes, prefira “Baixar CSV/ZIP”, que cria as partes numeradas; “Copiar CSV” não separa o conteúdo em arquivos.', {target:'#copiar'});
  add('importar','imp-limpar','Como limpar uma importação?', 'limpar apagar reiniciar zerar arquivo trocar importacao',
    'Clique em “Limpar” para remover as linhas do campo de entrada e reiniciar a pré-visualização. O valor da Filial permanece para facilitar o próximo lote. Se precisar importar outro arquivo, selecione-o novamente.', {target:'#limpar'});
  add('importar','imp-dissolve','Esse recurso ajuda no dissolve?', 'dissolve dissolver desova recebimento separação varias importações operacional',
    'O Importar Caixas pode agilizar rotinas com muitas caixas, como uma operação de dissolve: ele lê a planilha, valida as linhas e divide o download em arquivos CSV numerados para importar em sequência. A execução no sistema da empresa continua manual e deve seguir os procedimentos internos.', {target:'#arquivoArea',related:['imp-sequencia','imp-lotes']});

  const presets = {
    cargo:['cargo-como','cargo-formato','cargo-copiar','cargo-status'],
    sep:['sep-como','sep-formatar','sep-repetidos','sep-zeros'],
    importar:['imp-como','imp-arquivo','imp-lotes','imp-excel']
  };
  const byId = Object.fromEntries(faq.map(item => [item.id,item]));
  const stop = new Set('a o as os de do da dos das e em no na nos nas um uma uns umas pra para por com que como qual quais quando onde eu voce vc isso isto tem eh ai me meu minha seu sua ele ela aqui fala queria preciso quero consigo posso pode poderia fazer estou ser sao foi fica ficar esta estao oq qq nao'.split(' '));
  const synonyms = {
    cx:'caixa',caixas:'caixa',rgc:'rg',rgk:'rg',pallets:'pallet',palete:'pallet',paletes:'pallet',palheta:'pallet',
    numeros:'numero',numeros:'numero',num:'numero',codigos:'codigo',cod:'codigo',identificador:'codigo',identificadores:'codigo',
    carregamento:'importar',carregar:'importar',upload:'importar',enviar:'importar',arquivo:'arquivo',arquivos:'arquivo',planilhas:'planilha',
    importacao:'importar',importacoes:'importar',importando:'importar',baixando:'baixar',download:'baixar',exportacao:'exportar',
    virgulas:'virgula',aspas:'aspas',parentese:'parenteses',duplicados:'repetido',duplicidade:'repetido',duplicata:'repetido',
    colunas:'coluna',cabecalhos:'cabecalho',numeracao:'numero',cientifica:'cientifico',exponencial:'cientifico',
    separado:'separar',separado:'separar',divisao:'dividir',dividido:'dividir',quebrar:'dividir',partes:'dividir',
    error:'erro',problema:'erro',erros:'erro',funcionamento:'funciona',utilizar:'usar',utilizo:'usar',
    digitacao:'digitar',preservar:'manter',zera:'zero',zeros:'zero',colando:'colar',csvs:'csv',lotes:'lote'
  };
  function norm(s) {return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function tokens(s) {
    return norm(s).split(/\s+/).filter(Boolean).map(x => synonyms[x] || (x.length>6 && x.endsWith('s') ? x.slice(0,-1) : x)).filter(x=>x.length>1&&!stop.has(x));
  }
  const catalog = faq.map(item=>{
    const title = new Set(tokens(item.title));
    const keys = new Set(tokens(item.keys));
    const answer = new Set(tokens(item.answer));
    return {...item,titleSet:title,keySet:keys,answerSet:answer};
  });
  const known = new Set(catalog.flatMap(x=>[...x.titleSet,...x.keySet]));
  const editCache = new Map();
  function distance(a,b){
    if(a===b)return 0; if(Math.abs(a.length-b.length)>2)return 3;
    const prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      let left=i,diag=i-1;
      for(let j=1;j<=b.length;j++){const saved=prev[j];prev[j]=Math.min(prev[j]+1,left+1,diag+(a[i-1]===b[j-1]?0:1));diag=saved;left=prev[j];}
    }
    return prev[b.length];
  }
  function correct(word){
    if(known.has(word)||word.length<4||/\d/.test(word))return word;
    if(editCache.has(word))return editCache.get(word);
    let best=word,score=3;
    for(const candidate of known){
      if(Math.abs(candidate.length-word.length)>2 || candidate[0]!==word[0])continue;
      const d=distance(word,candidate);
      if(d<score && d<= (word.length>=7?2:1)){score=d;best=candidate;if(d===1)break;}
    }
    editCache.set(word,best);return best;
  }
  function rank(query,context){
    const raw = tokens(query);
    const q = [...new Set(raw.map(correct))];
    if(!q.length) return [];
    const queryPlain = norm(query);
    return catalog.map(doc=>{
      let points=0,matched=0;
      for(const word of q){
        const direct = doc.titleSet.has(word), key = doc.keySet.has(word), body=doc.answerSet.has(word);
        if(direct||key||body){matched++;points+=direct?5:key?3.7:1.1;}
      }
      const coverage=matched/q.length;
      points += coverage*5.5;
      if(coverage===1)points+=3;
      if(queryPlain.includes(norm(doc.title)))points+=10;
      if(doc.scope===tool)points*=1.16;
      if(doc.scope==='all')points*=.94;
      if(context && context===doc.scope && q.length<=2)points+=.7;
      return {...doc,score:Math.round(points*100)/100,coverage,matched};
    }).filter(x=>x.matched>0 && x.score>0).sort((a,b)=>b.score-a.score || (a.scope===tool?-1:1));
  }
  function getFAQ(id){return byId[id];}

  const root=document.createElement('div');root.id='lh-help-root';root.className='lh-help';
  root.innerHTML=`<button class="lh-help-launch" type="button" aria-label="Abrir assistente de ajuda" aria-controls="lh-help-panel" aria-expanded="false"><span class="lh-help-launch-icon" aria-hidden="true">?</span><span class="lh-help-launch-label">Precisa de ajuda?</span></button>
    <section class="lh-help-panel" id="lh-help-panel" role="dialog" aria-label="Assistente de ajuda do LogHub" hidden>
      <header class="lh-help-head"><span class="lh-help-boticon" aria-hidden="true">✳</span><div class="lh-help-heading"><strong>Assistente LogHub</strong><span>Ajuda para ${toolNames[tool]} · respostas locais</span></div><button class="lh-help-close" type="button" aria-label="Fechar ajuda">×</button></header>
      <div class="lh-help-conversation" role="log" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
      <div class="lh-help-presets" aria-label="Perguntas sugeridas"></div>
      <form class="lh-help-compose"><label class="lh-help-sr" for="lh-help-input">Sua pergunta</label><input type="text" id="lh-help-input" maxlength="280" autocomplete="off" placeholder="Ex.: Como importar minha planilha?" required><button type="submit" aria-label="Enviar pergunta">➜</button></form>
      <p class="lh-help-note">Ajuda automática, sem IA externa. Não envie códigos ou informações confidenciais.</p>
    </section>`;
  document.body.appendChild(root);
  const launch=root.querySelector('.lh-help-launch');
  const panel=root.querySelector('.lh-help-panel');
  const close=root.querySelector('.lh-help-close');
  const log=root.querySelector('.lh-help-conversation');
  const presetsEl=root.querySelector('.lh-help-presets');
  const form=root.querySelector('.lh-help-compose');
  const input=root.querySelector('#lh-help-input');
  let lastScope=tool,lastId=null,opened=false;
  function show(open){
    opened=open;
    panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));
    if(open){input.focus({preventScroll:true});log.scrollTop=log.scrollHeight;}
    else launch.focus({preventScroll:true});
  }
  launch.addEventListener('click',()=>show(!opened));
  close.addEventListener('click',()=>show(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && opened && !e.defaultPrevented){show(false);e.preventDefault();}});
  function node(tag,cls,content){const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;}
  function addMessage(kind,text){
    const bubble=node('div','lh-help-message lh-help-'+kind);
    if(kind==='bot'){bubble.appendChild(node('span','lh-help-avatar','✳'));}
    bubble.appendChild(node('div','lh-help-text',text));
    log.appendChild(bubble);
    log.scrollTop=log.scrollHeight;
    return bubble;
  }
  function chip(label,handler){const b=node('button','lh-help-chip',label);b.type='button';b.addEventListener('click',handler);return b;}
  function suggestions(ids){
    presetsEl.replaceChildren();
    const distinct = [...new Set(ids)].slice(0,4).map(getFAQ).filter(Boolean);
    for(const item of distinct)presetsEl.appendChild(chip(item.title,()=>ask(item.title)));
  }
  function showAnswer(item){
    lastId=item.id;lastScope=item.scope;
    const wrap=addMessage('bot',item.answer);
    const controls=node('div','lh-help-answer-actions');
    if(item.target){
      const selector=typeof item.target==='string'?item.target:item.target[tool];
      if(selector && document.querySelector(selector)){
        controls.appendChild(chip('Mostrar na página ↗',()=>{
          show(false);const el=document.querySelector(selector);
          el.scrollIntoView({behavior:'smooth',block:'center'});
          if(typeof el.focus==='function' && el.matches('button,input,select,textarea,a'))el.focus({preventScroll:true});
        }));
      }
    }
    if(item.scope!=='all' && item.scope!==tool) {
      const a=node('a','lh-help-chip lh-help-switch','Abrir '+toolNames[item.scope]+' ↗');a.href=toolURLs[item.scope];controls.appendChild(a);
    }
    if(controls.childNodes.length)wrap.appendChild(controls);
    const related=item.related?.length?item.related:presets[tool].filter(id=>id!==item.id);
    suggestions(related);
  }
  const generic=/^(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|ajuda|socorro|help|o que e isso|o que faz|como funciona|como usar|nao sei usar|primeira vez)[\s!?.]*$/i;
  function ask(text){
    const question=String(text||'').trim();if(!question)return;
    addMessage('user',question);input.value='';
    const plain=norm(question);
    if(generic.test(question) || /^(?:o que (?:voce|vc|essa ferramenta|esse sistema) (?:pode )?faz|pra que serve|para que serve|me ajuda|me ajude|o que posso fazer|o que esse site faz|quais funcoes|quais recursos)/.test(plain)){
      showAnswer(getFAQ(presets[tool][0]));return;
    }
    if(tool==='cargo' && /verificado/.test(plain) && /(?:significa|estado|status|quer dizer)/.test(plain)){
      showAnswer(getFAQ('cargo-status'));return;
    }
    if(tool==='importar' && /(?:nao|erro|travado|bloqueado|cinza|desabilitado|problema)/.test(plain) && /(?:baixar|download|exportar|csv|zip)/.test(plain)){
      showAnswer(getFAQ('imp-erros'));return;
    }
    if(lastId && /^(?:e )?(?:depois|agora|proximo passo|em seguida)[ ?!.]*$/.test(plain)){
      const previous=getFAQ(lastId);
      const related=previous?.related?.map(getFAQ).find(x=>x&&x.scope===tool);
      showAnswer(related||getFAQ(presets[tool][0]));return;
    }
    const hits=rank(question,lastScope);
    const first=hits[0];
    if(first && (first.score>=7.3 && first.coverage>=.38 || first.coverage===1 && first.score>=6)) {
      showAnswer(first);
      // Sem prometer certeza quando a pergunta é pouco específica.
      if(hits[1] && hits[1].score>=first.score*.81 && hits[1].id!==first.id && first.coverage<.9){
        const note=addMessage('bot','Sua pergunta também pode estar relacionada a outro recurso. Se não era isso, escolha uma das sugestões abaixo.');
        note.classList.add('lh-help-secondary');
        suggestions([hits[1].id,hits[2]?.id,...presets[tool]]);
      }
    } else if(first && first.score>=3.5){
      addMessage('bot','Não encontrei uma resposta exata, mas esta orientação parece próxima do que você perguntou:');
      showAnswer(first);
      suggestions([hits[1]?.id,hits[2]?.id,...presets[tool]]);
    }else{
      addMessage('bot','Ainda não encontrei uma orientação confiável para essa pergunta. Posso ajudar com importação de planilhas, consultas, formatação de códigos, erros e exportação. Tente explicar o que apareceu na tela ou escolha uma das perguntas abaixo.');
      suggestions([...hits.slice(0,2).map(x=>x.id),...presets[tool]]);
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);input.focus();});
  addMessage('bot',`Olá! 👋 Posso explicar como usar ${toolNames[tool]}, resolver dúvidas comuns e mostrar onde encontrar cada função. O que você gostaria de saber?`);
  suggestions(presets[tool]);
  // Disponibiliza somente um pequeno gancho de teste, sem acesso a dados de operação.
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
    window.__logHubHelpTest={rank:(query)=>rank(query,tool).slice(0,5).map(({id,title,score,coverage})=>({id,title,score,coverage})),count:faq.length};
  }
})();

