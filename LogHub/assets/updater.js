
(function(){
'use strict';
if(!/^https?:$/.test(location.protocol))return;
const marker=document.querySelector('meta[name="logihub-build"]'),build=marker?.content;
if(!build)return;
const script=[...document.scripts].find(s=>/\/assets\/updater\.js(?:\?.*)?$/.test(s.src));
const root=script?new URL('../',script.src):new URL('./',location.href);
let edited=false,notified=false,firstSha=null;
if(document.body.dataset.logihubPage==='tool') ['input','change','paste','drop'].forEach(t=>document.addEventListener(t,e=>{if(t==='drop'||e.target?.closest?.('input,textarea,select,[contenteditable],.droparea'))edited=true},true));
function reload(ver){const url=new URL(location.href);url.searchParams.set('v',String(ver).slice(0,16));location.replace(url.toString())}
function update(ver){
if(notified)return;notified=true;
if(!edited){try{if(sessionStorage.getItem('loghub-last-reload')!==ver){sessionStorage.setItem('loghub-last-reload',ver);reload(ver);return}}catch(e){}}
const bar=document.createElement('div');bar.setAttribute('role','status');bar.style.cssText='position:sticky;top:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:12px 18px;background:#173350;border-bottom:1px solid #467ca7;color:#eaf5ff;font:600 13px system-ui,sans-serif';
const msg=document.createElement('span');msg.textContent=edited?'Nova versão disponível! Salve ou copie os dados antes de atualizar.':'Nova versão disponível!';
const btn=document.createElement('button');btn.type='button';btn.textContent='Atualizar agora';btn.style.cssText='background:#a7ddff;color:#09203b;border:0;padding:8px 13px;border-radius:7px;cursor:pointer;font-weight:700';btn.onclick=()=>reload(ver);
bar.append(msg,btn);document.body.prepend(bar)}
async function check(){
try{const u=new URL('version.json',root);u.searchParams.set('t',Date.now());const r=await fetch(u,{cache:'no-store'});if(r.ok){const v=await r.json();if(v.build&&v.build!==build){update(v.build);return}}}catch(e){}
try{const u=new URL('https://api.github.com/repos/Adrianhenrrique/Adrianhenrrique.github.io/commits');u.searchParams.set('path','LogHub');u.searchParams.set('per_page','1');const r=await fetch(u,{cache:'no-store'});if(!r.ok)return;const data=await r.json(),sha=data?.[0]?.sha;if(!sha)return;if(firstSha&&sha!==firstSha)update(sha);firstSha??=sha}catch(e){}
}
setTimeout(check,1400);setInterval(check,180000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
})();
