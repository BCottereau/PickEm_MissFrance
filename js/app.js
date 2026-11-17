'use strict';
(() => {
  /* ---------- Réglages ---------- */
  const SCORING = { miss: 10, dauphine: 5, top12: 2, wrongRank: 1 };
  const MAX_SCORE = SCORING.miss + 4 * SCORING.dauphine + 7 * SCORING.top12;
  const ELECTION = new Date('2026-12-12T21:10:00+01:00');
  const SLOT_LABELS = ['Miss France 2027', '1re dauphine', '2e dauphine', '3e dauphine', '4e dauphine', ...Array(7).fill('Top 12')];
  const SHORT = ['Miss', 'D1', 'D2', 'D3', 'D4', ...Array(7).fill('T12')];
  const RANKS = ['Miss France', '1re dauphine', '2e dauphine', '3e dauphine', '4e dauphine'];
  const rankLow = i => i === 0 ? 'Miss France' : RANKS[i];
  const B32 = '0123456789abcdefghijklmnopqrstuv';
  const LS = { picks: 'mf27.picks', name: 'mf27.name', tab: 'mf27.tab' };
  // Noms de régions utilisés dans les données historiques (en anglais) pour chaque candidate
  const REGION_KEYS = { Tahiti: ['French Polynesia', 'Tahiti'], Languedoc: ['Languedoc', 'Languedoc-Roussillon'] };
  const FR = {
    Brittany: 'Bretagne', Burgundy: 'Bourgogne', Corsica: 'Corse', 'French Guiana': 'Guyane',
    'French Polynesia': 'Polynésie (Tahiti)', 'New Caledonia': 'Nouvelle-Calédonie', Normandy: 'Normandie',
    Picardy: 'Picardie', "Nice Côte d'Azur": "Côte d'Azur", Saar: 'Sarre', Morocco: 'Maroc'
  };

  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ICON = {
    crown: svg('<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>'),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
    x: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    copy: svg('<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
    share: svg('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>'),
    shuffle: svg('<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'),
    trophy: svg('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    plus: svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>')
  };


  /* ---------- État ---------- */
  const state = {
    cands: [], byId: new Map(), winners: [], replacements: [], recent: {},
    results: null, players: [], photoPreview: {},
    picks: Array(12).fill(null), name: '', selected: null, tab: 'pick', sort: 'region', query: ''
  };


  /* ---------- Utilitaires ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const save = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };
  const fr = r => FR[r] || r;
  const cand = id => state.byId.get(id);
  const baseUrl = () => location.origin + location.pathname;
  const heightTxt = h => h ? h.toFixed(2).replace('.', ',') + ' m' : '–';

  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(url + ' : ' + r.status);
    return r.json();
  }

  let toastTimer;
  function toast(msg, ms = 2400) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  async function copyText(text, okMsg = 'Lien copié') {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch { window.prompt('Copiez ce lien :', text); }
  }

  function initials(name) {
    const parts = name.split(/[\s-]+/).filter(Boolean);
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function avatar(c, size = 'm') {
    const hue = (c.id * 47) % 360;
    const src = state.photoPreview[c.id] || c.photo_url;
    const img = src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : '';
    return `<span class="av av-${size}" style="--h:${hue}">${esc(initials(c.name))}${img}</span>`;
  }

  /* ---------- Encodage des liens ---------- */
  const encIds = ids => ids.map(id => B32[id || 0]).join('');
  const decIds = s => [...String(s)].map(ch => { const i = B32.indexOf(ch.toLowerCase()); return i > 0 ? i : null; });

  function validPickCode(code) {
    if (!/^[0-9a-v]{12}$/i.test(code || '')) return false;
    const ids = decIds(code);
    return ids.every(id => id && state.byId.has(id)) && new Set(ids).size === 12;
  }
  const pickLink = () => `${baseUrl()}#p=${encIds(state.picks)}&n=${encodeURIComponent(state.name.trim())}`;



  /* ---------- Données historiques ---------- */
  const regionKeys = c => REGION_KEYS[c.region_en] || [c.region_en];

  function titlesFor(c) {
    const keys = regionKeys(c);
    const list = state.winners.filter(w => keys.includes(w.region)).map(w => ({ ...w, repl: false }))
      .concat(state.replacements.filter(w => keys.includes(w.region)).map(w => ({ ...w, repl: true })));
    return list.sort((a, b) => b.year - a.year);
  }

  function recentFor(c) {
    const keys = regionKeys(c);
    return Object.keys(state.recent).sort().reverse().map(year => {
      const e = state.recent[year];
      const list = e.top12 || e.top15 || [];
      let label = null, tier = 0;
      if (keys.includes(e.winner)) { label = 'Miss France'; tier = 3; }
      else if (e.ru && e.ru.some(r => keys.includes(r))) {
        const i = e.ru.findIndex(r => keys.includes(r));
        label = RANKS[i + 1]; tier = 2;
      } else {
        const i = list.findIndex(r => keys.includes(r));
        if (i >= 0) { label = i < 12 ? 'Top 12' : 'Top 15'; tier = 1; }
      }
      return { year, label, tier };
    });
  }

  /* ---------- Pronostic ---------- */
  function sanitizePicks(arr) {
    const out = Array(12).fill(null), seen = new Set();
    (Array.isArray(arr) ? arr : []).slice(0, 12).forEach((id, i) => {
      if (state.byId.has(id) && !seen.has(id)) { out[i] = id; seen.add(id); }
    });
    return out;
  }
  const pickCount = () => state.picks.filter(Boolean).length;
  const isComplete = () => pickCount() === 12;
  const slotOf = id => state.picks.indexOf(id);

  function commitPicks() {
    save(LS.picks, state.picks);
    renderBoard(); renderPool(); renderShare(); renderCandList(); renderRanking();
  }

  function placeInSlot(id, slot) {
    const prev = slotOf(id);
    const occupant = state.picks[slot];
    if (prev >= 0) state.picks[prev] = occupant && prev !== slot ? occupant : null; // échange si elle venait d'une autre case
    state.picks[slot] = id;
    state.selected = null;
    commitPicks();
  }

  function addPick(id) {
    if (slotOf(id) >= 0) return;
    if (state.selected != null) { placeInSlot(id, state.selected); return; }
    const free = state.picks.indexOf(null);
    if (free < 0) { toast('Top 12 complet : touchez une case pour la remplacer'); return; }
    placeInSlot(id, free);
    const c = cand(id);
    toast(`${c.region} → ${SLOT_LABELS[free]}`);
  }

  function removePick(slot) {
    state.picks[slot] = null;
    if (state.selected === slot) state.selected = null;
    commitPicks();
  }

  function swapSlots(a, b) {
    [state.picks[a], state.picks[b]] = [state.picks[b], state.picks[a]];
    state.selected = null;
    commitPicks();
  }

  function tapSlot(slot) {
    const sel = state.selected;
    if (sel === slot) { state.selected = null; }
    else if (sel != null && (state.picks[sel] || state.picks[slot])) { swapSlots(sel, slot); return; }
    else { state.selected = slot; }
    renderBoard(); renderPool();
  }

  function randomFill() {
    const free = state.cands.filter(c => slotOf(c.id) < 0).map(c => c.id);
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    state.picks = state.picks.map(id => id || free.pop());
    state.selected = null;
    commitPicks();
    toast('Cases vides complétées au hasard');
  }

  /* ---------- Résultats & score ---------- */
  function resolveRef(ref) {
    if (ref == null || ref === '') return null;
    if (typeof ref === 'number') return state.byId.has(ref) ? ref : null;
    const n = norm(ref);
    if (/^\d+$/.test(n)) return state.byId.has(+n) ? +n : null;
    if (['polynesie', 'polynesie francaise', 'french polynesia'].includes(n)) return state.cands.find(c => c.region_en === 'Tahiti')?.id ?? null;
    const c = state.cands.find(c => [c.region, c.region_en, c.name].some(v => norm(v) === n));
    return c ? c.id : null;
  }

  function normResults(raw) {
    const R = { order: [null, null, null, null, null], top12: new Set(), unresolved: [] };
    if (!raw) return R;
    const refs = [raw.miss_france, ...(Array.isArray(raw.dauphines) ? raw.dauphines : [])].slice(0, 5);
    refs.forEach((ref, i) => {
      const id = resolveRef(ref);
      if (ref != null && ref !== '' && !id) R.unresolved.push(ref);
      if (id && !R.order.includes(id)) R.order[i] = id;
    });
    (Array.isArray(raw.top12) ? raw.top12 : []).forEach(ref => {
      const id = resolveRef(ref);
      if (id) R.top12.add(id); else if (ref != null && ref !== '') R.unresolved.push(ref);
    });
    R.order.forEach(id => id && R.top12.add(id));
    return R;
  }

  const results = () => normResults(state.results);

  function resultsStatus(R) {
    if (R.top12.size === 0) return 'none';
    if (R.top12.size >= 12 && R.order.every(Boolean)) return 'final';
    return 'partial';
  }

  function scorePicks(ids, R) {
    const top12Known = R.top12.size >= 12;
    const top5 = new Set(R.order.filter(Boolean));
    const top5Known = R.order.every(Boolean);
    const rows = ids.map((c, i) => {
      const actual = R.order.indexOf(c);
      const r = { id: c, slot: i, pts: 0, pending: false, kind: 'none', label: '' };
      if (R.top12.size === 0) { r.pending = true; r.kind = 'wait'; r.label = 'En attente'; }
      else if (!R.top12.has(c)) {
        if (top12Known) { r.kind = 'miss'; r.label = 'Hors Top 12'; }
        else { r.pending = true; r.kind = 'wait'; r.label = 'En attente'; }
      } else if (i <= 4) {
        if (R.order[i] === c) { r.pts = i === 0 ? SCORING.miss : SCORING.dauphine; r.kind = 'exact'; r.label = 'Bon rang'; }
        else if (R.order[i] != null || actual >= 0) {
          r.pts = SCORING.wrongRank; r.kind = 'part';
          r.label = actual >= 0 ? `Finalement ${rankLow(actual)}` : 'Top 12, autre rang';
        } else { r.pts = SCORING.wrongRank; r.pending = true; r.kind = 'part'; r.label = 'Top 12, rang à venir'; }
      } else if (actual >= 0) { r.pts = SCORING.wrongRank; r.kind = 'part'; r.label = `Finalement ${rankLow(actual)}`; }
      else { r.pts = SCORING.top12; r.pending = !top5Known; r.kind = 'exact'; r.label = top5Known ? 'Top 12 ✓' : 'Top 12 (si hors Top 5)'; }
      return r;
    });
    return {
      rows,
      total: rows.reduce((s, r) => s + r.pts, 0),
      exact: rows.filter(r => r.kind === 'exact').length,
      pending: rows.some(r => r.pending)
    };
  }


  /* ---------- Classement officiel (players.json, géré par l'organisateur) ---------- */
  const normPlayers = data => (data && Array.isArray(data.players) ? data.players : [])
    .filter(p => p && typeof p.name === 'string' && validPickCode(p.code));

  function parseLinks(text) {
    const found = [];
    String(text).split(/\s+/).forEach(tok => {
      const h = tok.indexOf('#');
      const q = h >= 0 ? tok.slice(h + 1) : tok;
      if (!/(^|&)p=/.test(q)) return;
      const sp = new URLSearchParams(q);
      found.push({ code: (sp.get('p') || '').toLowerCase(), name: (sp.get('n') || '').trim() });
    });
    return found;
  }

  // Où en est mon propre pronostic par rapport au classement officiel ?
  function myStatus() {
    if (!isComplete() || !state.name.trim()) return 'incomplete';
    const code = encIds(state.picks);
    const byName = state.players.find(p => norm(p.name) === norm(state.name));
    if (byName) return byName.code === code ? 'ok' : 'outdated';
    return state.players.some(p => p.code === code) ? 'ok' : 'missing';
  }
  const isMe = p => !!state.name.trim() && norm(p.name) === norm(state.name);

  /* ---------- Écritures de l'organisateur ---------- */
  async function adminWrite(label, fn) {
    toast(`${label} : publication…`, 60e3);
    try {
      const r = await fn();
      toast(`${label} : publié ✓ visible par tous d’ici 1 à 2 min`, 4000);
      return r;
    } catch (e) {
      toast(`Échec : ${e.message}`, 6000);
      if (e.status === 401) { GH.logout(); applyAdminMode(); }
      throw e;
    }
  }

  async function upsertPlayers(entries) {
    const valid = entries.filter(e => validPickCode(e.code));
    if (!valid.length) { toast('Aucun lien de pronostic valide'); return; }
    let sum = {};
    const data = await adminWrite('Classement', () => GH.updateJSON('players.json', cur => {
      const players = normPlayers(cur);
      sum = { added: 0, updated: 0 };
      valid.forEach(({ name, code }) => {
        name = (name || '').trim().slice(0, 40) || `Anonyme ${players.length + 1}`;
        const ex = players.find(p => norm(p.name) === norm(name));
        if (!ex) { players.push({ name, code }); sum.added++; }
        else if (ex.code !== code) { ex.code = code; sum.updated++; }
      });
      return { players };
    }, `Classement : ${valid.map(e => e.name || 'Anonyme').join(', ')}`)).catch(() => null);
    if (!data) return;
    state.players = normPlayers(data);
    renderAll();
    const parts = [sum.added && `${sum.added} ajouté${sum.added > 1 ? 's' : ''}`, sum.updated && `${sum.updated} mis à jour`].filter(Boolean);
    if (parts.length) setTimeout(() => toast(parts.join(' · ') + ' ✓', 3000), 1500);
  }

  async function removePlayer(name) {
    const data = await adminWrite('Classement', () => GH.updateJSON('players.json',
      cur => ({ players: normPlayers(cur).filter(p => p.name !== name) }), `Classement : retire ${name}`)).catch(() => null);
    if (data) { state.players = normPlayers(data); renderAll(); }
  }

  async function saveResults(raw) {
    const data = await adminWrite('Résultats', () => GH.updateJSON('results.json',
      cur => ({ _aide: (cur && cur._aide) || '', ...raw }), 'Résultats mis à jour')).catch(() => null);
    if (data) { state.results = data; renderAll(); }
  }

  const slugify = s => norm(s).replace(/ /g, '-');
  async function fileToJpeg(file, max = 900) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('Image illisible : utilisez un JPEG ou un PNG'));
        i.src = url;
      });
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * s);
      cv.height = Math.round(img.naturalHeight * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      const dataUrl = cv.toDataURL('image/jpeg', 0.85);
      return { dataUrl, b64: dataUrl.split(',')[1] };
    } finally { URL.revokeObjectURL(url); }
  }

  async function uploadPhoto(id, file) {
    const c = cand(id);
    let img;
    try { img = await fileToJpeg(file); } catch (e) { toast(e.message, 4000); return; }
    const path = `photos/${slugify(c.region)}-${Date.now().toString(36)}.jpg`;
    const old = c.photo_url;
    state.photoPreview[id] = img.dataUrl;
    refreshPhotos(id);
    try {
      await adminWrite(`Photo de Miss ${c.region}`, async () => {
        await GH.putBinary(path, img.b64, `Photo : Miss ${c.region}`);
        await GH.updateJSON(CANDS_PATH, cur => cur.map(x => x.id === id ? { ...x, photo_url: path } : x), `Photo : Miss ${c.region} (fiche)`);
        if (old && /^photos\//.test(old)) await GH.deleteFile(old, `Photo : retire l’ancienne de Miss ${c.region}`).catch(() => {});
      });
      c.photo_url = path;
    } catch {
      delete state.photoPreview[id];
    }
    refreshPhotos(id);
  }

  async function removePhoto(id) {
    const c = cand(id);
    const old = c.photo_url;
    if (!old && !state.photoPreview[id]) return;
    if (!confirm(`Retirer la photo de Miss ${c.region} ?`)) return;
    try {
      await adminWrite(`Photo de Miss ${c.region}`, async () => {
        await GH.updateJSON(CANDS_PATH, cur => cur.map(x => x.id === id ? { ...x, photo_url: null } : x), `Photo : retire Miss ${c.region}`);
        if (old && /^photos\//.test(old)) await GH.deleteFile(old, `Photo : supprime Miss ${c.region}`).catch(() => {});
      });
      c.photo_url = null;
      delete state.photoPreview[id];
    } catch { /* message déjà affiché */ }
    refreshPhotos(id);
  }

  function refreshPhotos(id) {
    renderBoard(); renderPool(); renderCandList(); renderRanking(); renderAdmin();
    const sheet = $('#sheet');
    if (sheet.open && sheet.dataset.cid === String(id)) openFiche(id);
  }


  /* ---------- Rendu : Mon pronostic ---------- */
  function buildPickTab() {
    $('#tab-pick').innerHTML = `
      <div class="card-block">
        <label class="field">
          <span class="field-label">Votre prénom ou pseudo</span>
          <input id="nameInput" type="text" maxlength="40" autocomplete="nickname" placeholder="ex. Baptiste" value="${esc(state.name)}">
        </label>
      </div>
      <div class="board-head">
        <h2>Votre Top 12</h2>
        <span id="progress" class="progress"></span>
      </div>
      <p id="hint" class="hint"></p>
      <div id="board" class="board"></div>
      <div class="row-actions">
        <button class="btn ghost" data-action="random">${ICON.shuffle}Compléter au hasard</button>
        <button class="btn ghost" data-action="clear">${ICON.trash}Tout effacer</button>
      </div>
      <div id="share"></div>
      <div class="board-head pool-head"><h2>Les 31 candidates</h2></div>
      <div id="pool" class="pool" data-drop="pool"></div>`;
    $('#nameInput').addEventListener('input', e => {
      state.name = e.target.value;
      save(LS.name, state.name);
      renderShare(); renderRanking();
    });
  }

  function slotHTML(i) {
    const id = state.picks[i];
    const c = id && cand(id);
    const kind = i === 0 ? 'miss' : i <= 4 ? 'dau' : 'top';
    const cls = ['slot', `slot-${kind}`, c ? 'filled' : 'empty', state.selected === i ? 'selected' : ''].join(' ');
    const label = i === 0 ? `${ICON.crown}<span>Miss France 2027</span>` : `<span>${SLOT_LABELS[i]}</span>`;
    const body = c
      ? `${avatar(c, i === 0 ? 'l' : 's')}<span class="slot-txt"><span class="slot-region">${esc(c.region)}</span><span class="slot-name">${esc(c.name)}</span></span>`
      : `<span class="slot-empty">${state.selected === i ? 'Choisissez une candidate' : 'Choisir'}</span>`;
    const aria = c ? `${SLOT_LABELS[i]} : ${c.region}, ${c.name}. Touchez pour sélectionner ou échanger.` : `${SLOT_LABELS[i]} : vide`;
    return `<div class="${cls}" data-drop="slot" data-slot="${i}" ${c ? `data-drag data-cid="${id}"` : ''}>
        <button class="slot-main" data-action="slot" data-slot="${i}" aria-label="${esc(aria)}" aria-pressed="${state.selected === i}">
          <span class="slot-label">${label}</span>${body}
        </button>
        ${c ? `<button class="slot-x" data-action="unpick" data-slot="${i}" data-nodrag aria-label="Retirer ${esc(c.region)}">${ICON.x}</button>` : ''}
      </div>`;
  }

  function renderBoard() {
    const b = $('#board');
    if (!b) return;
    b.innerHTML = `
      <div class="tier tier-miss">${slotHTML(0)}</div>
      <div class="tier-title">Les dauphines</div>
      <div class="tier tier-dau">${[1, 2, 3, 4].map(slotHTML).join('')}</div>
      <div class="tier-title">Le reste du Top 12 <small>(ordre libre)</small></div>
      <div class="tier tier-top">${[5, 6, 7, 8, 9, 10, 11].map(slotHTML).join('')}</div>`;
    const n = pickCount();
    $('#progress').innerHTML = `<b>${n}</b>/12`;
    $('#progress').classList.toggle('done', n === 12);
    const hint = $('#hint');
    if (state.selected != null) {
      hint.innerHTML = `Case <b>${SLOT_LABELS[state.selected]}</b> sélectionnée : touchez une candidate, ou une autre case pour échanger.`;
      hint.classList.add('active');
    } else {
      hint.textContent = n === 12
        ? 'Pronostic complet. Touchez deux cases pour les échanger, ou glissez-déposez.'
        : 'Touchez une candidate pour la placer dans la prochaine case libre, ou touchez d’abord une case. Glissez-déposez pour réorganiser (appui long sur mobile).';
      hint.classList.remove('active');
    }
  }

  function renderPool() {
    const p = $('#pool');
    if (!p) return;
    p.innerHTML = state.cands.map(c => {
      const s = slotOf(c.id);
      return `<div class="pcard ${s >= 0 ? 'is-picked' : ''}" data-drag data-cid="${c.id}">
          <button class="pcard-main" data-action="pool" data-cid="${c.id}" aria-label="${esc(c.region)}, ${esc(c.name)}${s >= 0 ? ' (' + SLOT_LABELS[s] + ', toucher pour retirer)' : ''}">
            ${avatar(c, 's')}
            <span class="pcard-txt"><span class="pcard-region">${esc(c.region)}</span><span class="pcard-name">${esc(c.name)}</span></span>
            ${s >= 0 ? `<span class="badge ${s === 0 ? 'gold' : ''}">${SHORT[s]}</span>` : ''}
          </button>
          <button class="pcard-info" data-action="info" data-cid="${c.id}" data-nodrag aria-label="Fiche de ${esc(c.name)}">${ICON.info}</button>
        </div>`;
    }).join('');
  }


  function renderShare() {
    const el = $('#share');
    if (!el) return;
    const missing = [];
    if (!isComplete()) missing.push(`${12 - pickCount()} case${12 - pickCount() > 1 ? 's' : ''} à remplir`);
    if (!state.name.trim()) missing.push('votre pseudo');
    if (missing.length) {
      el.innerHTML = `<div class="share-box locked">${ICON.share}<div><b>${GH.isAdmin ? 'Publier mon pronostic' : 'Lien à envoyer à l’organisateur'}</b><p>Il manque : ${missing.join(' et ')}.</p></div></div>`;
      return;
    }
    const st = myStatus();
    const link = pickLink();
    if (GH.isAdmin) {
      const msg = {
        ok: '✓ Votre pronostic est à jour dans le classement. Modifiez votre Top 12 quand vous voulez puis republiez.',
        outdated: 'Vous avez modifié votre Top 12 : republiez-le pour mettre le classement à jour.',
        missing: 'Votre pronostic n’est pas encore dans le classement.'
      }[st];
      el.innerHTML = `<div class="share-box ${st === 'ok' ? 'ok' : ''}">
          <div class="share-top">${ICON.crown}<div><b>Mon pronostic (organisateur)</b><p>${msg}</p></div></div>
          <div class="row-actions">
            ${st === 'ok' ? '' : `<button class="btn gold" data-action="publish-mine">${ICON.share}${st === 'outdated' ? 'Mettre à jour dans le classement' : 'Publier dans le classement'}</button>`}
            <button class="btn ghost" data-action="copy-link">${ICON.copy}Copier mon lien</button>
          </div>
        </div>`;
      return;
    }
    const msg = {
      ok: '✓ Votre pronostic est dans le classement. Si vous changez d’avis, modifiez votre Top 12 et renvoyez le nouveau lien.',
      outdated: 'Vous avez modifié votre Top 12 : renvoyez ce nouveau lien à l’organisateur pour mettre le classement à jour.',
      missing: 'Envoyez ce lien à l’organisateur pour entrer dans le classement. Vous pourrez encore le modifier ensuite.'
    }[st];
    el.innerHTML = `<div class="share-box ${st === 'ok' ? 'ok' : ''}">
        <div class="share-top">${ICON.share}<div><b>Votre lien de pronostic</b><p>${msg}</p></div></div>
        <input class="link-field" readonly value="${esc(link)}" aria-label="Lien de partage" onclick="this.select()">
        <div class="row-actions">
          <button class="btn gold" data-action="copy-link">${ICON.copy}Copier le lien</button>
          ${navigator.share ? `<button class="btn" data-action="share-link">${ICON.share}Envoyer</button>` : ''}
        </div>
      </div>`;
  }


  /* ---------- Rendu : Candidates ---------- */
  function buildCandsTab() {
    $('#tab-cands').innerHTML = `
      <div class="toolbar">
        <label class="search">${ICON.search}<input id="q" type="search" placeholder="Région, nom, ville…" aria-label="Rechercher"></label>
        <label class="select"><span class="sr">Trier</span>
          <select id="sort">
            <option value="region">Région A→Z</option>
            <option value="titles">Palmarès de la région</option>
            <option value="last">Dernière victoire</option>
            <option value="age">Âge</option>
            <option value="height">Taille</option>
            <option value="name">Prénom</option>
          </select>
        </label>
      </div>
      <div id="candList" class="clist"></div>`;
    $('#q').addEventListener('input', e => { state.query = e.target.value; renderCandList(); });
    $('#sort').value = state.sort;
    $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderCandList(); });
  }

  function renderCandList() {
    const el = $('#candList');
    if (!el) return;
    const q = norm(state.query);
    const sorters = {
      region: (a, b) => a.region.localeCompare(b.region, 'fr'),
      titles: (a, b) => b.past_titles - a.past_titles || (b.last_title_year || 0) - (a.last_title_year || 0),
      last: (a, b) => (b.last_title_year || 0) - (a.last_title_year || 0),
      age: (a, b) => a.age - b.age,
      height: (a, b) => b.height_m - a.height_m,
      name: (a, b) => a.name.localeCompare(b.name, 'fr')
    };
    const list = state.cands
      .filter(c => !q || norm([c.region, c.region_en, c.name, c.hometown].join(' ')).includes(q))
      .sort(sorters[state.sort]);
    if (!list.length) { el.innerHTML = '<p class="empty-msg">Aucune candidate ne correspond.</p>'; return; }
    el.innerHTML = list.map(c => {
      const s = slotOf(c.id);
      return `<button class="ccard" data-action="info" data-cid="${c.id}">
          ${avatar(c, 'm')}
          <span class="ccard-body">
            <span class="ccard-top"><span class="ccard-region">${esc(c.region)}</span>${s >= 0 ? `<span class="badge ${s === 0 ? 'gold' : ''}">${SHORT[s]}</span>` : ''}</span>
            <span class="ccard-name">${esc(c.name)}</span>
            <span class="ccard-meta">${c.age} ans · ${heightTxt(c.height_m)} · ${esc(c.hometown)}</span>
            <span class="ccard-titles">${c.past_titles ? `${ICON.crown}${c.past_titles} titre${c.past_titles > 1 ? 's' : ''} · dernier en ${c.last_title_year}` : '<i>Jamais titrée</i>'}</span>
          </span>
        </button>`;
    }).join('');
  }


  /* ---------- Fiche candidate ---------- */
  const photoOf = c => state.photoPreview[c.id] || c.photo_url;

  function openFiche(id) {
    const c = cand(id);
    if (!c) return;
    const titles = titlesFor(c);
    const repl = titles.filter(t => t.repl).length;
    const last = titles.find(t => !t.repl);
    const recent = recentFor(c);
    const s = slotOf(id);
    const photo = photoOf(c);
    const sheet = $('#sheet');
    sheet.dataset.cid = String(id);
    sheet.innerHTML = `
      <div class="sheet-inner">
        <button class="sheet-close" data-action="close-sheet" aria-label="Fermer">${ICON.x}</button>
        ${photo ? `<div class="fiche-photo"><img src="${esc(photo)}" alt="Portrait de ${esc(c.name)}" onerror="this.parentNode.remove()"></div>` : ''}
        <div class="fiche-head">
          ${photo ? '' : avatar(c, 'xl')}
          <div>
            <p class="eyebrow">Miss ${esc(c.region)}</p>
            <h2 id="sheet-title">${esc(c.name)}</h2>
            ${c.instagram ? `<a class="insta" href="https://instagram.com/${esc(String(c.instagram).replace(/^@/, ''))}" target="_blank" rel="noopener">@${esc(String(c.instagram).replace(/^@/, ''))}</a>` : ''}
          </div>
        </div>
        ${GH.isAdmin ? `<div class="row-actions admin-row">
            ${photoInput(id, photo ? 'Changer la photo' : 'Ajouter une photo')}
            ${photo ? `<button class="btn ghost small" data-action="photo-remove" data-cid="${id}">${ICON.trash}Retirer</button>` : ''}
          </div>` : ''}
        <div class="stats">
          <div><span>Âge</span><b>${c.age} ans</b></div>
          <div><span>Taille</span><b>${heightTxt(c.height_m)}</b></div>
          <div><span>Ville</span><b>${esc(c.hometown)}</b></div>
        </div>
        <h3>Palmarès de la région</h3>
        ${c.past_titles ? `
          <p class="big-line"><b>${c.past_titles}</b> titre${c.past_titles > 1 ? 's' : ''} de Miss France${repl ? ` <small>(dont ${repl} par remplacement)</small>` : ''}</p>
          <p class="muted">Dernière victoire : <b>${c.last_title_year}</b>${last && last.year === c.last_title_year ? ` · ${esc(last.name)}` : ''}</p>
          <ul class="titles">${titles.map(t => `<li${t.repl ? ' class="repl"' : ''}><b>${t.year}</b> ${esc(t.name)}${t.repl ? ' <small>remplaçante</small>' : ''}${regionKeys(c).length > 1 && t.region !== c.region_en ? ` <small>(${esc(fr(t.region))})</small>` : ''}</li>`).join('')}</ul>`
        : `<p class="muted">Aucune Miss France dans l’histoire pour cette région. Une première ?</p>`}
        <h3>5 dernières éditions</h3>
        <div class="recent">${recent.map(r => `<div class="rec tier-${r.tier}"><span>${r.year}</span><b>${r.label || '—'}</b></div>`).join('')}</div>
        <div class="sheet-actions">
          ${s >= 0
            ? `<button class="btn" data-action="sheet-unpick" data-cid="${id}">${ICON.x}Retirer de mon Top 12 (${SLOT_LABELS[s]})</button>`
            : `<button class="btn gold" data-action="sheet-pick" data-cid="${id}">${ICON.plus}Ajouter à mon Top 12</button>`}
        </div>
      </div>`;
    showSheet();
  }

  const photoInput = (id, label) => `<label class="btn small file-btn">${ICON.camera}${label}<input type="file" accept="image/*" data-photo="${id}" hidden></label>`;


  function showSheet() {
    const sheet = $('#sheet');
    if (!sheet.open) { if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', ''); }
    sheet.scrollTop = 0;
  }
  function closeSheet() { const s = $('#sheet'); if (s.close) s.close(); else s.removeAttribute('open'); }

  function picksListHTML(ids, scored) {
    return `<ol class="plist">${ids.map((id, i) => {
      const c = cand(id);
      const r = scored && scored.rows[i];
      return `<li class="${r ? 'k-' + r.kind : ''}">
          <span class="plist-rank">${SHORT[i]}</span>
          ${avatar(c, 's')}
          <span class="plist-txt"><b>${esc(c.region)}</b><small>${esc(c.name)}</small></span>
          ${r ? `<span class="plist-pts" title="${esc(r.label)}"><span>${r.pts ? '+' + r.pts : '0'}${r.pending ? '<i>?</i>' : ''}</span><small>${esc(r.label)}</small></span>` : ''}
        </li>`;
    }).join('')}</ol>`;
  }


  /* ---------- Rendu : Classement (lecture seule pour tous) ---------- */
  function buildRankTab() {
    $('#tab-rank').innerHTML = `
      <div id="resStatus"></div>
      <div id="myNote"></div>
      <div class="board-head"><h2>Classement</h2><span class="progress">sur ${MAX_SCORE} pts</span></div>
      <div id="leaderboard" class="lb"></div>
      <details class="card-block rules">
        <summary>Barème</summary>
        <ul>
          <li><b>${SCORING.miss} pts</b> : la bonne Miss France</li>
          <li><b>${SCORING.dauphine} pts</b> par dauphine au bon rang</li>
          <li><b>${SCORING.top12} pts</b> par candidate bien placée dans le Top 12 (choisie en 6e-12e et qualifiée sans entrer dans le Top 5)</li>
          <li><b>${SCORING.wrongRank} pt</b> par candidate qualifiée dans le Top 12 mais pas au bon rang</li>
        </ul>
        <p class="muted">Maximum ${MAX_SCORE} pts. Égalité départagée par le nombre de pronostics exacts. Pendant la soirée, les scores marqués « ? » sont provisoires.</p>
      </details>`;
  }

  function renderResStatus() {
    const el = $('#resStatus');
    if (!el) return;
    const R = results();
    const st = resultsStatus(R);
    if (st === 'none') {
      el.innerHTML = `<div class="status wait">${ICON.trophy}<div><b>Résultats pas encore connus</b><p>Rendez-vous samedi 12 décembre sur TF1. Le classement se mettra à jour pendant la soirée.</p></div></div>`;
      return;
    }
    const miss = R.order[0] && cand(R.order[0]);
    el.innerHTML = `<div class="status ${st}">${ICON.trophy}<div>
        <b>${st === 'final' ? 'Résultats définitifs' : 'Résultats en cours'}</b>
        <p>${miss ? `Miss France 2027 : <b>${esc(miss.region)}</b>, ${esc(miss.name)}` : `Top 12 : ${R.top12.size}/12 connues · Top 5 : ${R.order.filter(Boolean).length}/5`}</p>
        ${R.unresolved.length && GH.isAdmin ? `<p class="muted small">Non reconnu dans results.json : ${R.unresolved.map(esc).join(', ')}</p>` : ''}
      </div></div>`;
  }

  function renderMyNote() {
    const el = $('#myNote');
    if (!el) return;
    const st = myStatus();
    const txt = {
      incomplete: GH.isAdmin ? '' : 'Vous n’êtes pas encore dans le classement : faites votre Top 12 et envoyez votre lien à l’organisateur.',
      missing: GH.isAdmin ? 'Votre pronostic n’est pas publié : onglet « Mon pronostic » → Publier.' : 'Votre pronostic n’est pas encore dans le classement : envoyez votre lien à l’organisateur.',
      outdated: GH.isAdmin ? 'Votre Top 12 a changé depuis sa publication : onglet « Mon pronostic » → Mettre à jour.' : 'Votre Top 12 a changé : renvoyez votre nouveau lien à l’organisateur.',
      ok: ''
    }[st];
    el.innerHTML = txt ? `<p class="note">${txt}</p>` : '';
  }

  const openDetails = new Set();
  function renderRanking() {
    renderResStatus();
    renderMyNote();
    const el = $('#leaderboard');
    if (!el) return;
    const R = results();
    const entries = state.players.map(p => ({ ...p, ids: decIds(p.code), me: isMe(p) }))
      .map(e => ({ ...e, s: scorePicks(e.ids, R) }));
    if (!entries.length) {
      el.innerHTML = `<p class="empty-msg">Personne pour l’instant. Les pronostics apparaîtront ici dès que l’organisateur les aura enregistrés.</p>`;
      return;
    }
    const started = resultsStatus(R) !== 'none';
    entries.sort((a, b) => started ? (b.s.total - a.s.total || b.s.exact - a.s.exact || a.name.localeCompare(b.name, 'fr')) : (b.me - a.me || a.name.localeCompare(b.name, 'fr')));
    let rank = 0, prev = null;
    el.innerHTML = entries.map((e, i) => {
      if (started) { const k = `${e.s.total}|${e.s.exact}`; if (k !== prev) rank = i + 1; prev = k; }
      const miss = cand(e.ids[0]);
      const key = `${e.name}|${e.code}`;
      return `<details class="lb-row ${e.me ? 'me' : ''}" data-key="${esc(key)}" ${openDetails.has(key) ? 'open' : ''}>
          <summary>
            <span class="lb-rank ${started && rank <= 3 ? 'r' + rank : ''}">${started ? rank : '•'}</span>
            <span class="lb-name"><b>${esc(e.name)}${e.me ? ' <small>(moi)</small>' : ''}</b><small>${ICON.crown}${esc(miss.region)}</small></span>
            <span class="lb-score">${started ? `${e.s.total}${e.s.pending ? '<i>?</i>' : ''}<small>pts</small>` : ''}</span>
          </summary>
          ${picksListHTML(e.ids, started ? e.s : null)}
        </details>`;
    }).join('');
    el.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
      d.open ? openDetails.add(d.dataset.key) : openDetails.delete(d.dataset.key);
    }));
  }

  /* ---------- Rendu : Admin (organisateur uniquement) ---------- */
  function renderAdmin() {
    const el = $('#tab-admin');
    if (!el || !GH.isAdmin) return;
    const withPhoto = state.cands.filter(c => photoOf(c)).length;
    el.innerHTML = `
      <div class="status final">${ICON.crown}<div>
        <b>Mode organisateur</b>
        <p>Vos modifications sont publiées dans le dépôt GitHub et visibles par tous d’ici 1 à 2 minutes. Vos amis, eux, ne peuvent que faire leur pronostic.</p>
        <div class="row-actions"><button class="btn ghost small" data-action="admin-logout">Se déconnecter de cet appareil</button></div>
      </div></div>

      <div class="card-block">
        <h3>Joueurs (${state.players.length})</h3>
        <p class="muted">Collez les liens reçus de vos amis (un ou plusieurs, même au milieu d’un message). Un nouveau lien avec le même pseudo remplace l’ancien.</p>
        <textarea id="linksInput" rows="3" placeholder="https://…#p=…&amp;n=Léa"></textarea>
        <div class="row-actions"><button class="btn gold" data-action="add-links">${ICON.plus}Ajouter au classement</button></div>
        ${state.players.length ? `<ul class="admin-list">${state.players.map(p => `
          <li><span><b>${esc(p.name)}</b><small>${ICON.crown}${esc(cand(decIds(p.code)[0]).region)}</small></span>
          <button class="btn ghost small" data-action="remove-player" data-name="${esc(p.name)}" aria-label="Retirer ${esc(p.name)}">${ICON.trash}</button></li>`).join('')}</ul>` : ''}
      </div>

      <details id="resEditor" class="card-block" ${resEditorOpen ? 'open' : ''}>
        <summary>Résultats de l’élection</summary>
        <div id="resForm"></div>
      </details>

      <div class="card-block">
        <h3>Photos (${withPhoto}/31)</h3>
        <p class="muted">Choisissez une image par candidate : elle est redimensionnée automatiquement avant envoi.</p>
        <div class="photo-grid">${state.cands.map(c => `
          <div class="ptile">
            ${avatar(c, 'm')}
            <span class="ptile-txt"><b>${esc(c.region)}</b><small>${esc(c.name)}</small></span>
            ${photoInput(c.id, photoOf(c) ? 'Changer' : 'Ajouter')}
            ${photoOf(c) ? `<button class="btn ghost small icon-only" data-action="photo-remove" data-cid="${c.id}" aria-label="Retirer la photo de ${esc(c.region)}">${ICON.trash}</button>` : ''}
          </div>`).join('')}</div>
      </div>`;
    $('#resEditor').addEventListener('toggle', e => { resEditorOpen = e.target.open; if (e.target.open) renderResForm(); });
    if (resEditorOpen) renderResForm();
  }
  let resEditorOpen = false;

  function renderResForm() {
    const el = $('#resForm');
    if (!el) return;
    const R = results();
    const opts = sel => `<option value="">— pas encore connue —</option>` + [...state.cands]
      .sort((a, b) => a.region.localeCompare(b.region, 'fr'))
      .map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.region)} · ${esc(c.name)}</option>`).join('');
    el.innerHTML = `
      <p class="muted">Pendant la soirée : cochez le Top 12 dès son annonce et enregistrez, puis complétez les dauphines et la Miss au fur et à mesure.</p>
      <div class="res-grid">
        ${RANKS.map((r, i) => `<label class="field"><span class="field-label">${i === 0 ? ICON.crown : ''}${r}</span><select data-rank="${i}">${opts(R.order[i])}</select></label>`).join('')}
      </div>
      <p class="field-label">Top 12 (ordre libre, le Top 5 est coché automatiquement)</p>
      <div class="chips">${state.cands.map(c => `<label class="chip"><input type="checkbox" value="${c.id}" ${R.top12.has(c.id) ? 'checked' : ''}><span>${esc(c.region)}</span></label>`).join('')}</div>
      <p class="muted small" id="resCount"></p>
      <div class="row-actions">
        <button class="btn gold" data-action="save-results">Publier les résultats</button>
        ${resultsStatus(R) !== 'none' ? `<button class="btn ghost" data-action="clear-results">${ICON.trash}Tout effacer</button>` : ''}
      </div>`;
    const count = () => { $('#resCount').textContent = `${el.querySelectorAll('.chips input:checked').length}/12 cochées`; };
    el.querySelectorAll('select').forEach(s => s.addEventListener('change', () => {
      const id = +s.value;
      if (id) { const cb = el.querySelector(`.chips input[value="${id}"]`); if (cb) cb.checked = true; }
      count();
    }));
    el.querySelectorAll('.chips input').forEach(cb => cb.addEventListener('change', count));
    count();
  }

  function saveResultsForm() {
    const el = $('#resForm');
    const order = [...el.querySelectorAll('select[data-rank]')].map(s => +s.value || null);
    const set = order.filter(Boolean);
    if (new Set(set).size !== set.length) { toast('Une même candidate est à deux rangs'); return; }
    const top12 = new Set([...el.querySelectorAll('.chips input:checked')].map(i => +i.value));
    set.forEach(id => top12.add(id));
    if (top12.size > 12) { toast(`${top12.size} candidates cochées : 12 maximum`); return; }
    saveResults({ top12: [...top12], miss_france: order[0], dauphines: order.slice(1) });
  }

  function renderAll() { renderBoard(); renderPool(); renderShare(); renderCandList(); renderRanking(); renderAdmin(); }

  /* ---------- Onglets & mode organisateur ---------- */
  const TABS = () => GH.isAdmin ? ['pick', 'cands', 'rank', 'admin'] : ['pick', 'cands', 'rank'];
  function setTab(tab) {
    if (!TABS().includes(tab)) tab = 'pick';
    state.tab = tab;
    save(LS.tab, tab);
    document.querySelectorAll('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    ['pick', 'cands', 'rank', 'admin'].forEach(t => { $('#tab-' + t).hidden = t !== tab; });
  }

  function applyAdminMode() {
    $('#tabAdmin').hidden = !GH.isAdmin;
    $('#adminLink').hidden = GH.isAdmin;
    if (!GH.isAdmin) $('#tab-admin').innerHTML = '';
    renderAll();
    setTab(state.tab);
  }

  function openLogin() {
    const sheet = $('#sheet');
    sheet.dataset.cid = '';
    sheet.innerHTML = `<div class="sheet-inner">
        <button class="sheet-close" data-action="close-sheet" aria-label="Fermer">${ICON.x}</button>
        <p class="eyebrow">Espace organisateur</p>
        <h2 id="sheet-title">Connexion</h2>
        <p class="muted">Réservé à l’organisateur : il faut un jeton GitHub capable d’écrire dans le dépôt <b>${esc(GH.REPO.repo)}</b>. Il reste enregistré sur cet appareil uniquement.</p>
        <ol class="steps">
          <li>Ouvrez <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Fine-grained token</a>.</li>
          <li>Nom : « PickEm admin », expiration : après le 13 décembre.</li>
          <li>Repository access : <i>Only select repositories</i> → <b>${esc(GH.REPO.repo)}</b>.</li>
          <li>Permissions → Repository → <b>Contents : Read and write</b>.</li>
          <li>« Generate token », copiez-le et collez-le ici.</li>
        </ol>
        <label class="field"><span class="field-label">Jeton GitHub</span>
          <input id="tokenInput" type="password" autocomplete="off" placeholder="github_pat_…"></label>
        <p id="loginErr" class="err" role="alert"></p>
        <div class="sheet-actions"><button class="btn gold" data-action="admin-do-login">Se connecter</button></div>
      </div>`;
    showSheet();
    setTimeout(() => $('#tokenInput') && $('#tokenInput').focus(), 50);
  }

  async function doLogin() {
    const btn = $('[data-action="admin-do-login"]');
    btn.disabled = true;
    $('#loginErr').textContent = '';
    try {
      await GH.login($('#tokenInput').value);
      closeSheet();
      await reloadShared();
      applyAdminMode();
      setTab('admin');
      toast('Mode organisateur activé ✓');
    } catch (e) {
      $('#loginErr').textContent = e.message;
    } finally { btn.disabled = false; }
  }


  /* ---------- Liens entrants ---------- */
  function handleHash() {
    const h = location.hash.slice(1);
    if (!h) return;
    const sp = new URLSearchParams(h);
    history.replaceState(null, '', baseUrl());
    if (h === 'admin' || sp.has('admin')) { if (!GH.isAdmin) openLogin(); else setTab('admin'); return; }
    if (!sp.get('p')) return;
    const code = sp.get('p').toLowerCase();
    const name = (sp.get('n') || '').trim();
    if (!validPickCode(code)) { toast('Lien de pronostic invalide'); return; }
    if (code === encIds(state.picks) && norm(name) === norm(state.name)) { toast('C’est votre propre pronostic'); return; }
    const existing = state.players.find(p => norm(p.name) === norm(name));
    const sheet = $('#sheet');
    sheet.dataset.cid = '';
    sheet.innerHTML = `<div class="sheet-inner">
        <button class="sheet-close" data-action="close-sheet" aria-label="Fermer">${ICON.x}</button>
        <p class="eyebrow">Pronostic de</p>
        <h2 id="sheet-title">${esc(name || 'Anonyme')}</h2>
        ${GH.isAdmin && existing ? `<p class="note">${existing.code === code ? 'Déjà enregistré tel quel dans le classement.' : `Remplacera le pronostic actuel de ${esc(existing.name)}.`}</p>` : ''}
        ${picksListHTML(decIds(code))}
        <div class="sheet-actions">
          ${GH.isAdmin
            ? (existing && existing.code === code ? '' : `<button class="btn gold" data-action="import-player" data-code="${code}" data-name="${esc(name)}">${ICON.plus}${existing ? 'Mettre à jour le classement' : 'Ajouter au classement'}</button>`)
            : `<button class="btn gold" data-action="start-own">Faire mon propre pronostic</button>`}
        </div>
      </div>`;
    showSheet();
  }

  /* ---------- Clics ---------- */
  let suppressClick = false;
  function onClick(e) {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; return; }
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const cid = +t.dataset.cid;
    switch (t.dataset.action) {
      case 'tab': setTab(t.dataset.tab); break;
      case 'pool': slotOf(cid) >= 0 ? removePick(slotOf(cid)) : addPick(cid); break;
      case 'info': openFiche(cid); break;
      case 'slot': tapSlot(+t.dataset.slot); break;
      case 'unpick': removePick(+t.dataset.slot); break;
      case 'random': randomFill(); break;
      case 'clear':
        if (pickCount() && confirm('Effacer tout votre pronostic ?')) { state.picks = Array(12).fill(null); state.selected = null; commitPicks(); }
        break;
      case 'copy-link': copyText(pickLink()); break;
      case 'share-link':
        navigator.share({ title: 'Mon pronostic Miss France 2027', text: `Mon Top 12 Miss France 2027 (${state.name.trim()}) :`, url: pickLink() }).catch(() => {});
        break;
      case 'close-sheet': closeSheet(); break;
      case 'sheet-pick': addPick(cid); openFiche(cid); break;
      case 'sheet-unpick': removePick(slotOf(cid)); openFiche(cid); break;
      case 'start-own': closeSheet(); setTab('pick'); break;
      case 'admin-login': openLogin(); break;
      case 'admin-do-login': doLogin(); break;
      case 'admin-logout':
        if (confirm('Se déconnecter du mode organisateur sur cet appareil ?')) { GH.logout(); applyAdminMode(); toast('Mode organisateur désactivé'); }
        break;
      // ---- organisateur uniquement (sans jeton, GitHub refuse de toute façon) ----
      case 'publish-mine':
        if (GH.isAdmin) upsertPlayers([{ name: state.name, code: encIds(state.picks) }]);
        break;
      case 'import-player':
        if (GH.isAdmin) { closeSheet(); upsertPlayers([{ name: t.dataset.name, code: t.dataset.code }]); }
        break;
      case 'add-links': {
        if (!GH.isAdmin) break;
        const input = $('#linksInput');
        const links = parseLinks(input.value);
        if (!links.length) { toast('Aucun lien de pronostic trouvé'); break; }
        upsertPlayers(links).then(() => { if ($('#linksInput')) $('#linksInput').value = ''; });
        break;
      }
      case 'remove-player':
        if (GH.isAdmin && confirm(`Retirer ${t.dataset.name} du classement ?`)) removePlayer(t.dataset.name);
        break;
      case 'save-results': if (GH.isAdmin) saveResultsForm(); break;
      case 'clear-results':
        if (GH.isAdmin && confirm('Effacer tous les résultats saisis ?')) saveResults({ top12: [], miss_france: null, dauphines: [null, null, null, null] });
        break;
      case 'photo-remove': if (GH.isAdmin) removePhoto(cid); break;
    }
  }

  function onChange(e) {
    const input = e.target.closest('input[type=file][data-photo]');
    if (!input || !GH.isAdmin || !input.files || !input.files[0]) return;
    uploadPhoto(+input.dataset.photo, input.files[0]);
    input.value = '';
  }


  /* ---------- Glisser-déposer (souris et tactile) ---------- */
  let drag = null;
  const ghost = () => $('#ghost');

  function dropTargetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest('[data-drop]');
  }
  function clearOver() { document.querySelectorAll('.drop-over').forEach(n => n.classList.remove('drop-over')); }

  function startDrag() {
    if (!drag || drag.active) return;
    drag.active = true;
    const c = cand(drag.id);
    const g = ghost();
    g.innerHTML = `${avatar(c, 's')}<span><b>${esc(c.region)}</b><small>${esc(c.name)}</small></span>`;
    g.classList.add('show');
    moveGhost(drag.x, drag.y);
    drag.src.classList.add('dragging');
    document.body.classList.add('is-dragging');
    if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* ignore */ }
  }
  function moveGhost(x, y) { ghost().style.transform = `translate(${x - 70}px, ${y - 28}px)`; }

  function endDrag(commit) {
    if (!drag) return;
    clearTimeout(drag.timer);
    if (drag.active) {
      ghost().classList.remove('show');
      drag.src.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      clearOver();
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      if (commit) {
        const target = dropTargetAt(drag.x, drag.y);
        const from = slotOf(drag.id);
        if (target && target.dataset.drop === 'slot') {
          const to = +target.dataset.slot;
          if (from >= 0 && from !== to) swapSlots(from, to);
          else if (from < 0) placeInSlot(drag.id, to);
        } else if (target && target.dataset.drop === 'pool' && from >= 0) {
          removePick(from);
        }
      }
    }
    drag = null;
  }

  function bindDrag() {
    document.addEventListener('pointerdown', e => {
      if (e.button > 0 || e.target.closest('[data-nodrag]')) return;
      const src = e.target.closest('#tab-pick [data-drag]');
      if (!src) return;
      drag = { src, id: +src.dataset.cid, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, type: e.pointerType, active: false, timer: null };
      if (e.pointerType !== 'mouse') drag.timer = setTimeout(startDrag, 300);
    });
    document.addEventListener('pointermove', e => {
      if (!drag) return;
      drag.x = e.clientX; drag.y = e.clientY;
      const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
      if (!drag.active) {
        if (drag.type === 'mouse' && dist > 6) startDrag();
        else if (drag.type !== 'mouse' && dist > 10) { clearTimeout(drag.timer); drag = null; }
        return;
      }
      moveGhost(e.clientX, e.clientY);
      clearOver();
      const t = dropTargetAt(e.clientX, e.clientY);
      if (t) t.classList.add('drop-over');
      // défilement automatique près des bords
      const edge = 60;
      if (e.clientY < edge) window.scrollBy(0, -12);
      else if (e.clientY > innerHeight - edge) window.scrollBy(0, 12);
    });
    document.addEventListener('pointerup', () => endDrag(true));
    document.addEventListener('pointercancel', () => endDrag(false));
    document.addEventListener('touchmove', e => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', e => { if (e.target.closest('#tab-pick [data-drag]')) e.preventDefault(); });
  }

  /* ---------- Compte à rebours ---------- */
  function renderCountdown() {
    const el = $('#countdown');
    const ms = ELECTION - Date.now();
    const days = Math.ceil(ms / 864e5);
    if (ms > 864e5) el.textContent = `J-${days}`;
    else if (ms > 0) el.textContent = 'C’est ce soir, 21 h 10';
    else if (ms > -6 * 3600e3) el.textContent = 'En direct sur TF1';
    else el.textContent = 'L’élection a eu lieu';
  }


  /* ---------- Démarrage ---------- */
  const CANDS_PATH = 'data/candidates_2027.json';
  // L'organisateur lit directement le dépôt (toujours à jour) ; les autres lisent le site publié
  const loadShared = path => GH.isAdmin ? GH.readJSON(path).catch(() => getJSON(path)) : getJSON(path);

  async function reloadShared() {
    const [players, res, cands] = await Promise.all([
      loadShared('players.json').catch(() => null),
      loadShared('results.json').catch(() => null),
      GH.isAdmin ? loadShared(CANDS_PATH).catch(() => null) : null
    ]);
    let changed = false;
    const p = normPlayers(players);
    if (JSON.stringify(p) !== JSON.stringify(state.players)) { state.players = p; changed = true; }
    if (JSON.stringify(res) !== JSON.stringify(state.results)) { state.results = res; changed = true; }
    if (Array.isArray(cands)) cands.forEach(c => {
      const cur = cand(c.id);
      if (cur && cur.photo_url !== c.photo_url) { cur.photo_url = c.photo_url; changed = true; }
    });
    return changed;
  }

  async function init() {
    try {
      const [cands, winners, recent] = await Promise.all([
        loadShared(CANDS_PATH),
        getJSON('data/winners_1920_2026.json'),
        getJSON('data/recent_placements_2022_2026.json')
      ]);
      state.cands = cands;
      cands.forEach(c => state.byId.set(c.id, c));
      state.winners = winners.winners || [];
      state.replacements = winners.replacements || [];
      state.recent = recent;
    } catch (err) {
      $('main').innerHTML = `<div class="status none"><div><b>Impossible de charger les données</b>
        <p>Ouvrez l’app depuis GitHub Pages ou un petit serveur local (<code>python3 -m http.server</code>) : un fichier ouvert directement ne peut pas lire les JSON.</p>
        <p class="muted small">${esc(err.message)}</p></div></div>`;
      return;
    }
    await reloadShared();
    state.picks = sanitizePicks(load(LS.picks, []));
    state.name = load(LS.name, '');
    try { localStorage.removeItem('mf27.players'); localStorage.removeItem('mf27.results'); } catch { /* ancienne version */ }

    buildPickTab(); buildCandsTab(); buildRankTab();
    state.tab = load(LS.tab, 'pick');
    applyAdminMode();
    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange);
    $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
    bindDrag();
    renderCountdown();
    setInterval(renderCountdown, 60e3);
    // Classement et résultats relus régulièrement (utile le soir de l'élection)
    setInterval(async () => {
      if (document.visibilityState !== 'visible' || drag) return;
      if (await reloadShared()) { renderBoard(); renderPool(); renderShare(); renderCandList(); renderRanking(); if (state.tab !== 'admin') renderAdmin(); }
    }, 60e3);
    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  init();
})();
