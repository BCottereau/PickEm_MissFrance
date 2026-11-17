'use strict';
/* Écriture dans le dépôt via l'API GitHub, réservée à l'organisateur.
   Le jeton reste dans le navigateur de l'organisateur (localStorage) ; sans lui, le site est en lecture seule. */
window.GH = (() => {
  const REPO = { owner: 'BCottereau', repo: 'PickEm_MissFrance', branch: 'main' };
  const KEY = 'mf27.ghToken';
  const API = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`;
  let token = null;
  try { token = localStorage.getItem(KEY); } catch { /* stockage indisponible */ }

  const headers = (t = token, json) => ({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${t}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(json ? { 'Content-Type': 'application/json' } : {})
  });
  const encPath = p => p.split('/').map(encodeURIComponent).join('/');

  async function fail(r) {
    const j = await r.json().catch(() => ({}));
    const msg = {
      401: 'Jeton refusé par GitHub (expiré ou révoqué)',
      403: 'Ce jeton n’a pas le droit d’écrire (permission « Contents : Read and write »)',
      404: 'Dépôt ou fichier introuvable pour ce jeton',
      409: 'Conflit d’écriture, réessayez',
      422: 'GitHub a refusé la modification'
    }[r.status] || `Erreur GitHub ${r.status}`;
    const e = new Error(j.message && r.status >= 500 ? `${msg} : ${j.message}` : msg);
    e.status = r.status;
    return e;
  }

  function bytesToB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const textToB64 = str => bytesToB64(new TextEncoder().encode(str));
  const b64ToText = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

  async function getFile(path) {
    const r = await fetch(`${API}/contents/${encPath(path)}?ref=${REPO.branch}`, { headers: headers(), cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw await fail(r);
    return r.json();
  }

  async function putFile(path, b64, message, sha) {
    const body = { message, content: b64, branch: REPO.branch };
    if (sha) body.sha = sha;
    const r = await fetch(`${API}/contents/${encPath(path)}`, { method: 'PUT', headers: headers(token, true), body: JSON.stringify(body) });
    if (!r.ok) throw await fail(r);
    return r.json();
  }

  async function deleteFile(path, message) {
    const f = await getFile(path);
    if (!f) return;
    const r = await fetch(`${API}/contents/${encPath(path)}`, {
      method: 'DELETE', headers: headers(token, true),
      body: JSON.stringify({ message, sha: f.sha, branch: REPO.branch })
    });
    if (!r.ok && r.status !== 404) throw await fail(r);
  }

  async function readJSON(path) {
    const f = await getFile(path);
    return f ? JSON.parse(b64ToText(f.content)) : null;
  }

  // Lecture-modification-écriture, avec nouvel essai si le fichier a changé entre-temps
  async function updateJSON(path, mutate, message) {
    for (let attempt = 0; ; attempt++) {
      const f = await getFile(path);
      const next = mutate(f ? JSON.parse(b64ToText(f.content)) : null);
      try {
        await putFile(path, textToB64(JSON.stringify(next, null, 2) + '\n'), message, f && f.sha);
        return next;
      } catch (e) {
        if ((e.status === 409 || e.status === 422) && attempt < 2) continue;
        throw e;
      }
    }
  }

  // Les écritures passent une par une pour éviter les conflits
  let chain = Promise.resolve();
  const queue = fn => { const p = chain.then(fn); chain = p.catch(() => {}); return p; };

  async function login(t) {
    t = String(t || '').trim();
    if (!t) throw new Error('Collez votre jeton');
    const r = await fetch(API, { headers: headers(t), cache: 'no-store' });
    if (r.status === 401) throw new Error('Jeton invalide ou expiré');
    if (r.status === 404 || r.status === 403) throw new Error(`Ce jeton n’a pas accès au dépôt ${REPO.repo}`);
    if (!r.ok) throw new Error(`Erreur GitHub ${r.status}`);
    const j = await r.json();
    if (j.permissions && !j.permissions.push) throw new Error('Ce compte ne peut pas écrire dans le dépôt');
    token = t;
    try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  }

  function logout() {
    token = null;
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }

  return {
    REPO,
    get isAdmin() { return !!token; },
    login, logout, readJSON, bytesToB64,
    updateJSON: (path, mutate, message) => queue(() => updateJSON(path, mutate, message)),
    putBinary: (path, b64, message) => queue(async () => {
      const f = await getFile(path);
      return putFile(path, b64, message, f && f.sha);
    }),
    deleteFile: (path, message) => queue(() => deleteFile(path, message))
  };
})();
