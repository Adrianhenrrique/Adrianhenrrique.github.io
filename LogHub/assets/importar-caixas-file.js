/* Importar Caixas - leitura local de Excel/CSV; validações e exportação existentes não são alteradas. */
(() => {
"use strict";
    function xmlDoc(str){
      const xml=new DOMParser().parseFromString(str,'application/xml');
      if(xml.getElementsByTagName('parsererror').length)throw new Error('O Excel contém XML inválido.');
      return xml;
    }
    function tags(node,name){return Array.from(node.getElementsByTagNameNS('*',name));}
    function joinedText(node){return tags(node,'t').map(n=>n.textContent||'').join('');}
    function pathFrom(base,target){
      const parts=(target.startsWith('/')?[]:base.split('/').slice(0,-1)).concat(target.replace(/^\//,'').split('/'));
      const out=[];for(const part of parts){if(part==='..')out.pop();else if(part&&part!=='.')out.push(part);}
      return out.join('/');
    }
    function colIndex(ref){let n=0;for(const ch of (ref.match(/^[A-Za-z]+/)||[''])[0].toUpperCase())n=n*26+ch.charCodeAt(0)-64;return n-1;}
    function excelDate(number,hasTime=false,date1904=false){
      const value=Number(number),millis=Date.UTC(1899,11,30)+((date1904?1462:0)+value)*86400000;
      if(!Number.isFinite(value))return String(number);
      const d=new Date(millis),pad=n=>String(n).padStart(2,'0');
      const date=`${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`;
      return hasTime?`${date} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`:date;
    }
    function isDateFormat(formatId,custom){
      if([14,15,16,17,18,19,20,21,22,45,46,47].includes(formatId))return true;
      if(!custom)return false;
      const fmt=custom.replace(/"[^"]*"|\\.|\[[^\]]*\]/g,'').toLowerCase();
      return /[dmyhs]/.test(fmt);
    }
    function dateHasTime(formatId,custom){
      if([18,19,20,21,22,45,46,47].includes(formatId))return true;
      const fmt=(custom||'').replace(/"[^"]*"|\\.|\[[^\]]*\]/g,'').toLowerCase();
      return /[hs]/.test(fmt);
    }
    function cellString(node,strings,styles,date1904){
      const type=node.getAttribute('t')||'';
      const value=tags(node,'v')[0]?.textContent||'';
      if(type==='inlineStr')return joinedText(tags(node,'is')[0]||node);
      if(type==='s')return strings[Number(value)]??'';
      if(type==='b')return value==='1'?'VERDADEIRO':'FALSO';
      if(type==='e')return value;
      if(type==='str')return value;
      if(!value)return joinedText(node);
      const style=styles[Number(node.getAttribute('s')||0)]||{id:0,fmt:''};
      if(isDateFormat(style.id,style.fmt))return excelDate(value,dateHasTime(style.id,style.fmt),date1904);
      // Respect an Excel format such as 000000000000000001 for codes with leading zeros.
      const section=style.fmt?.split(';')[0]?.replace(/"[^"]*"|\\./g,'')||'';
      if(/^0{2,}$/.test(section)&&/^\d+$/.test(value))return value.padStart(section.length,'0');
      return value; // Do not use Number() on identifiers like 000000000000000001
    }
    async function openZipExcel(file){
      const zip=await JSZip.loadAsync(await file.arrayBuffer());
      const get=async name=>zip.file(name)?.async('string');
      const wbText=await get('xl/workbook.xml');
      if(!wbText)throw new Error('Arquivo Excel inválido: xl/workbook.xml não encontrado.');
      const workbook=xmlDoc(wbText),relsText=await get('xl/_rels/workbook.xml.rels');
      const relationships=new Map();
      if(relsText)tags(xmlDoc(relsText),'Relationship').forEach(r=>relationships.set(r.getAttribute('Id'),pathFrom('xl/workbook.xml',r.getAttribute('Target')||'')));
      let strings=[];
      const sharedText=await get('xl/sharedStrings.xml');
      if(sharedText)strings=tags(xmlDoc(sharedText),'si').map(si=>joinedText(si));
      const custom=new Map();let styles=[];
      const styleText=await get('xl/styles.xml');
      if(styleText){
        const styleDoc=xmlDoc(styleText);
        tags(styleDoc,'numFmt').forEach(node=>custom.set(Number(node.getAttribute('numFmtId')),node.getAttribute('formatCode')||''));
        const cellXfs=tags(styleDoc,'cellXfs')[0];
        styles=cellXfs?tags(cellXfs,'xf').map(n=>({id:Number(n.getAttribute('numFmtId')||0),fmt:custom.get(Number(n.getAttribute('numFmtId')))||''})):[];
      }
      const date1904=tags(workbook,'workbookPr')[0]?.getAttribute('date1904')==='1';
      const sheets=tags(workbook,'sheet').map((sheet,i)=>({
        name:sheet.getAttribute('name')||`Aba ${i+1}`,
        path:relationships.get(sheet.getAttribute('r:id'))||`xl/worksheets/sheet${i+1}.xml`,
        matrix:null
      }));
      if(!sheets.length)throw new Error('Nenhuma aba encontrada no arquivo Excel.');
      async function matrixFor(sheet){
        if(sheet.matrix)return sheet.matrix;
        const sheetText=await get(sheet.path);
        if(!sheetText)throw new Error('Não foi possível abrir a aba '+sheet.name+'.');
        const sheetXml=xmlDoc(sheetText),result=[];
        for(const row of tags(sheetXml,'row')){
          const cells=tags(row,'c');if(!cells.length)continue;
          const rowData=[];let currentCol=0;
          for(const cell of cells){
            const col=cell.getAttribute('r')?colIndex(cell.getAttribute('r')):currentCol;
            if(col<0||col>300)continue;
            rowData[col]=cellString(cell,strings,styles,date1904);
            currentCol=col+1;
          }
          result.push(rowData);
        }
        sheet.matrix=result;return result;
      }
      return {fileName:file.name,sheets,matrixFor};
    }
    function matrixAsTsv(matrix){
      // Always keep values as strings, including leading zeros and 18-digit RGs.
      const lines=[];
      for(const row of matrix){
        if(!row.some(v=>String(v??'').trim()))continue;
        const cells=row.map(v=>String(v??'').replace(/[\r\n]+/g,' ').replace(/\t/g,' '));
        lines.push(cells.map(v=>/"/.test(v)?'"'+v.replace(/"/g,'""')+'"':v).join('\t'));
      }
      return lines.join('\n');
    }

    function oldExcelWorkbook(bytes,fileName){
      // OLE Compound File / BIFF8 (.xls, Excel 97–2003). Offline and read-only.
      const b=new Uint8Array(bytes),dv=new DataView(bytes);
      const u16=(off)=>dv.getUint16(off,true),u32=(off)=>dv.getUint32(off,true);
      if(b.length<512||u16(28)!==0xfffe)throw new Error('Este .xls usa um contêiner OLE inválido.');
      const secSize=2**u16(30),miniSize=2**u16(32),cutoff=u32(56),end=0xfffffffe,free=0xffffffff;
      if(![512,4096].includes(secSize)||miniSize!==64)throw new Error('Formato .xls antigo incompatível. Salve como .xlsx.');
      const sector=sid=>{
        const start=512+sid*secSize;
        if(!Number.isFinite(sid)||sid<0||sid>=(b.length-512)/secSize)throw new Error('Setor inválido no arquivo .xls.');
        return b.subarray(start,start+secSize);
      };
      const difat=[];for(let i=0;i<109;i++){const v=u32(76+4*i);if(v!==free)difat.push(v);}
      let difatSid=u32(68),numDifat=u32(72);
      for(let i=0;i<Math.min(numDifat,1000)&&difatSid<0xfffffffa;i++){
        const sec=sector(difatSid),v=new DataView(sec.buffer,sec.byteOffset,sec.byteLength);
        for(let j=0;j<secSize/4-1;j++){const x=v.getUint32(j*4,true);if(x!==free)difat.push(x);}
        difatSid=v.getUint32(secSize-4,true);
      }
      const fat=[];for(const sid of difat.slice(0,10000)){
        const sec=sector(sid),v=new DataView(sec.buffer,sec.byteOffset,sec.byteLength);
        for(let i=0;i<secSize/4;i++)fat.push(v.getUint32(i*4,true));
      }
      const chain=(sid,table,limit)=>{
        const result=[],seen=new Set();let current=sid;
        while(current<0xfffffffa && result.length<limit){
          if(seen.has(current)||current>=table.length)throw new Error('Cadeia de dados .xls corrompida.');
          result.push(current);seen.add(current);current=table[current];
        }
        return result;
      };
      const regularStream=(sid,size)=>{
        if(size===0)return new Uint8Array(0);
        const list=chain(sid,fat,Math.ceil(size/secSize)+2),out=new Uint8Array(list.length*secSize);
        for(let i=0;i<list.length;i++)out.set(sector(list[i]),i*secSize);
        return out.subarray(0,size);
      };
      const dirBytes=regularStream(u32(48),Math.min(b.length,2*1024*1024));
      const utf16=new TextDecoder('utf-16le'),latin=new TextDecoder('windows-1252');
      const entries=[];
      for(let i=0;i+128<=dirBytes.length;i+=128){
        const d=new DataView(dirBytes.buffer,dirBytes.byteOffset+i,128);
        const chars=Math.min(d.getUint16(64,true),64);
        const name=chars>=2?utf16.decode(dirBytes.subarray(i,i+chars-2)):'';
        const type=d.getUint8(66);if(!type)continue;
        const size=d.getUint32(120,true);
        entries.push({name,type,sid:d.getUint32(116,true),size});
      }
      const root=entries.find(e=>e.type===5),wb=entries.find(e=>e.type===2&&/^(workbook|book)$/i.test(e.name));
      if(!root||!wb)throw new Error('Arquivo .xls sem planilha Workbook/Book.');
      const miniFatBytes=regularStream(u32(60),u32(64)*secSize);
      const miniView=new DataView(miniFatBytes.buffer,miniFatBytes.byteOffset,miniFatBytes.byteLength);
      const miniFat=[];for(let i=0;i+4<=miniFatBytes.length;i+=4)miniFat.push(miniView.getUint32(i,true));
      let book;
      if(wb.size<cutoff){
        const rootData=regularStream(root.sid,root.size),parts=chain(wb.sid,miniFat,Math.ceil(wb.size/miniSize)+2);
        book=new Uint8Array(wb.size);
        for(let i=0;i<parts.length;i++)book.set(rootData.subarray(parts[i]*miniSize,parts[i]*miniSize+Math.min(miniSize,book.length-i*miniSize)),i*miniSize);
      }else book=regularStream(wb.sid,wb.size);
      const view=new DataView(book.buffer,book.byteOffset,book.byteLength),rec=[];
      for(let at=0;at+4<=book.length;){
        const id=view.getUint16(at,true),len=view.getUint16(at+2,true);
        if(at+4+len>book.length)break;
        rec.push({id,at,data:book.subarray(at+4,at+4+len)});at+=4+len;
      }
      const formats=new Map(),xf=[],bounds=[];
      let sst=[];
      const rd16=(buf,off)=>new DataView(buf.buffer,buf.byteOffset,buf.byteLength).getUint16(off,true);
      const rd32=(buf,off)=>new DataView(buf.buffer,buf.byteOffset,buf.byteLength).getUint32(off,true);
      function biffStr(data,at,short=false){
        const n=short?data[at]:rd16(data,at),flags=data[at+(short?1:2)]||0;
        let start=at+(short?2:3),rich=0,ext=0;
        if(flags&8){rich=rd16(data,start);start+=2;}
        if(flags&4){ext=rd32(data,start);start+=4;}
        const len=n*(flags&1?2:1);
        const result=(flags&1?utf16:latin).decode(data.subarray(start,start+len));
        return {text:result,after:start+len+rich*4+ext};
      }
      function readSST(parts){
        if(!parts.length)return [];
        let pi=0,pos=0;
        const remaining=()=>parts[pi].length-pos;
        function read(n){
          const out=new Uint8Array(n);let p=0;
          while(p<n){
            if(pi>=parts.length)throw new Error('Texto compartilhado .xls incompleto.');
            if(remaining()===0){pi++;pos=0;continue;}
            const count=Math.min(n-p,remaining());out.set(parts[pi].subarray(pos,pos+count),p);pos+=count;p+=count;
          }
          return out;
        }
        const num=(n)=>{const a=read(n);return n===1?a[0]:n===2?(a[0]|a[1]<<8):(a[0]+a[1]*256+a[2]*65536+a[3]*16777216);};
        const total=num(4),unique=num(4),out=[];
        for(let i=0;i<unique&&i<250000;i++){
          const len=num(2),opts=num(1);
          const rich=opts&8?num(2):0,ext=opts&4?num(4):0;
          let unicode=!!(opts&1),text='',left=len;
          while(left>0){
            if(pi>=parts.length)throw new Error('SST incompleta.');
            if(remaining()===0){pi++;pos=0;unicode=!!num(1);continue;}
            const size=unicode?2:1,n=Math.min(left,Math.floor(remaining()/size));
            if(n===0){pi++;pos=0;unicode=!!num(1);continue;}
            const data=read(n*size);text+=(unicode?utf16:latin).decode(data);left-=n;
          }
          if(rich)read(rich*4);if(ext)read(ext);
          out.push(text);
        }
        return out;
      }
      for(let i=0;i<rec.length;i++){
        const r=rec[i],d=r.data;if(!d.length)continue;
        if(r.id===0x0085&&d.length>=8){
          const name=biffStr(d,6,true).text;
          if(d[5]===0)bounds.push({name,offset:rd32(d,0)});
        }else if(r.id===0x041e&&d.length>=5){const id=rd16(d,0);formats.set(id,biffStr(d,2).text);}
        else if(r.id===0x00e0&&d.length>=4)xf.push({id:rd16(d,2),fmt:formats.get(rd16(d,2))||''});
        else if(r.id===0x00fc){const parts=[d];let j=i+1;while(j<rec.length&&rec[j].id===0x003c){parts.push(rec[j].data);j++;}sst=readSST(parts);i=j-1;}
      }
      if(!bounds.length)throw new Error('Nenhuma aba encontrada no Excel .xls.');
      function rk(n){
        let value;
        if(n&2)value=n>>2;
        else {const v=new DataView(new ArrayBuffer(8));v.setUint32(4,n&0xfffffffc,true);value=v.getFloat64(0,true);}
        return (n&1)?value/100:value;
      }
      function cellValue(value,style){
        const s=String(value??''),format=xf[style]||{id:0,fmt:''};
        if(isDateFormat(format.id,format.fmt))return excelDate(s,dateHasTime(format.id,format.fmt));
        const digits=format.fmt?.split(';')[0]?.replace(/"[^"]*"|\\./g,'')||'';
        if(/^0{2,}$/.test(digits)&&/^\d+$/.test(s))return s.padStart(digits.length,'0');
        return s;
      }
      const sheets=bounds.map(bound=>{
        const matrix=[];
        function put(row,col,value){if(row>100000||col>300)return;(matrix[row]??=[])[col]=String(value??'');}
        for(let i=0;i<rec.length;i++){
          const r=rec[i];if(r.at<bound.offset)continue;
          if(r.at!==bound.offset&&r.id===0x0809)break;
          const d=r.data,id=r.id;if(d.length<6)continue;
          const row=rd16(d,0),col=rd16(d,2),style=rd16(d,4);
          if(id===0x00fd&&d.length>=10)put(row,col,sst[rd32(d,6)]||'');
          else if(id===0x0203&&d.length>=14)put(row,col,cellValue(new DataView(d.buffer,d.byteOffset,d.byteLength).getFloat64(6,true),style));
          else if(id===0x027e&&d.length>=10)put(row,col,cellValue(rk(rd32(d,6)),style));
          else if(id===0x00bd&&d.length>=12){
            const first=rd16(d,2),last=rd16(d,d.length-2);
            for(let c=first;c<=last;c++){
              const off=4+(c-first)*6;
              if(off+6>d.length-2)break;
              put(row,c,cellValue(rk(rd32(d,off+2)),rd16(d,off)));
            }
          }else if(id===0x0204&&d.length>=9)put(row,col,biffStr(d,6).text);
          else if(id===0x0205&&d.length>=8)put(row,col,d[7]?'':(d[6]?'VERDADEIRO':'FALSO'));
          else if(id===0x0006&&d.length>=14){
            if(rd16(d,12)!==0xffff)put(row,col,cellValue(new DataView(d.buffer,d.byteOffset,d.byteLength).getFloat64(6,true),style));
          }
        }
        return {name:bound.name,matrix};
      });
      return {fileName,sheets,matrixFor:async s=>s.matrix};
    }


    function parseXmlExcel(text,fileName){
      let matrix=[];
      if(/<Workbook\b/i.test(text) && /<Worksheet\b/i.test(text)){
        const x=xmlDoc(text),worksheets=tags(x,'Worksheet');
        const sheets=worksheets.map((ws,i)=>({name:ws.getAttribute('ss:Name')||ws.getAttribute('Name')||`Aba ${i+1}`,matrix:null,xml:ws}));
        for(const sheet of sheets){
          const result=[];
          for(const r of tags(sheet.xml,'Row')){
            const data=[];let idx=0;
            for(const c of tags(r,'Cell')){
              const attr=c.getAttribute('ss:Index')||c.getAttribute('Index');
              if(attr)idx=Number(attr)-1;
              const cell=tags(c,'Data')[0];data[idx++]=cell?.textContent||'';
            }
            if(data.length)result.push(data);
          }
          sheet.matrix=result;
        }
        matrix=sheets;return {fileName,sheets,matrixFor:async sheet=>sheet.matrix};
      }
      if(/<table\b/i.test(text)){
        const doc=new DOMParser().parseFromString(text,'text/html');
        const tables=[...doc.querySelectorAll('table')];
        const sheets=tables.map((t,i)=>({name:'Tabela '+(i+1),matrix:[...t.querySelectorAll('tr')].map(tr=>[...tr.querySelectorAll('th,td')].map(td=>td.textContent.trim()))}));
        if(sheets.length)return {fileName,sheets,matrixFor:async sheet=>sheet.matrix};
      }
      throw new Error('Este .xls usa um formato antigo que não foi possível ler. Salve como .xlsx no Excel e importe novamente.');
    }


const fileInput=document.getElementById("entradaArquivo");
const openBtn=document.getElementById("abrirArquivo");
const dropzone=document.getElementById("arquivoArea");
const fileStatus=document.getElementById("arquivoStatus");
const field=document.getElementById("entrada");
if(!fileInput||!openBtn||!field)return;
function normalize(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[.\s_/-]+/g," ").trim()}
const columnNames=[
 ["item","produto","codigo","cod"],["lote"],["rg pallet","nr pallet","pallet"],["rg caixa","caixa"],
 ["peso pad","peso padrao"],["peso liq","peso liquido"],["peso bru","peso bruto"],
 ["pes min","peso minimo"],["pes max","peso maximo"]];
const header=["Item","Lote","RG Pallet","RG Caixa","Peso Pad.","Peso Liq.","Peso Bru.","Pes. Min.","Pes. Max."];
function locateHeader(matrix){
 for(let r=0;r<Math.min(matrix.length,35);r++){
  const normalized=(matrix[r]||[]).map(normalize);
  const indices=columnNames.map(names=>normalized.findIndex(v=>names.includes(v)));
  if([0,1,2,3,5,6].every(i=>indices[i]>=0))return {rowIndex:r,indices};
 }
 return null;
}
function extractMatrix(matrix){
 const found=locateHeader(matrix);
 if(!found)throw new Error("Não encontrei as colunas Item, Lote, RG Pallet, RG Caixa, Peso Liq. e Peso Bru. nesta aba.");
 const lines=[header.join("\t")];let count=0;
 for(const row of matrix.slice(found.rowIndex+1)){
  const cells=found.indices.map(i=>i<0?"":String(row?.[i]??"").replace(/[\t\r\n]+/g," ").trim());
  if(!cells.some(Boolean))continue;
  if(cells.every((v,i)=>i!==0||normalize(v)==="item"))continue;
  lines.push(cells.join("\t"));count++;
 }
 if(!count)throw new Error("Nenhuma linha de caixas foi encontrada depois do cabeçalho.");
 return {text:lines.join("\n"),count};
}
function parseDelimited(text){
 const cleaned=text.replace(/^\uFEFF/,"");
 const first=cleaned.split(/\r?\n/).find(l=>l.trim())||"";
 const delimiter=first.includes("\t")?"\t":first.includes(";")?";":",";
 const rows=[],row=[];let cell="",quoted=false;
 for(let i=0;i<cleaned.length;i++){
  const ch=cleaned[i];
  if(ch==='"'){if(quoted&&cleaned[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
  else if(ch===delimiter&&!quoted){row.push(cell);cell=""}
  else if((ch==="\n"||ch==="\r")&&!quoted){
    if(ch==="\r"&&cleaned[i+1]==="\n")i++;
    row.push(cell);if(row.some(v=>v.trim()))rows.push(row.slice());row.length=0;cell="";
  }else cell+=ch;
 }
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 return rows;
}
async function workbookFor(file){
 const ext=file.name.split(".").pop().toLowerCase();
 if(ext==="xlsx"||ext==="xlsm")return openZipExcel(file);
 if(ext==="xls"){
   const bytes=await file.arrayBuffer(),data=new Uint8Array(bytes);
   if(data.length>=8&&data.slice(0,8).every((v,i)=>v===[0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1][i]))
     return oldExcelWorkbook(bytes,file.name);
   return parseXmlExcel(await file.text(),file.name);
 }
 return null;
}
async function importFile(file){
 if(!file)return;
 const ext=file.name.split(".").pop().toLowerCase();
 fileStatus.textContent="Lendo "+file.name+"…";
 fileStatus.dataset.state="reading";
 if(!["xls","xlsx","xlsm","csv","tsv","txt"].includes(ext)){
  fileStatus.textContent="Formato não aceito. Use Excel, CSV ou TSV.";fileStatus.dataset.state="error";return;
 }
 if(file.size>20*1024*1024){
  fileStatus.textContent="Arquivo maior que 20 MB. Exporte uma planilha menor.";fileStatus.dataset.state="error";return;
 }
 try{
  let result,worksheet="";
  if(["xls","xlsx","xlsm"].includes(ext)){
   const book=await workbookFor(file);
   for(const sheet of book.sheets){
    const matrix=await book.matrixFor(sheet);
    if(locateHeader(matrix)){result=extractMatrix(matrix);worksheet=sheet.name;break}
   }
   if(!result)throw new Error("O Excel não contém uma aba com as colunas de Importar Caixas.");
  }else result=extractMatrix(parseDelimited(await file.text()));
  field.value=result.text;
  field.dispatchEvent(new Event("input",{bubbles:true}));
  fileStatus.textContent=result.count+" caixa(s) carregada(s) de "+file.name+(worksheet?" · Aba: "+worksheet:"")+". Confira a pré-visualização e preencha a Filial.";
  fileStatus.dataset.state="success";
  document.getElementById("prev")?.closest("section")?.scrollIntoView({behavior:"smooth",block:"nearest"});
 }catch(err){
  fileStatus.textContent="Não foi possível importar: "+(err?.message||String(err));
  fileStatus.dataset.state="error";
 }finally{fileInput.value=""}
}
openBtn.addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",()=>importFile(fileInput.files?.[0]));
for(const event of ["dragenter","dragover"])dropzone.addEventListener(event,e=>{e.preventDefault();dropzone.classList.add("is-dragover")});
for(const event of ["dragleave","drop"])dropzone.addEventListener(event,e=>{e.preventDefault();dropzone.classList.remove("is-dragover")});
dropzone.addEventListener("drop",e=>importFile(e.dataTransfer?.files?.[0]));
})();
