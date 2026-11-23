/* LogHub Auto Update 1.2 — silencioso, sem perda de dados e sem loops. */
(() => {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;

  const build = document.querySelector('meta[name="logihub-build"]')?.content;
  const script = document.currentScript || [...document.scripts].find(s => /\/assets\/updater\.js(?:\?.*)?$/.test(s.src));
  if (!build || !script?.src) return;

  const root = new URL('../', script.src);
  const toolPage = document.body?.dataset.logihubPage === 'tool';
  const storageKey = 'loghub:auto-update:' + location.pathname;
  const ownUpdateParam = '_lh';
  const POLL_MS = 120000;
  const IDLE_MS = 75000;
  const GITHUB_DEPLOY_GRACE_MS = 150000;

  let lastInteraction = 0;
  let didEdit = false;
  let checking = false;
  let pendingRelease = null;
  let initialCommit = null;
  let nextCommit = null;
  let commitFirstSeen = 0;

  // Marque atividades reais, mas não interrompa o trabalho do usuário.
  if (toolPage) {
    for (const event of ['input', 'change', 'paste', 'drop']) {
      document.addEventListener(event, e => {
        if (event === 'drop' || e.target?.closest?.('input,textarea,select,[contenteditable],.droparea')) {
          didEdit = true;
          lastInteraction = Date.now();
        }
      }, true);
    }
  }

  function workInProgress() {
    if (!toolPage) return false;
    // Os campos de entrada são o trabalho; saídas readonly não impedem atualização.
    return [...document.querySelectorAll('textarea:not([readonly]), input[type="file"]')]
      .some(el => el.type === 'file' ? !!el.files?.length : !!el.value.trim());
  }

  function safeToRefresh() {
    return !document.hidden && !workInProgress() &&
      (!toolPage || !didEdit || Date.now() - lastInteraction >= IDLE_MS);
  }

  function alreadyTried(release) {
    // Proteção mesmo em navegadores onde sessionStorage é bloqueado.
    if (new URL(location.href).searchParams.get(ownUpdateParam) === release) return true;
    try { return sessionStorage.getItem(storageKey) === release; }
    catch (_) { return false; }
  }

  function requestRefresh(release) {
    if (!release || alreadyTried(release)) return;
    if (!safeToRefresh()) { pendingRelease = release; return; }

    try { sessionStorage.setItem(storageKey, release); }
    catch (_) { /* O parâmetro da URL também protege contra loops. */ }

    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set(ownUpdateParam, release);
    // Troca a página sem criar outro item no histórico nem mostrar aviso.
    location.replace(nextUrl.href);
  }

  function retryWhenSafe() {
    if (pendingRelease && safeToRefresh()) {
      const release = pendingRelease;
      pendingRelease = null;
      requestRefresh(release);
    }
  }

  async function checkManifest() {
    try {
      const url = new URL('version.json', root);
      url.searchParams.set('_', Date.now());
      const response = await fetch(url.href, {cache: 'no-store'});
      if (!response.ok) return false;
      const manifest = await response.json();
      if (!manifest?.build || manifest.build === build) return false;
      requestRefresh(String(manifest.build));
      return true;
    } catch (_) { return false; }
  }

  async function checkRepository() {
    // O SHA detecta futuros commits no GitHub, mesmo sem edição de version.json.
    try {
      const url = new URL('https://api.github.com/repos/Adrianhenrrique/Adrianhenrrique.github.io/commits');
      url.searchParams.set('path', 'LogHub');
      url.searchParams.set('per_page', '1');
      const response = await fetch(url.href, {cache: 'no-store'});
      if (!response.ok) return;
      const data = await response.json();
      const sha = data?.[0]?.sha;
      if (!sha) return;
      if (!initialCommit) { initialCommit = sha; return; }
      if (sha !== initialCommit) {
        if (nextCommit !== sha) {
          nextCommit = sha;
          commitFirstSeen = Date.now();
        }
        // Um commit pode chegar antes de o GitHub Pages terminar a publicação.
        if (Date.now() - commitFirstSeen >= GITHUB_DEPLOY_GRACE_MS) {
          requestRefresh('commit-' + sha.slice(0, 12));
        }
      }
    } catch (_) { /* API indisponível: version.json continua funcionando. */ }
  }

  async function check() {
    if (checking || document.hidden) return;
    checking = true;
    try {
      const hasNewBuild = await checkManifest();
      if (!hasNewBuild) await checkRepository();
    } finally {
      checking = false;
      retryWhenSafe();
    }
  }

  setTimeout(check, 2000);
  setInterval(check, POLL_MS);
  setInterval(retryWhenSafe, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { retryWhenSafe(); check(); }
  });
})();
