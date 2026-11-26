/* LogHub / Central de Ajustes 102 v1.9
   Leitura local de tabelas copiadas do Excel ou Outlook. Nada e enviado para servidores. */
(() => {
  'use strict';
  const field = document.getElementById('aj-paste-input');
  const result = document.getElementById('aj-paste-result');
  const button = document.getElementById('aj-paste-process');
  const pasteButton = document.getElementById('aj-paste-clipboard');
  const clearButton = document.getElementById('aj-paste-clear');
  const modeSelect = document.getElementById('aj-paste-mode');
  const overview = document.getElementById('aj-paste-overview');
  if (!field || !result || !button) return;

  const titles = ['RG Caixa/Palete', 'UdC', 'Produto', 'Lote', 'Motivo', 'Qtd. atual INV / WMS', 'Qtd. atual estoque', 'Ação'];
  const important = ['rg', 'produto', 'lote', 'motivo', 'acao'];
  const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’'“”]/g,' ').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase().replace(/\s+/g,' ');
  const cleanCell = value => String(value ?? '').replace(/\u00a0/g,' ').replace(/\r?\n/g,' ').trim();
  const has = (value, expression) => expression.test(value);

  function classify(label) {
    const s = norm(label);
    if (!s) return '';
    if ((has(s,/\brg\b|\brgs\b|^rg/) && has(s,/caixa|palet|pallet/)) ||
        has(s,/^rg caixa$|^rg palet|^rg pallet|^identificador caixa/)) return 'rg';
    if (/^u\s*d\s*c$|^udc$|^codigo udc$/.test(s)) return 'udc';
    if (/^produto$|^cod produto$|^codigo produto$|^item$/.test(s)) return 'produto';
    if (/^lote$|^numero lote$|^nr lote$/.test(s)) return 'lote';
    if (/^motivo$|^justificativa$|^ocorrencia$|^tipo de erro$/.test(s)) return 'motivo';
    if ((has(s,/quant|qtd|qtde|saldo|estoque/) && has(s,/\binv\b|wms|inventario|sistema/)) || /^(inv|wms)$/.test(s)) return 'wms';
    if ((has(s,/quant|qtd|qtde|saldo/) && has(s,/estoque/)) || /^estoque$/.test(s)) return 'estoque';
    if (/^acao$|^acao solicitada$|^ajuste solicitado$|^providencia$|^procedimento$|^o que fazer$/.test(s)) return 'acao';
    return '';
  }
  function pickHeader(matrix) {
    let best = null;
    for (let i = 0; i < Math.min(matrix.length, 24); i++) {
      const row = matrix[i];
      const indices = {};
      row.forEach((cell,j) => { const label=classify(cell); if(label && !(label in indices)) indices[label]=j; });
      const score = Object.keys(indices).length;
      if (score >= 5 && important.every(k=>k in indices)) return {i, indices, score, exact:true};
      if (score >= 5 && (!best || score > best.score)) best={i,indices,score,exact:false};
    }
    return best;
  }
  function delimiterFor(text) {
    const head = text.replace(/^\uFEFF/,'').split(/\r?\n/).find(s=>s.trim())||'';
    if (head.includes('\t')) return '\t';
    if ((head.match(/;/g)||[]).length >= 5) return ';';
    if ((head.match(/,/g)||[]).length >= 5) return ',';
    return '\t';
  }
  function parseDelimited(text) {
    const delimiter=delimiterFor(text), rows=[];let row=[],cell='',quoted=false;
    const t=text.replace(/^\uFEFF/,'');
    for(let i=0;i<t.length;i++) {
      const c=t[i];
      if(c==='"') {
        if(quoted && t[i+1]==='"') {cell+='"';i++} else quoted=!quoted;
      } else if(c===delimiter && !quoted) {row.push(cell);cell='';}
      else if((c==='\r'||c==='\n') && !quoted) {
        if(c==='\r'&&t[i+1]==='\n')i++;
        row.push(cell);if(row.some(c=>cleanCell(c)))rows.push(row.map(cleanCell));row=[];cell='';
      } else cell+=c;
    }
    row.push(cell);if(row.some(c=>cleanCell(c)))rows.push(row.map(cleanCell));
    return rows;
  }
  function parseHTML(html) {
    if(!html || !/<table\b/i.test(html))return null;
    const doc=new DOMParser().parseFromString(html,'text/html');
    let preferred=null;
    for (const table of doc.querySelectorAll('table')) {
      const matrix=[];
      for(const tr of table.querySelectorAll('tr')) {
        if(tr.closest('table')!==table)continue;
        const row=[];
        for(const cell of tr.children) {
          if(!/^(TD|TH)$/.test(cell.tagName))continue;
          const value=cleanCell(cell.innerText||cell.textContent);
          const span=Math.min(30,Math.max(1,parseInt(cell.getAttribute('colspan'),10)||1));
          row.push(value);for(let n=1;n<span;n++)row.push('');
        }
        if(row.some(Boolean))matrix.push(row);
      }
      const header=pickHeader(matrix);
      if(header && (!preferred || header.score>preferred.header.score))preferred={matrix,header};
    }
    return preferred;
  }
  function inspect(matrix, knownHeader) {
    const header=knownHeader||pickHeader(matrix);
    let positions, from, assumed=false;
    if(header && important.every(k=>k in header.indices)) {positions=header.indices;from=header.i+1;}
    else if(!header && matrix.some(r=>r.length>=8)) {
      // A tabela original tem oito colunas fixas. Sem cabecalho, use somente
      // linhas com pelo menos oito colunas e RG legivel, sem inventar campos.
      positions={rg:0,udc:1,produto:2,lote:3,motivo:4,wms:5,estoque:6,acao:7};
      from=0;assumed=true;
    } else throw new Error('Não encontrei as colunas da tabela. Copie o cabeçalho junto com as linhas, desde RG Caixa/Palete até Ação.');
    const records=[],warnings=[];let ignored=0;
    for(let i=from;i<matrix.length;i++) {
      const cells=matrix[i];
      if(!cells?.some(c=>cleanCell(c)))continue;
      const get=k=>positions[k]===undefined?'':cleanCell(cells[positions[k]]);
      const rg=get('rg'),udc=get('udc'),motivo=get('motivo'),acao=get('acao');
      if(!rg || (classify(rg)==='rg' && !udc)) {ignored++;continue;}
      if(assumed && cells.length<8){ignored++;continue;}
      if(/^\s*[0-9]+(?:[.,][0-9]+)?e[+-]?\d+\s*$/i.test(rg))warnings.push(`Linha ${i+1}: RG em notação científica; os dígitos originais podem já ter sido perdidos na origem.`);
      if(/^[0-9]{1,15}[.,][0-9]{6,}$/i.test(rg))warnings.push(`Linha ${i+1}: confira o RG, pois pode ter sido formatado como número.`);
      if(!acao || !motivo)warnings.push(`Linha ${i+1}: falta ${!motivo?'o motivo':''}${!motivo&&!acao?' e ':''}${!acao?'a ação':''}.`);
      records.push({rg,udc,produto:get('produto'),lote:get('lote'),motivo,
        wms:get('wms')||'—',estoque:get('estoque')||'—',acao,sourceLine:i+1});
    }
    if(!records.length)throw new Error('Nenhum registro válido encontrado. Verifique se copiou as linhas da tabela, incluindo os RGs.');
    if(assumed)warnings.unshift('Cabeçalho não identificado. Usei a ordem padrão de oito colunas; confira a pré-visualização.');
    if(ignored)warnings.push(`${ignored} linha(s) sem RG ou fora do formato foram ignoradas.`);
    return {records,warnings,ignored,headerFound:!assumed};
  }
  function summarize(items) {
    const counts={udc:0,rg:0,apagar:0,excluir:0,outras:0};
    for(const r of items){
      r.udc?counts.udc++:counts.rg++;
      const action=norm(r.acao);
      if(action.includes('apagar udc')||action.includes('excluir udc'))counts.apagar++;
      else if(action.includes('excluid')||action.includes('excluido')||action.includes('excluir rg'))counts.excluir++;
      else counts.outras++;
    }
    return counts;
  }
  function showMessage(text,error=false) {
    result.textContent=text;
    result.classList.toggle('is-error',error);
    result.classList.toggle('is-success',!error);
  }
  function displayOverview(items,warnings) {
    const n=summarize(items);
    overview.hidden=false;
    overview.replaceChildren();
    const card=(number,label,style='')=>{
      const div=document.createElement('div');div.className='aj-paste-mini '+style;
      const strong=document.createElement('strong');strong.textContent=number;
      const span=document.createElement('span');span.textContent=label;div.append(strong,span);overview.append(div);
    };
    card(items.length,'casos identificados');card(n.udc,'com UdC','mint');card(n.rg,'sem UdC','blue');
    card(n.apagar,'ações de apagar UdC');card(n.excluir,'ações de excluir RG');
    if(warnings.length){
      const warn=document.createElement('p');warn.className='aj-paste-warn';warn.textContent=warnings.slice(0,4).join(' • ')+(warnings.length>4?` • +${warnings.length-4} avisos`: '');overview.append(warn);
    }
  }
  function importMatrix(matrix,header) {
    const parsed=inspect(matrix,header);
    const mode=modeSelect?.value==='append'?'append':'replace';
    if(mode==='append' && window.__ajustes102HasManual && !confirm('Adicionar a nova tabela aos registros atuais? Isso pode criar linhas duplicadas.'))return;
    window.dispatchEvent(new CustomEvent('ajustes102:import',{detail:{records:parsed.records,mode}}));
    displayOverview(parsed.records,parsed.warnings);
    showMessage(`${parsed.records.length} solicitação(ões) organizada(s). Consulte as abas e clique em um caso para copiar os dados.`);
  }
  function importText(text,html='') {
    const table=parseHTML(html);
    if(table) return importMatrix(table.matrix,table.header);
    return importMatrix(parseDelimited(text));
  }
  function run() {
    const text=field.value.trim();
    if(!text){showMessage('Cole primeiro a tabela copiada do Excel ou do e-mail.',true);return;}
    try{importText(text)}catch(e){showMessage(e.message||'Não foi possível identificar os dados.',true)}
  }
  field.addEventListener('paste',event=>{
    const clip=event.clipboardData;
    if(!clip)return;
    const plain=clip.getData('text/plain')||'';
    const html=clip.getData('text/html')||'';
    if(!plain&&!html)return;
    event.preventDefault();
    const parsedHTML=parseHTML(html);
    if(parsedHTML){field.value=parsedHTML.matrix.map(row=>row.join('\t')).join('\n');}
    else field.value=plain;
    try {
      if(parsedHTML)importMatrix(parsedHTML.matrix,parsedHTML.header);
      else importText(plain);
    }catch(e){showMessage(e.message||'Não foi possível ler a tabela.',true)}
  });
  button.addEventListener('click',run);
  clearButton.addEventListener('click',()=>{field.value='';result.textContent='';result.className='aj-paste-result';overview.hidden=true;overview.replaceChildren();field.focus();});
  pasteButton.addEventListener('click',async()=>{
    try {
      let html='',plain='';
      if(navigator.clipboard?.read){
        const items=await navigator.clipboard.read();
        for(const item of items){
          if(item.types.includes('text/html'))html=await (await item.getType('text/html')).text();
          if(item.types.includes('text/plain'))plain=await (await item.getType('text/plain')).text();
          if(html||plain)break;
        }
      } else if(navigator.clipboard?.readText)plain=await navigator.clipboard.readText();
      else throw Error('Clipboard não suportado');
      const table=parseHTML(html);
      field.value=table?table.matrix.map(x=>x.join('\t')).join('\n'):plain;
      if(table)importMatrix(table.matrix,table.header);else importText(plain);
    }catch(e){showMessage('O navegador não liberou a área de transferência. Clique no campo e pressione Ctrl+V.',true);field.focus();}
  });
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
    window.__ajustesPasteTest={parseDelimited,parseHTML,inspect,importText,normalize:norm};
  }
})();