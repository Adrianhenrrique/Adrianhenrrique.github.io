/* LogHub · Ajustes 102 | interface local para consulta e cópia; não modifica sistemas de estoque. */
(() => {
  'use strict';
  const DEMO = [
    {id:'EX-001',rg:'900000000000001001',udc:'0000001048',produto:'0106',lote:'LT-EX-001',motivo:'Lote invertido',wms:0,estoque:4,acao:'Apagar UdC',reviewed:false,demo:true},
    {id:'EX-002',rg:'900000000000001002',udc:'',produto:'0106',lote:'LT-EX-002',motivo:'Lote invertido',wms:1,estoque:0,acao:'Alterar RG Caixa de DISPON para EXCLUÍDO',reviewed:false,demo:true},
    {id:'EX-003',rg:'900000000000001003',udc:'0000001050',produto:'0119',lote:'LT-EX-003',motivo:'Divergência de estoque',wms:0,estoque:1,acao:'Apagar UdC',reviewed:false,demo:true},
    {id:'EX-004',rg:'900000000000001004',udc:'',produto:'0276',lote:'LT-EX-004',motivo:'Caixa não encontrada',wms:3,estoque:0,acao:'Alterar RG Caixa de DISPON para EXCLUÍDO',reviewed:false,demo:true},
    {id:'EX-005',rg:'900000000000001005',udc:'0000001052',produto:'0156',lote:'LT-EX-005',motivo:'Lote invertido',wms:0,estoque:2,acao:'Verificar UdC e ajustar saldo',reviewed:false,demo:true},
    {id:'EX-006',rg:'900000000000001006',udc:'',produto:'0119',lote:'LT-EX-006',motivo:'Divergência de estoque',wms:2,estoque:0,acao:'Conferir RG Palete',reviewed:false,demo:true},
  ];
  const $ = id => document.getElementById(id);
  const esc = v => String(v??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = v => String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let data = DEMO.map(x=>({...x}));
  let view = 'udc';
  let selectedId = data[0]?.id || null;
  let counter = 1;
  let toastTimer;
  const storage = null; // Sem persistência: comportamento seguro enquanto o layout é avaliado.
  function typeOf(x){return x.udc ? 'udc':'rg';}
  function current(){
    const search = normalize($('aj-search').value), status=$('aj-status').value,reason=$('aj-reason').value;
    return data.filter(x => (view==='all'||typeOf(x)===view) &&
      (status==='all'||(status==='reviewed' ? x.reviewed : !x.reviewed)) &&
      (reason==='all'||x.motivo===reason) &&
      (!search||normalize([x.rg,x.udc,x.produto,x.lote,x.motivo,x.acao,x.id].join(' ')).includes(search)));
  }
  function toast(message,isError=false){const el=$('aj-toast');el.textContent=message;el.classList.toggle('error',isError);el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000)}
  async function copyText(value){
    const s=String(value??'');if(!s.trim()){toast('Não há dados para copiar.',true);return}
    try{
      if(navigator.clipboard?.writeText&&window.isSecureContext)await navigator.clipboard.writeText(s);
      else{const ta=document.createElement('textarea');ta.value=s;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw Error('Clipboard indisponível');}
      toast('Copiado para a área de transferência.');
    }catch(e){toast('Não foi possível copiar automaticamente. Selecione o texto e copie.',true)}
  }
  function summary(x){return [
    'Solicitação de ajuste — Unidade 102',
    'Tipo: '+(typeOf(x)==='udc'?'UdC':'RG Caixa / Palete'),
    'RG Caixa / Palete: '+x.rg,
    'UdC: '+(x.udc||'Não informada'),
    'Produto: '+x.produto,
    'Lote: '+x.lote,
    'Motivo: '+x.motivo,
    'Quantidade atual INV: '+x.wms,
    'Quantidade estoque: '+x.estoque,
    'Ação solicitada: '+x.acao,
    'Conferência: '+(x.reviewed?'Conferido':'Pendente'),
  ].join('\n')}
  function listTSV(items){return [['RG Caixa/Palete','UdC','Produto','Lote','Motivo','Quantidade atual INV','Quantidade estoque','Ação','Conferência'].join('\t'),...items.map(x=>[x.rg,x.udc,x.produto,x.lote,x.motivo,x.wms,x.estoque,x.acao,x.reviewed?'Conferido':'Pendente'].join('\t'))].join('\n')}
  function updateReasons(){
    const select=$('aj-reason'),old=select.value;
    const unique=[...new Set(data.map(x=>x.motivo))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    select.replaceChildren(new Option('Todos os motivos','all'),...unique.map(x=>new Option(x,x)));
    select.value=unique.includes(old)?old:'all';
  }
  function renderCounts(){
    const udc=data.filter(x=>typeOf(x)==='udc').length,rg=data.length-udc;
    $('aj-total').textContent=data.length;
    $('aj-udc-total').textContent=udc;
    $('aj-rg-total').textContent=rg;
    $('aj-reviewed').textContent=data.filter(x=>x.reviewed).length;
    $('aj-tab-all-count').textContent=data.length;
    $('aj-tab-udc-count').textContent=udc;
    $('aj-tab-rg-count').textContent=rg;
  }
  function renderList(items){
    const label={udc:'Ajustes com UdC',rg:'RG Caixa / Palete',all:'Todas as solicitações'}[view];
    $('aj-list-label').textContent=label;
    $('aj-list-sub').textContent=view==='udc'?'Solicitações que possuem código UdC.':view==='rg'?'Solicitações sem UdC informada.':'UdC e RG em uma única lista.';
    $('aj-visible-count').textContent=`${items.length} ${items.length===1?'caso':'casos'}`;
    $('aj-copy-visible').disabled=!items.length;
    $('aj-copy-codes').disabled=!items.length;
    $('aj-copy-codes').textContent=view==='udc'?'Copiar UdCs':view==='rg'?'Copiar RGs':'Copiar todos os RGs';
    const list=$('aj-list');
    if(!items.length){list.innerHTML='<div class="aj-noresults"><strong>Nenhum registro encontrado</strong><span>Tente mudar o filtro ou adicionar uma solicitação.</span></div>';return}
    list.innerHTML=items.map(x=>`<button type="button" class="aj-request ${x.id===selectedId?'is-active':''}" data-select="${esc(x.id)}" aria-pressed="${x.id===selectedId}"><div class="aj-request-top"><span class="aj-request-category ${typeOf(x)}">${typeOf(x)==='udc'?'◈ AJUSTE DE UDC':'▤ RG CAIXA / PALETE'}</span><span class="aj-status-pill ${x.reviewed?'reviewed':''}">${x.reviewed?'✓ Conferido':'● Pendente'}</span></div><div class="aj-request-code">${esc(typeOf(x)==='udc'?x.udc:x.rg)}</div><div class="aj-request-sub">${typeOf(x)==='udc'?'RG '+esc(x.rg):'Produto '+esc(x.produto)+' · Lote '+esc(x.lote)}</div><div class="aj-request-bottom"><span class="aj-request-motive"><i class="dot"></i>${esc(x.motivo)}</span><span class="aj-request-cta">Ver detalhes →</span></div></button>`).join('');
  }
  function renderDetail(x){
    const detail=$('aj-detail');
    if(!x){detail.innerHTML='<div class="aj-detail-empty"><span>◈</span><strong>Selecione uma solicitação</strong><p>Os dados completos aparecerão aqui para consulta e cópia.</p></div>';return}
    const primary=typeOf(x)==='udc'?x.udc:x.rg;
    detail.innerHTML=`<div class="aj-detail-head"><div><span class="aj-caption">DETALHES DO REGISTRO ${esc(x.id)}</span><h3>${typeOf(x)==='udc'?'Ajuste de UdC':'Ajuste de RG Caixa / Palete'}</h3><p>Conferência das informações da solicitação</p></div><span class="aj-status-pill ${x.reviewed?'reviewed':''}">${x.reviewed?'✓ Conferido':'● Pendente'}</span></div>
      <div class="aj-id-section"><span class="aj-id-label">${typeOf(x)==='udc'?'UDC PARA CONSULTAR':'RG CAIXA / PALETE'}</span><div class="aj-id-main"><code>${esc(primary)}</code><button type="button" class="aj-mini-copy" data-copy="primary">Copiar</button></div><p class="aj-id-sub">${typeOf(x)==='udc'?'RG relacionado: '+esc(x.rg):'Código de identificação preservado como texto.'}</p></div>
      <div class="aj-detail-grid"><div class="aj-data-cell"><span>Produto</span><strong>${esc(x.produto)}</strong></div><div class="aj-data-cell"><span>Lote</span><strong>${esc(x.lote)}</strong></div><div class="aj-data-cell"><span>Quantidade atual INV</span><strong>${esc(x.wms)}</strong></div><div class="aj-data-cell"><span>Quantidade atual estoque</span><strong>${esc(x.estoque)}</strong></div><div class="aj-data-cell full warn"><span>Motivo do ajuste</span><strong>${esc(x.motivo)}</strong></div></div>
      <div class="aj-action-box"><span>AÇÃO INFORMADA NA SOLICITAÇÃO</span><strong>${esc(x.acao)}</strong></div>
      <div class="aj-detail-buttons"><button class="aj-primary" type="button" data-copy="full">Copiar solicitação ↗</button><button class="aj-secondary" type="button" data-copy="rg">Copiar RG</button>${x.udc?'<button class="aj-secondary" type="button" data-copy="udc">Copiar UdC</button>':''}<button class="aj-secondary" type="button" data-toggle="review">${x.reviewed?'↺ Voltar a pendente':'✓ Marcar conferido'}</button></div><div class="aj-detail-foot">Somente consulta e organização. Nenhum comando é enviado para sistemas externos.</div>`;
  }
  function render(){
    renderCounts();
    for(const btn of document.querySelectorAll('.aj-tab'))btn.setAttribute('aria-selected',String(btn.dataset.view===view));
    const items=current();
    if(!items.some(x=>x.id===selectedId))selectedId=items[0]?.id||null;
    renderList(items);
    renderDetail(items.find(x=>x.id===selectedId));
  }
  document.querySelector('.aj-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-view]');if(!tab)return;view=tab.dataset.view;render()});
  $('aj-list').addEventListener('click',e=>{const btn=e.target.closest('[data-select]');if(!btn)return;selectedId=btn.dataset.select;render();if(window.innerWidth<=940)$('aj-detail').scrollIntoView({behavior:'smooth',block:'nearest'})});
  $('aj-detail').addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    const x=data.find(v=>v.id===selectedId);if(!x)return;
    if(btn.dataset.copy==='full')copyText(summary(x));
    if(btn.dataset.copy==='rg')copyText(x.rg);
    if(btn.dataset.copy==='udc')copyText(x.udc);
    if(btn.dataset.copy==='primary')copyText(typeOf(x)==='udc'?x.udc:x.rg);
    if(btn.dataset.toggle==='review'){x.reviewed=!x.reviewed;render();toast(x.reviewed?'Registro marcado como conferido.':'Registro voltou para pendente.')}
  });
  for(const id of ['aj-search','aj-status','aj-reason'])$(id).addEventListener(id==='aj-search'?'input':'change',render);
  $('aj-reset').addEventListener('click',()=>{$('aj-search').value='';$('aj-status').value='all';$('aj-reason').value='all';render()});
  $('aj-copy-visible').addEventListener('click',()=>{const rows=current();if(rows.length)copyText(listTSV(rows));else toast('Nenhum registro para copiar.',true)});
  $('aj-copy-codes').addEventListener('click',()=>{const rows=current();if(rows.length)copyText(rows.map(x=>view==='udc'?x.udc:x.rg).join('\n'));else toast('Nenhum código para copiar.',true)});
  $('aj-clear-demo').addEventListener('click',()=>{
    if(data.some(x=>!x.demo)){
      if(!confirm('Limpar todos os registros desta página? A operação não pode ser desfeita.'))return;
      data=[];selectedId=null;view='all';$('aj-search').value='';$('aj-status').value='all';
      updateReasons();render();toast('Lista limpa. Cole outra tabela para continuar.');return;
    }
    const count=data.filter(x=>x.demo).length;
    if(!count){toast('Não há exemplos para remover.');return}
    data=[];selectedId=null;updateReasons();render();toast(count+' exemplos removidos.');
  });
  const modal=$('aj-modal'),form=$('aj-form');
  $('aj-new').addEventListener('click',()=>{form.reset();modal.showModal()});
  $('aj-close').addEventListener('click',()=>modal.close());
  $('aj-cancel').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const fields=new FormData(form);const value=name=>String(fields.get(name)||'').trim();
    const rg=value('rg'),udc=value('udc');
    if(!rg){toast('RG Caixa/Palete é obrigatório.',true);return}
    const record={id:'MAN-'+String(counter++).padStart(3,'0'),rg,udc,produto:value('produto'),lote:value('lote'),motivo:value('motivo'),wms:value('wms')||'0',estoque:value('estoque')||'0',acao:value('acao'),reviewed:false,demo:false};
    data.unshift(record);view=typeOf(record);selectedId=record.id;
    $('aj-search').value='';$('aj-status').value='all';
    updateReasons();$('aj-reason').value='all';render();modal.close();toast('Registro adicionado somente nesta página.');
  });
  // Entrada por colagem: integracao isolada do leitor com os filtros ja existentes.
  window.addEventListener('ajustes102:import',event=>{
    const detail=event.detail||{}, rows=detail.records;
    if(!Array.isArray(rows)||!rows.length)return;
    const imported=rows.map((r,i)=>({
      id:'COL-'+String(Date.now())+'-'+String(i+1),
      rg:String(r.rg||'').trim(),udc:String(r.udc||'').trim(),
      produto:String(r.produto||'').trim(),lote:String(r.lote||'').trim(),
      motivo:String(r.motivo||'').trim(),wms:String(r.wms??'—'),
      estoque:String(r.estoque??'—'),acao:String(r.acao||'').trim(),
      reviewed:false,demo:false
    }));
    data=detail.mode==='append' ? data.filter(x=>!x.demo).concat(imported) : imported;
    view='all';selectedId=imported[0].id;
    $('aj-search').value='';$('aj-status').value='all';
    updateReasons();$('aj-reason').value='all';render();
    $('aj-clear-demo').textContent='Limpar lista';
    const notice=document.querySelector('.aj-notice');
    if(notice){
      const title=notice.querySelector('b'),desc=notice.querySelector('span');
      if(title)title.textContent='Registros importados da tabela';
      if(desc)desc.textContent='Dados organizados somente neste navegador. Clique nas abas UdC e RG para consultar ou copiar. Nenhum ajuste foi executado no WMS.';
    }
    $('aj-work-title')?.scrollIntoView({behavior:'smooth',block:'start'});
    toast(imported.length+' caso(s) organizados. Selecione uma solicitação para consultar.');
  });
  updateReasons();render();
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')window.__ajustesTest={getData:()=>data.map(x=>({...x})),setView:v=>{view=v;render()},visible:()=>current().map(x=>x.id)};
})();