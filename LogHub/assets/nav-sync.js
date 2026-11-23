/* LogHub v1.3: atualização silenciosa, sem avisos, sem recarga ao navegar. */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;
  const self = document.currentScript || [...document.scripts].find(s => /\/assets\/nav-sync\.js/.test(s.src));
  if (!self?.src) return;
  const root = new URL('../', self.src);
  const build = document.querySelector('meta[name="logihub-build"]')?.content || '';
  const isTool = document.body?.dataset.logihubPage === 'tool';
  const stamp = 'loghub:refresh-attempt:v1.3';
  let latest = build, busy = false, lastActivity = Date.now();
  const startedAt = Date.now();

  function keepWorkSafe() {
    if (!isTool) return false;
    return [...document.querySelectorAll('textarea:not([readonly]), input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([readonly]), [contenteditable="true"]')]
      .some(el => el.type === 'file' ? el.files?.length > 0 : !!(el.value || el.textContent || '').trim());
  }

  function updateLinks() {
    if (!latest) return;
    for (const a of document.querySelectorAll('a[href]')) {
      if (a.hasAttribute('download') || a.target === '_blank') continue;
      const u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin || !u.pathname.startsWith(root.pathname)) continue;
      // Uma navegação normal já carrega o HTML novo, sem loops de reload.
      u.searchParams.set('_lh', latest);
      a.href = u.href;
    }
  }

  function attemptSilentRefresh() {
    if (!latest || latest === build || document.hidden || keepWorkSafe()) return;
    // Não interromper o clique do usuário nem um formulário ainda aberto.
    if (Date.now() - lastActivity < 45000 || Date.now() - startedAt < 45000) return;
    if (new URL(location.href).searchParams.get('_lh') === latest) return;
    try {
      if (sessionStorage.getItem(stamp) === latest) return;
      sessionStorage.setItem(stamp, latest);
    } catch (_) { /* O parâmetro da URL também previne repetição. */ }
    const url = new URL(location.href);
    url.searchParams.set('_lh', latest);
    location.replace(url.href);
  }

  async function check() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      const u = new URL('version.json', root);
      u.searchParams.set('_', Date.now());
      const r = await fetch(u.href, { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      if (!data || typeof data.build !== 'string' || !data.build) return;
      latest = data.build;
      updateLinks();
      attemptSilentRefresh();
    } catch (_) {
      // Falha na conexão não impede navegação e jamais abre alertas.
    } finally { busy = false; }
  }

  for (const type of ['keydown', 'pointerdown', 'input', 'change', 'paste', 'drop']) {
    document.addEventListener(type, () => { lastActivity = Date.now(); }, {passive: true, capture: true});
  }
  updateLinks();
  setTimeout(check, 800);
  setInterval(check, 180000);
  setInterval(attemptSilentRefresh, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
})();