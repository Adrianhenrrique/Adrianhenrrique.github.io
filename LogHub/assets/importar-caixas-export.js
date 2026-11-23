/* LogHub — exportacao em lotes e conferencia Excel. Sem alterar o CSV do sistema. */
(() => {
  'use strict';
  const LIMITE = 4500;
  const botao = document.getElementById('baixar');
  const entrada = document.getElementById('entrada');
  const revisao = document.getElementById('conferirExcel');
  const informacao = document.getElementById('lotesInfo');
  const aviso = document.getElementById('lotesAviso');
  if (!botao || !revisao || !informacao || !aviso || !entrada) return;

  // csvAtual e nomeArquivo sao fornecidos pelo gerador original, que continua
  // responsavel pela validacao, colunas e formato CSV aceito pelo servidor.
  const csvPronto = () => typeof csvAtual === 'string' && csvAtual.length > 0;
  function linhasCSV() {
    if (!csvPronto()) return {cabecalho:'', registros:[]};
    const linhas = csvAtual.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
    return {cabecalho:linhas.shift(), registros:linhas};
  }
  function nomeBase() { return nomeArquivo().replace(/\.csv$/i, ''); }
  function salvar(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
  function atualizarResumo() {
    const {registros} = linhasCSV();
    const n = registros.length;
    revisao.disabled = !csvPronto();
    botao.textContent = n > LIMITE ? `⬇ Baixar ZIP (${Math.ceil(n/LIMITE)} CSVs)` : '⬇ Baixar CSV';
    informacao.textContent = !n
      ? 'Até 4.500 caixas: CSV único. Acima desse limite: ZIP com CSVs numerados.'
      : n <= LIMITE
        ? `${n.toLocaleString('pt-BR')} caixas → 1 CSV, pronto para importar.`
        : `${n.toLocaleString('pt-BR')} caixas → ${Math.ceil(n/LIMITE)} arquivos CSV, até 4.500 caixas cada. Importe na ordem das sequências.`;
  }
  function informar(texto, erro=false) {
    aviso.textContent = texto;
    aviso.dataset.state = erro ? 'error' : 'success';
  }
  function travar(ocupado) {
    botao.disabled = ocupado || !csvPronto();
    revisao.disabled = ocupado || !csvPronto();
  }

  botao.onclick = async () => {
    if (!csvPronto() || botao.disabled) return;
    const {cabecalho, registros} = linhasCSV();
    if (!registros.length) return;
    if (registros.length <= LIMITE) {
      // Sem mudancas: mesmo conteudo do CSV original (UTF-8 sem BOM).
      salvar(new Blob([csvAtual], {type:'text/csv;charset=utf-8'}), nomeArquivo());
      informar('CSV único gerado. RGs originais preservados no arquivo.');
      return;
    }
    if (typeof JSZip === 'undefined') {
      informar('Não foi possível criar o ZIP: recarregue a página e tente novamente.', true);
      return;
    }
    const quantidade = Math.ceil(registros.length / LIMITE);
    const base = nomeBase();
    const zip = new JSZip();
    for (let i = 0; i < quantidade; i++) {
      const parte = registros.slice(i * LIMITE, (i + 1) * LIMITE);
      const sequencia = String(i + 1).padStart(2, '0');
      const total = String(quantidade).padStart(2, '0');
      zip.file(`${base}_SEQ_${sequencia}_DE_${total}.csv`, cabecalho + '\n' + parte.join('\n') + '\n');
    }
    travar(true);
    botao.textContent = 'Preparando ZIP…';
    try {
      const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}});
      salvar(blob, `${base}_${quantidade}_PARTES.zip`);
      informar(`${quantidade} arquivos CSV gerados em sequência, com no máximo ${LIMITE.toLocaleString('pt-BR')} caixas por arquivo.`);
    } catch (e) {
      informar('Falha ao criar o ZIP: ' + (e.message || String(e)), true);
    } finally {
      travar(false);
      atualizarResumo();
    }
  };

  // CSV nao informa ao Excel o tipo de dado. Esta planilha e exclusivamente
  // para conferencia: celulas sempre armazenadas como texto, nunca numeros.
  function lerCSV(texto) {
    const linhas = []; let linha = [], valor = '', aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (c === '"') {
        if (aspas && texto[i+1] === '"') {valor += '"'; i++;}
        else aspas = !aspas;
      } else if (c === ';' && !aspas) {linha.push(valor); valor = '';}
      else if ((c === '\r' || c === '\n') && !aspas) {
        if (c === '\r' && texto[i+1] === '\n') i++;
        linha.push(valor);
        if (linha.some(x => x !== '')) linhas.push(linha);
        linha = []; valor = '';
      } else valor += c;
    }
    if (valor || linha.length) {linha.push(valor); linhas.push(linha);}
    return linhas;
  }
  function xml(v) {
    return String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  }
  function coluna(i) {
    let s = '';
    for (let n = i+1; n > 0; n = Math.floor((n-1)/26)) s = String.fromCharCode(65+(n-1)%26)+s;
    return s;
  }
  async function baixarConferencia() {
    if (!csvPronto() || revisao.disabled) return;
    if (typeof JSZip === 'undefined') {informar('Não foi possível gerar o Excel: recarregue a página.', true);return;}
    travar(true);
    revisao.textContent = 'Preparando Excel…';
    try {
      const rows = lerCSV(csvAtual);
      const sheetData = rows.map((r,i) => '<row r="'+(i+1)+'">' + r.map((v,j)=>
        '<c r="'+coluna(j)+(i+1)+'" s="1" t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>'
      ).join('') + '</row>').join('');
      const zip = new JSZip();
      zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
      zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
      zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Conferencia" sheetId="1" r:id="rId1"/></sheets></workbook>');
      zip.file('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
      zip.file('xl/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" xfId="0"/><xf numFmtId="49" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
      zip.file('xl/worksheets/sheet1.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:L' + rows.length + '"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="12" width="23" customWidth="1"/></cols><sheetData>'+sheetData+'</sheetData></worksheet>');
      const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE', compressionOptions:{level:6}});
      salvar(blob, nomeBase() + '_CONFERENCIA_RG_TEXTO.xlsx');
      informar('Planilha de conferência gerada com RG Pallet e RG Caixa como texto. Não utilize esse XLSX na importação do sistema.');
    } catch(e) {informar('Erro ao preparar conferência: '+(e.message||String(e)),true);}
    finally {travar(false); revisao.textContent='Conferir no Excel (.xlsx)'; atualizarResumo();}
  }
  revisao.addEventListener('click', baixarConferencia);
  for (const id of ['entrada','filial','expedicao','pedido','udc']) {
    document.getElementById(id)?.addEventListener('input', () => {informacao.dataset.state='';atualizarResumo();});
  }
  atualizarResumo();
})();
