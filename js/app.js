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
  const LS = { picks: 'mf27.picks', name: 'mf27.name', tab: 'mf27.tab', oddsW: 'mf27.oddsW', editKey: 'mf27.editKey', savedAs: 'mf27.savedAs' };
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
    camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
    insta: svg('<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>'),
    study: svg('<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'),
    link: svg('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"/>'),
    down: svg('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>'),
    back: svg('<path d="m15 18-6-6 6-6"/>'),
    chev: svg('<path d="m6 9 6 6 6-6"/>'),
    sort: svg('<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>'),
    crownFill: '<svg viewBox="0 0 24 24" fill="#E7CF96" stroke="#7E5E1A" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true" class="crown-fill"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/></svg>',
    pencil: svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>')
  };


  /* ---------- État ---------- */
  const state = {
    cands: [], byId: new Map(), winners: [], replacements: [], recent: {},
    results: null, players: [], photoPreview: {},
    picks: Array(12).fill(null), name: '', selected: null, tab: 'pick', sort: 'region', query: '',
    poolFilter: 'all', candFilter: 'all', ficheRank: 0, ficheFor: null,
    instagram: null, oddsW: 0.5, rankView: 'rank', filePlayers: [], dbPlayers: []
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
    const src = state.photoPreview[`${c.id}:portrait`] || c.photo_thumb || c.photo_url;
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
    refreshFicheCta();
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
  // Un pronostic du classement est « le mien » s'il porte mon pseudo ET que cet appareil l'a enregistré
  // (ou qu'il est identique au mien) : un homonyme sur un autre appareil n'est pas moi.
  const isMe = p => !!state.name.trim() && norm(p.name) === norm(state.name)
    && (p.code === encIds(state.picks) || norm(load(LS.savedAs, '')) === norm(p.name) || GH.isAdmin && !p.db);
  function myStatus() {
    if (!isComplete() || !state.name.trim()) return 'incomplete';
    const code = encIds(state.picks);
    const mine = state.players.find(isMe);
    if (mine) return mine.code === code ? 'ok' : 'outdated';
    return 'missing';
  }

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
    state.filePlayers = normPlayers(data); mergePlayers();
    renderAll();
    const parts = [sum.added && `${sum.added} ajouté${sum.added > 1 ? 's' : ''}`, sum.updated && `${sum.updated} mis à jour`].filter(Boolean);
    if (parts.length) setTimeout(() => toast(parts.join(' · ') + ' ✓', 3000), 1500);
  }

  async function removePlayer(name) {
    const data = await adminWrite('Classement', () => GH.updateJSON('players.json',
      cur => ({ players: normPlayers(cur).filter(p => p.name !== name) }), `Classement : retire ${name}`)).catch(() => null);
    if (data) { state.filePlayers = normPlayers(data); mergePlayers(); renderAll(); }
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

  // Deux photos par candidate : le portrait (photo_url, + miniature photo_thumb) et la photo en pied (photo_full)
  const PHOTO = {
    portrait: { field: 'photo_url', label: 'Portrait', suffix: '' },
    full: { field: 'photo_full', label: 'Photo en pied', suffix: '-pied' }
  };
  const photoSrc = (c, kind = 'portrait') => state.photoPreview[`${c.id}:${kind}`] || c[PHOTO[kind].field];
  const isRepoPhoto = p => typeof p === 'string' && /^photos\//.test(p);

  async function uploadPhoto(id, file, kind = 'portrait') {
    const c = cand(id);
    const { field, label, suffix } = PHOTO[kind];
    let img;
    try { img = await fileToJpeg(file, kind === 'full' ? 1100 : 900); } catch (e) { toast(e.message, 4000); return; }
    const path = `photos/${slugify(c.region_en)}${suffix}-${Date.now().toString(36)}.jpg`;
    const old = c[field];
    const oldThumb = kind === 'portrait' ? c.photo_thumb : null;
    const key = `${id}:${kind}`;
    state.photoPreview[key] = img.dataUrl;
    refreshPhotos(id);
    try {
      await adminWrite(`${label} de Miss ${c.region}`, async () => {
        await GH.putBinary(path, img.b64, `${label} : Miss ${c.region}`);
        // un nouveau portrait remplace aussi la miniature (l'app recadre alors le portrait)
        const patch = kind === 'portrait' ? { photo_url: path, photo_thumb: null } : { [field]: path };
        await GH.updateJSON(CANDS_PATH, cur => cur.map(x => x.id === id ? { ...x, ...patch } : x), `${label} : Miss ${c.region} (fiche)`);
        for (const f of [old, oldThumb]) if (isRepoPhoto(f)) await GH.deleteFile(f, `${label} : retire l’ancienne de Miss ${c.region}`).catch(() => {});
      });
      c[field] = path;
      if (kind === 'portrait') c.photo_thumb = null;
    } catch {
      delete state.photoPreview[key];
    }
    refreshPhotos(id);
  }

  async function removePhoto(id, kind = 'portrait') {
    const c = cand(id);
    const { field, label } = PHOTO[kind];
    const key = `${id}:${kind}`;
    const old = c[field];
    const oldThumb = kind === 'portrait' ? c.photo_thumb : null;
    if (!old && !state.photoPreview[key]) return;
    if (!confirm(`Retirer : ${label.toLowerCase()} de Miss ${c.region} ?`)) return;
    try {
      await adminWrite(`${label} de Miss ${c.region}`, async () => {
        const patch = kind === 'portrait' ? { photo_url: null, photo_thumb: null } : { [field]: null };
        await GH.updateJSON(CANDS_PATH, cur => cur.map(x => x.id === id ? { ...x, ...patch } : x), `${label} : retire Miss ${c.region}`);
        for (const f of [old, oldThumb]) if (isRepoPhoto(f)) await GH.deleteFile(f, `${label} : supprime Miss ${c.region}`).catch(() => {});
      });
      c[field] = null;
      if (kind === 'portrait') c.photo_thumb = null;
      delete state.photoPreview[key];
    } catch { /* message déjà affiché */ }
    refreshPhotos(id);
  }

  /* ---------- Modifier une fiche candidate ---------- */
  const EDIT_FIELDS = [
    { key: 'name', label: 'Prénom et nom', type: 'text' },
    { key: 'region', label: 'Région (affichée)', type: 'text' },
    { key: 'age', label: 'Âge', type: 'number' },
    { key: 'height_m', label: 'Taille (m)', type: 'text' },
    { key: 'hometown', label: 'Ville', type: 'text' },
    { key: 'occupation', label: 'Études / métier', type: 'text' },
    { key: 'instagram', label: 'Instagram (pseudo, facultatif)', type: 'text' }
  ];

  function openEditor(id) {
    const c = cand(id);
    const sheet = $('#sheet');
    sheet.dataset.cid = '';
    sheet.innerHTML = `<div class="sheet-inner">
        <button class="sheet-close" data-action="close-sheet" aria-label="Fermer">${ICON.x}</button>
        <p class="eyebrow">Modifier la fiche</p>
        <h2 id="sheet-title">Miss ${esc(c.region)}</h2>
        <div class="edit-grid">${EDIT_FIELDS.map(f => `
          <label class="field"><span class="field-label">${f.label}</span>
            <input data-field="${f.key}" type="${f.type}" ${f.type === 'number' ? 'inputmode="numeric" min="15" max="60"' : ''} ${f.key === 'height_m' ? 'inputmode="decimal" placeholder="1,75"' : ''}
              value="${esc(f.key === 'height_m' && c.height_m ? String(c.height_m).replace('.', ',') : c[f.key] ?? '')}"></label>`).join('')}
        </div>
        <p id="editErr" class="err" role="alert"></p>
        <div class="sheet-actions">
          <button class="btn primary" data-action="save-cand" data-cid="${id}">Publier les modifications</button>
          <button class="btn ghost" data-action="info" data-cid="${id}">Annuler</button>
        </div>
      </div>`;
    showSheet();
  }

  async function saveEditor(id) {
    const val = k => ($(`#sheet [data-field="${k}"]`).value || '').replace(/\s+/g, ' ').trim();
    const patch = { name: val('name'), region: val('region'), hometown: val('hometown') };
    const err = m => { $('#editErr').textContent = m; };
    if (!patch.name) return err('Le nom est obligatoire');
    if (!patch.region) return err('La région est obligatoire');
    const age = Number(val('age'));
    if (!Number.isInteger(age) || age < 15 || age > 60) return err('Âge invalide');
    let h = Number(val('height_m').replace(',', '.').replace(/\s*m$/i, ''));
    if (h > 100) h = h / 100; // « 176 » → 1,76
    if (!(h >= 1.4 && h <= 2.1)) return err('Taille invalide (ex. 1,75)');
    patch.age = age;
    patch.height_m = Math.round(h * 100) / 100;
    patch.instagram = instaHandle({ instagram: val('instagram') }) || null;
    patch.occupation = val('occupation') || null;
    const btn = $('[data-action="save-cand"]');
    btn.disabled = true;
    try {
      await adminWrite(`Fiche de Miss ${patch.region}`, () => GH.updateJSON(CANDS_PATH,
        cur => cur.map(x => x.id === id ? { ...x, ...patch } : x), `Fiche : Miss ${patch.region}`));
      Object.assign(cand(id), patch);
      renderAll();
      openFiche(id);
    } catch { btn.disabled = false; }
  }

  function refreshPhotos(id) {
    renderBoard(); renderPool(); renderCandList(); renderRanking(); renderAdmin();
    const sheet = $('#sheet');
    if (sheet.open && sheet.dataset.cid === String(id)) openFiche(id, true);
  }


  /* ---------- Base Supabase : chacun enregistre son pronostic ---------- */
  // Clé publique (faite pour être visible) : les règles de la base protègent les données.
  const SUPABASE = { url: 'https://czvrergmbjapigluzjzv.supabase.co', key: 'sb_publishable_1wyggs8slK3spRgDoNkzOQ_ILNyDPxc' };
  const isClosed = () => Date.now() >= ELECTION.getTime();

  // Clé secrète de cet appareil : prouve que c'est bien l'auteur qui modifie son pronostic
  function editKey() {
    let k = load(LS.editKey, null);
    if (typeof k !== 'string' || k.length < 20) {
      const b = new Uint8Array(24);
      crypto.getRandomValues(b);
      k = btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      save(LS.editKey, k);
    }
    return k;
  }

  async function fetchDbPlayers() {
    const r = await fetch(`${SUPABASE.url}/rest/v1/pronostics?select=pseudo,code,updated_at&order=created_at.asc`, {
      headers: { apikey: SUPABASE.key }, cache: 'no-store'
    });
    if (!r.ok) throw new Error(`Base indisponible (${r.status})`);
    const rows = await r.json();
    return rows.filter(x => x && typeof x.pseudo === 'string' && validPickCode(x.code))
      .map(x => ({ name: x.pseudo.trim(), code: x.code, updated: x.updated_at, db: true }));
  }

  // Classement = pronostics de la base + anciens liens ajoutés par l'organisateur (players.json)
  function mergePlayers() {
    const byName = new Map();
    state.filePlayers.forEach(p => byName.set(norm(p.name), p));
    state.dbPlayers.forEach(p => byName.set(norm(p.name), p)); // la base fait foi pour un même pseudo
    state.players = [...byName.values()];
  }

  let saving = false;
  async function saveToDb() {
    if (saving) return;
    if (isClosed()) { toast('Les pronostics sont clos depuis le début de l’émission', 4000); return; }
    if (!isComplete()) { toast('Complétez d’abord vos 12 candidates'); return; }
    const name = state.name.trim();
    if (!name) { toast('Ajoutez votre pseudo'); $('#nameInput').focus(); return; }
    saving = true;
    renderShare();
    try {
      const r = await fetch(`${SUPABASE.url}/rest/v1/rpc/save_pronostic`, {
        method: 'POST',
        headers: { apikey: SUPABASE.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_pseudo: name, p_code: encIds(state.picks), p_key: editKey() })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message || `Enregistrement impossible (${r.status})`);
      save(LS.savedAs, name);
      toast(j.action === 'modifie' ? 'Pronostic mis à jour ✓' : 'Pronostic enregistré ✓ Vous êtes dans le classement', 3500);
      try { state.dbPlayers = await fetchDbPlayers(); } catch { state.dbPlayers = state.dbPlayers.filter(p => norm(p.name) !== norm(name)).concat({ name, code: encIds(state.picks), db: true }); }
      mergePlayers();
    } catch (e) {
      toast(e.message === 'Failed to fetch' ? 'Pas de connexion : réessayez dans un instant' : e.message, 5000);
    } finally {
      saving = false;
      renderShare(); renderRanking();
    }
  }

  // Lien personnel : rouvre le pronostic ET sa clé sur un autre appareil (à ne pas partager)
  const ownLink = () => `${baseUrl()}#p=${encIds(state.picks)}&n=${encodeURIComponent(state.name.trim())}&k=${encodeURIComponent(editKey())}`;

  /* ---------- Rendu : Mon pronostic ---------- */
  function buildPickTab() {
    $('#tab-pick').innerHTML = `
      <section class="pick-head">
        <div class="title-row">
          <h1 class="h1">Mon Top 12</h1>
          <span id="progress" class="count"></span>
        </div>
        <div class="bar" aria-hidden="true"><span id="progressBar"></span></div>
        <label class="pseudo">
          <span>Pseudo</span>
          <input id="nameInput" type="text" maxlength="40" autocomplete="nickname" placeholder="Votre prénom" value="${esc(state.name)}">
        </label>
      </section>
      <section id="board" class="podium" aria-label="Mon podium"></section>
      <div id="hint" class="hint" role="status"></div>
      <div class="row-actions center">
        <button class="btn ghost small" data-action="random">${ICON.shuffle}Compléter au hasard</button>
        <button class="btn ghost small" data-action="clear">${ICON.trash}Tout effacer</button>
      </div>
      <div id="share"></div>
      <div class="pool-head">
        <h2 class="h2">Les 31 candidates</h2>
        <div class="seg" role="group" aria-label="Filtrer">
          <button data-action="pool-filter" data-f="all">Toutes</button>
          <button data-action="pool-filter" data-f="free">Libres</button>
        </div>
      </div>
      <div id="pool" class="pool" data-drop="pool"></div>`;
    $('#nameInput').addEventListener('input', e => {
      state.name = e.target.value;
      save(LS.name, state.name);
      renderShare(); renderRanking();
    });
  }

  const PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;

  function slotHTML(i) {
    const id = state.picks[i];
    const c = id && cand(id);
    const kind = i === 0 ? 'miss' : i <= 4 ? 'dau' : 'top';
    const sel = state.selected === i;
    const cls = ['slot', `slot-${kind}`, c ? 'filled' : 'empty', sel ? 'selected' : ''].join(' ');
    const aria = c ? `${SLOT_LABELS[i]} : ${c.region}, ${c.name}` : `${SLOT_LABELS[i]} : à choisir`;
    const circle = c ? avatar(c, kind === 'miss' ? 'l' : kind === 'dau' ? 'm' : 's') : `<span class="slot-plus">${PLUS}</span>`;
    let inner;
    if (kind === 'miss') {
      inner = `${circle}<span class="slot-txt">
          <span class="slot-label">${ICON.crown}Miss France 2027</span>
          <span class="slot-region">${c ? esc(c.region) : 'À choisir'}</span>
          <span class="slot-name">${c ? esc(c.name) : 'Touchez une candidate ci-dessous'}</span>
        </span>`;
    } else if (kind === 'dau') {
      inner = `<span class="slot-circle">${circle}<span class="rank-badge">${SHORT_DAU[i]}</span></span>
        <span class="slot-region">${c ? esc(c.region) : 'À choisir'}</span>`;
    } else {
      inner = circle;
    }
    return `<div class="${cls}" data-drop="slot" data-slot="${i}" ${c ? `data-drag data-cid="${id}"` : ''}>
        <button class="slot-main" data-action="slot" data-slot="${i}" aria-label="${esc(aria)}" aria-pressed="${sel}">${inner}</button>
      </div>`;
  }
  const SHORT_DAU = { 1: '1re', 2: '2e', 3: '3e', 4: '4e' };

  function renderBoard() {
    const b = $('#board');
    if (!b) return;
    b.innerHTML = `
      ${slotHTML(0)}
      <div class="tier-title dau">Dauphines</div>
      <div class="tier tier-dau">${[1, 2, 3, 4].map(slotHTML).join('')}</div>
      <div class="tier-title">Reste du Top 12 <small>· ordre libre</small></div>
      <div class="tier tier-top">${[5, 6, 7, 8, 9, 10, 11].map(slotHTML).join('')}</div>`;
    const n = pickCount();
    $('#progress').innerHTML = `<b>${n}</b> / 12`;
    $('#progressBar').style.width = `${Math.round(n / 12 * 100)}%`;
    const hint = $('#hint');
    const sel = state.selected;
    if (sel != null) {
      const c = state.picks[sel] && cand(state.picks[sel]);
      hint.className = 'hint active';
      hint.innerHTML = c
        ? `<span><b>${SLOT_LABELS[sel]} : ${esc(c.region)}.</b> Touchez une autre case pour échanger, ou une candidate pour la remplacer.</span>
           <button class="btn small" data-action="unpick" data-slot="${sel}">${ICON.x}Retirer</button>`
        : `${ICON.down}<span>Choisissez votre <b>${SLOT_LABELS[sel].toLowerCase().replace('miss france 2027', 'Miss France')}</b> ci-dessous</span>`;
    } else {
      hint.className = 'hint';
      hint.textContent = n === 12
        ? 'Top 12 complet ! Touchez deux cases pour les échanger, ou glissez-déposez.'
        : 'Touchez une candidate pour la placer dans la prochaine case libre, ou une case pour la choisir. Appui long pour glisser-déposer.';
    }
  }

  function renderPool() {
    const p = $('#pool');
    if (!p) return;
    document.querySelectorAll('#tab-pick .seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === state.poolFilter)));
    const list = state.cands.filter(c => state.poolFilter !== 'free' || slotOf(c.id) < 0);
    p.innerHTML = list.map(c => {
      const s = slotOf(c.id);
      return `<div class="tile ${s >= 0 ? 'is-picked' : ''}" data-drag data-cid="${c.id}">
          <button class="tile-main" data-action="pool" data-cid="${c.id}" aria-label="${esc(c.region)}, ${esc(c.name)}${s >= 0 ? ' (' + SLOT_LABELS[s] + ', toucher pour retirer)' : ''}">
            <span class="tile-photo">${tilePhoto(c)}${s >= 0 ? `<span class="badge ${s === 0 ? 'gold' : s <= 4 ? 'rose' : ''}">${SHORT[s]}</span>` : ''}</span>
            <span class="sash">${esc(c.region)}</span>
            <span class="tile-name">${esc(c.name)}</span>
          </button>
          <button class="tile-info" data-action="info" data-cid="${c.id}" data-nodrag aria-label="Fiche de ${esc(c.name)}">${ICON.info}</button>
        </div>`;
    }).join('') || '<p class="empty-msg">Toutes les candidates sont placées.</p>';
  }

  function tilePhoto(c) {
    const src = state.photoPreview[`${c.id}:portrait`] || c.photo_thumb || c.photo_url;
    const hue = (c.id * 47) % 360;
    return `<span class="tile-ph" style="--h:${hue}">${esc(initials(c.name))}</span>${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ''}`;
  }

  function renderShare() {
    renderActionBar();
    const el = $('#share');
    if (!el) return;
    if (!isComplete() || !state.name.trim()) { el.innerHTML = ''; return; }
    const st = myStatus();
    const msg = isClosed()
      ? 'Les pronostics sont clos depuis le début de l’émission.'
      : {
        ok: '✓ Votre pronostic est enregistré et compte dans le classement. Vous pouvez le modifier jusqu’au 12 décembre 21 h 10 : changez votre Top 12 puis enregistrez à nouveau.',
        outdated: 'Vous avez modifié votre Top 12 : enregistrez-le pour mettre à jour le classement.',
        missing: 'Enregistrez votre pronostic pour entrer dans le classement. Vous pourrez le modifier jusqu’au début de l’émission.'
      }[st];
    el.innerHTML = `<div class="share-box ${st === 'ok' ? 'ok' : ''}">
        <div class="share-top">${st === 'ok' ? ICON.crown : ICON.share}<div><b>${st === 'ok' ? 'Pronostic enregistré' : 'Mon pronostic'}</b><p>${msg}</p></div></div>
        <div class="row-actions">
          ${st !== 'ok' && !isClosed() ? `<button class="btn primary" data-action="save-db" ${saving ? 'disabled' : ''}>${saving ? 'Enregistrement…' : st === 'outdated' ? 'Enregistrer les modifications' : 'Enregistrer mon pronostic'}</button>` : ''}
          <button class="btn ghost" data-action="copy-link">${ICON.copy}Partager mon Top 12</button>
        </div>
        ${st !== 'missing' ? `<details class="more own-link">
            <summary>Modifier depuis un autre appareil</summary>
            <p class="muted small">Ouvrez ce lien personnel sur votre autre téléphone ou ordinateur. Il contient votre clé de modification : <b>ne l’envoyez à personne</b>.</p>
            <button class="btn small" data-action="copy-own-link">${ICON.copy}Copier mon lien personnel</button>
          </details>` : ''}
      </div>`;
  }

  // Barre d'action fixe au-dessus des onglets (écran « Mon pronostic »)
  function renderActionBar() {
    const el = $('#actionbar');
    if (!el) return;
    const n = pickCount();
    let txt, btn;
    if (isClosed()) {
      txt = 'Pronostics clos · place au direct !';
      btn = `<button class="btn ghost" data-action="tab" data-tab="rank">Classement</button>`;
    } else if (n < 12) {
      txt = `Encore <b>${12 - n} choix</b> avant d’enregistrer`;
      btn = `<button class="btn primary" disabled>Enregistrer</button>`;
    } else if (!state.name.trim()) {
      txt = 'Ajoutez votre <b>pseudo</b> pour enregistrer';
      btn = `<button class="btn primary" data-action="focus-name">Pseudo</button>`;
    } else {
      const st = myStatus();
      txt = st === 'ok' ? '✓ Enregistré · modifiable jusqu’au 12/12 21 h 10' : st === 'outdated' ? 'Top 12 modifié depuis l’enregistrement' : 'Pronostic complet !';
      btn = st === 'ok'
        ? `<button class="btn ghost" data-action="copy-link">${ICON.copy}Partager</button>`
        : `<button class="btn primary" data-action="save-db" ${saving ? 'disabled' : ''}>${saving ? 'Enregistrement…' : st === 'outdated' ? 'Mettre à jour' : 'Enregistrer'}</button>`;
    }
    el.innerHTML = `<span class="ab-txt">${txt}</span>${btn}`;
  }

  /* ---------- Rendu : Candidates ---------- */
  const OUTRE_MER = ['Guadeloupe', 'Martinique', 'French Guiana', 'Réunion', 'Mayotte', 'New Caledonia', 'Tahiti', 'Saint Barthélemy'];
  const CAND_FILTERS = {
    all: { label: 'Toutes', test: () => true },
    mine: { label: 'Mon Top 12', test: c => slotOf(c.id) >= 0 },
    om: { label: 'Outre-mer', test: c => OUTRE_MER.includes(c.region_en) },
    never: { label: 'Jamais titrées', test: c => !c.past_titles }
  };

  function buildCandsTab() {
    $('#tab-cands').innerHTML = `
      <h1 class="h1 page-title">Les 31 candidates</h1>
      <label class="search">${ICON.search}<input id="q" type="search" placeholder="Région, nom, ville, métier…" aria-label="Rechercher une candidate"></label>
      <div id="candFilters" class="chips-row" role="group" aria-label="Filtres"></div>
      <div class="sort-row">
        <span id="candCount" class="muted small"></span>
        <label class="sort">${ICON.sort}<span class="sr">Trier</span>
          <select id="sort" aria-label="Trier">
            <option value="region">Région A→Z</option>
            <option value="titles">Palmarès de la région</option>
            <option value="last">Dernière victoire</option>
            <option value="age">Âge</option>
            <option value="height">Taille</option>
            <option value="name">Prénom</option>
          </select>
        </label>
      </div>
      <div id="candList" class="cgrid"></div>`;
    $('#q').addEventListener('input', e => { state.query = e.target.value; renderCandList(); });
    $('#sort').value = state.sort;
    $('#sort').addEventListener('change', e => { state.sort = e.target.value; renderCandList(); });
  }

  function renderCandList() {
    const el = $('#candList');
    if (!el) return;
    $('#candFilters').innerHTML = Object.entries(CAND_FILTERS).map(([k, f]) =>
      `<button class="fchip" data-action="cand-filter" data-f="${k}" aria-pressed="${state.candFilter === k}">${f.label} <span>${state.cands.filter(f.test).length}</span></button>`).join('');
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
      .filter(CAND_FILTERS[state.candFilter].test)
      .filter(c => !q || norm([c.region, c.region_en, c.name, c.hometown, c.occupation].join(' ')).includes(q))
      .sort(sorters[state.sort]);
    $('#candCount').textContent = `${list.length} candidate${list.length > 1 ? 's' : ''}`;
    if (!list.length) { el.innerHTML = '<p class="empty-msg">Aucune candidate ne correspond.</p>'; return; }
    el.innerHTML = list.map(c => {
      const s = slotOf(c.id);
      const src = photoOf(c);
      const hue = (c.id * 47) % 360;
      return `<button class="ccard" data-action="info" data-cid="${c.id}">
          <span class="ccard-photo"><span class="tile-ph" style="--h:${hue}">${esc(initials(c.name))}</span>${src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()">` : ''}
            ${s >= 0 ? `<span class="badge ${s === 0 ? 'gold' : s <= 4 ? 'rose' : ''}">${SHORT[s]}</span>` : ''}</span>
          <span class="sash">${esc(c.region)}</span>
          <span class="ccard-name">${esc(c.name)}</span>
          <span class="ccard-meta">${c.age} ans · ${heightTxt(c.height_m)}</span>
          <span class="ccard-titles">${c.past_titles ? `${ICON.crown}${c.past_titles} titre${c.past_titles > 1 ? 's' : ''} · ${c.last_title_year}` : 'Jamais titrée'}</span>
        </button>`;
    }).join('');
  }

  /* ---------- Fiche candidate ---------- */
  const instaHandle = c => String(c.instagram || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
  const instaUrl = c => `https://www.instagram.com/${encodeURIComponent(instaHandle(c))}/`;

  const photoOf = c => photoSrc(c, 'portrait');
  const RANK_CHIPS = ['Miss', '1re', '2e', '3e', '4e', 'Top 12'];
  const RANK_NAMES = ['Miss France', '1re dauphine', '2e dauphine', '3e dauphine', '4e dauphine', 'Top 12'];
  const slotToChip = s => (s <= 4 ? s : 5);

  // Case visée par un choix de rang dans la fiche (5 = première case libre du Top 12)
  function targetSlot(id, r) {
    if (r <= 4) return r;
    const s = slotOf(id);
    if (s >= 5) return s;
    for (let i = 5; i < 12; i++) if (!state.picks[i]) return i;
    return -1;
  }

  function defaultChip(id) {
    const s = slotOf(id);
    if (s >= 0) return slotToChip(s);
    const free = state.picks.indexOf(null);
    return free < 0 ? 5 : slotToChip(free);
  }

  function ficheCtaHTML(c) {
    const id = c.id;
    const r = state.ficheRank;
    const s = slotOf(id);
    const chips = RANK_CHIPS.map((l, i) => {
      const occupied = i <= 4 ? !!state.picks[i] && state.picks[i] !== id : state.picks.slice(5).every(Boolean) && s < 5;
      return `<button class="rchip ${i === 0 ? 'is-miss' : ''} ${occupied ? 'taken' : ''}" data-action="fiche-rank" data-r="${i}" aria-pressed="${r === i}">${l}</button>`;
    }).join('');
    let cta;
    const t = targetSlot(id, r);
    if (s >= 0 && slotToChip(s) === r) {
      cta = `<button class="btn ghost wide" data-action="sheet-unpick" data-cid="${id}">${ICON.x}Retirer de mon pronostic (${SLOT_LABELS[s]})</button>`;
    } else if (t < 0) {
      cta = `<button class="btn primary wide" disabled>Top 12 complet : choisissez un rang</button>`;
    } else {
      const occ = state.picks[t] && cand(state.picks[t]);
      cta = `<button class="btn primary wide" data-action="fiche-place" data-cid="${id}">${occ ? `Remplacer ${esc(occ.region)} · ${RANK_NAMES[r]}` : `Placer en ${RANK_NAMES[r]}`}</button>`;
    }
    const first = c.name.split(' ')[0];
    return `<p class="cta-title">${s >= 0 ? `${esc(first)} est dans votre pronostic : <b>${SLOT_LABELS[s]}</b>` : `Placer ${esc(first)} dans mon pronostic`}</p>
      <div class="rchips" role="group" aria-label="Rang">${chips}</div>${cta}`;
  }

  function openFiche(id, keepRank) {
    const c = cand(id);
    if (!c) return;
    if (!keepRank || state.ficheFor !== id) { state.ficheRank = defaultChip(id); state.ficheFor = id; }
    const titles = titlesFor(c);
    const repl = titles.filter(t => t.repl).length;
    const recent = recentFor(c);
    const photo = photoOf(c);
    const shots = [['portrait', 'Portrait'], ['full', 'En pied']].map(([k, l]) => [photoSrc(c, k), l]).filter(([src]) => src);
    const lastRecent = recent.filter(x => x.label);
    const sheet = $('#sheet');
    sheet.dataset.cid = String(id);
    sheet.innerHTML = `
      <div class="fiche-scroll">
        <div class="fiche-photo ${shots.length ? '' : 'no-photo'}">
          ${shots.length ? `<div class="gallery" tabindex="0" aria-label="Photos officielles de ${esc(c.name)}">${shots.map(([src, l], i) => `<figure class="${i ? 'whole' : ''}" style="--bg:url('${esc(new URL(src, location.href).href)}')"><img src="${esc(src)}" alt="${esc(c.name)}, ${l.toLowerCase()}" ${i ? 'loading="lazy"' : ''} onerror="this.parentNode.remove()"></figure>`).join('')}</div>`
            : avatar(c, 'xl')}
          <div class="fiche-top">
            <button class="round-btn" data-action="close-sheet" aria-label="Fermer la fiche">${ICON.back}</button>
            ${instaHandle(c) ? `<a class="round-btn insta-btn" href="${esc(instaUrl(c))}" target="_blank" rel="noopener" aria-label="Instagram de ${esc(c.name)} (@${esc(instaHandle(c))})">${ICON.insta}</a>` : ''}
          </div>
          ${shots.length > 1 ? `<div class="seg seg-dark gallery-dots" role="group" aria-label="Photo affichée">${shots.map(([, l], i) => `<button data-action="gallery" data-i="${i}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>` : ''}
        </div>
        <div class="fiche-body">
          <span class="sash big">Miss ${esc(c.region)}</span>
          <h2 id="sheet-title" class="fiche-name">${esc(c.name)}</h2>
          <p class="fiche-meta">${c.age} ans · ${heightTxt(c.height_m)} · ${esc(c.hometown)}</p>
          ${instaHandle(c) ? `<a class="insta" href="${esc(instaUrl(c))}" target="_blank" rel="noopener">${ICON.insta}@${esc(instaHandle(c))}${(() => { const sn = snapshots(); const n = followersOf(sn[sn.length - 1], c.id); return n ? ` · ${fmtK(n)} abonnés` : ''; })()}</a>` : ''}
          ${c.occupation ? `<p class="fiche-occ">${ICON.study}<span>${esc(c.occupation)}</span></p>` : ''}
          ${c.elected ? `<p class="muted small elected">${ICON.crown}${esc(c.elected)}${c.source_url ? ` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">portrait sur TV Mag ${ICON.link}</a>` : ''}</p>` : ''}
          ${GH.isAdmin ? `<div class="row-actions admin-row">
              <button class="btn small" data-action="edit-cand" data-cid="${id}">${ICON.pencil}Modifier la fiche</button>
              ${photoInput(id, photo ? 'Changer le portrait' : 'Ajouter un portrait')}
              ${photo ? `<button class="btn ghost small icon-only" data-action="photo-remove" data-cid="${id}" aria-label="Retirer le portrait">${ICON.trash}</button>` : ''}
              ${photoInput(id, photoSrc(c, 'full') ? 'Changer la photo en pied' : 'Ajouter une photo en pied', 'full')}
              ${photoSrc(c, 'full') ? `<button class="btn ghost small icon-only" data-action="photo-remove" data-kind="full" data-cid="${id}" aria-label="Retirer la photo en pied">${ICON.trash}</button>` : ''}
            </div>` : ''}
          <div class="facts">
            <div><span>Palmarès ${esc(c.region)}</span><b>${c.past_titles ? `${c.past_titles} titre${c.past_titles > 1 ? 's' : ''} · ${c.last_title_year}` : 'Jamais titrée'}</b></div>
            <div><span>5 dernières éditions</span><b>${lastRecent.length ? lastRecent.map(x => `${x.label} ${x.year}`).slice(0, 2).join(', ') : 'Pas de Top 12'}</b></div>
          </div>
          ${titles.length ? `<details class="more">
              <summary>Les ${titles.length} Miss France de la région${repl ? ` (dont ${repl} remplaçante${repl > 1 ? 's' : ''})` : ''}</summary>
              <ul class="titles">${titles.map(t => `<li${t.repl ? ' class="repl"' : ''}><b>${t.year}</b> ${esc(t.name)}${t.repl ? ' <small>remplaçante</small>' : ''}${regionKeys(c).length > 1 && t.region !== c.region_en ? ` <small>(${esc(fr(t.region))})</small>` : ''}</li>`).join('')}</ul>
            </details>` : ''}
          <div class="recent">${recent.map(r => `<div class="rec tier-${r.tier}"><span>${r.year}</span><b>${r.label || '—'}</b></div>`).join('')}</div>
        </div>
      </div>
      <div class="fiche-cta" id="ficheCta">${ficheCtaHTML(c)}</div>`;
    showSheet('fiche-sheet');
    bindGallery();
  }

  function refreshFicheCta() {
    const sheet = $('#sheet');
    const id = +sheet.dataset.cid;
    if (sheet.open && id && $('#ficheCta')) $('#ficheCta').innerHTML = ficheCtaHTML(cand(id));
  }

  function ficheSetRank(r) { state.ficheRank = r; refreshFicheCta(); }

  function fichePlace(id) {
    const r = state.ficheRank;
    const t = targetSlot(id, r);
    if (t < 0) return;
    const prev = slotOf(id);
    const occ = state.picks[t] && state.picks[t] !== id ? cand(state.picks[t]) : null;
    placeInSlot(id, t);
    const c = cand(id);
    toast(occ && prev >= 0 ? `${c.region} → ${SLOT_LABELS[t]} · ${occ.region} → ${SLOT_LABELS[prev]}`
      : occ ? `${c.region} → ${SLOT_LABELS[t]} (remplace ${occ.region})` : `${c.region} → ${SLOT_LABELS[t]}`);
    refreshFicheCta();
  }

  const photoInput = (id, label, kind = 'portrait') => `<label class="btn small file-btn">${ICON.camera}${label}<input type="file" accept="image/*" data-photo="${id}" data-kind="${kind}" hidden></label>`;

  function bindGallery() {
    const g = $('#sheet .gallery');
    if (!g) return;
    const dots = [...document.querySelectorAll('#sheet .gallery-dots button')];
    g.addEventListener('scroll', () => {
      const i = Math.round(g.scrollLeft / g.clientWidth);
      dots.forEach((d, k) => d.setAttribute('aria-pressed', String(k === i)));
    }, { passive: true });
  }

  function showSheet(cls = '') {
    const sheet = $('#sheet');
    sheet.className = cls;
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
      <h1 class="h1 page-title">Classement</h1>
      <div id="resStatus"></div>
      <div id="myNote"></div>
      <div id="rankSeg" class="seg rank-seg" role="group" aria-label="Affichage">
        <button data-action="rank-view" data-v="rank" aria-pressed="true">Classement</button>
        <button data-action="rank-view" data-v="all" aria-pressed="false">Tous les pronostics</button>
      </div>
      <div id="allView" hidden><div id="allPicks"></div></div>
      <div id="rankView">
      <div id="podiumRank"></div>
      <div id="lbHead" class="board-head"><h2 class="h2">Détail des pronostics</h2><span class="muted small">sur ${MAX_SCORE} pts</span></div>
      <div id="leaderboard" class="lb"></div>
      <section class="bareme" aria-label="Barème">
        <p class="label">Barème · ${MAX_SCORE} pts max</p>
        <div class="bchips">
          <span class="bchip gold">Miss exacte +${SCORING.miss}</span>
          <span class="bchip rose">Dauphine au bon rang +${SCORING.dauphine}</span>
          <span class="bchip blue">Top 12 bien placée +${SCORING.top12}</span>
          <span class="bchip">Qualifiée, autre rang +${SCORING.wrongRank}</span>
        </div>
        <details class="more">
          <summary>Comment sont comptés les points ?</summary>
          <ul>
            <li><b>${SCORING.miss} pts</b> pour la bonne Miss France.</li>
            <li><b>${SCORING.dauphine} pts</b> par dauphine au bon rang.</li>
            <li><b>${SCORING.top12} pts</b> par candidate choisie en 6e-12e, qualifiée dans le Top 12 sans entrer dans le Top 5.</li>
            <li><b>${SCORING.wrongRank} pt</b> par candidate qualifiée dans le Top 12 mais pas au bon rang.</li>
          </ul>
          <p class="muted small">Égalité départagée par le nombre de pronostics exacts. Pendant la soirée, les scores suivis d’un « ? » peuvent encore changer.</p>
        </details>
      </section>
      </div>`;
    setRankView(state.rankView);
  }

  function renderResStatus() {
    const el = $('#resStatus');
    if (!el) return;
    const R = results();
    const st = resultsStatus(R);
    document.body.classList.toggle('is-live', st === 'partial');
    if (st === 'none') {
      el.innerHTML = `<div class="status wait">${ICON.trophy}<div><b>Résultats le samedi 12 décembre</b><p>Le classement se mettra à jour en direct pendant la soirée sur TF1.</p></div></div>`;
      return;
    }
    const nDau = R.order.slice(1).filter(Boolean).length;
    const steps = [
      ['Top 12', R.top12.size >= 12 ? 1 : R.top12.size / 12],
      [`Dauphines ${nDau}/4`, nDau / 4],
      ['Miss', R.order[0] ? 1 : 0]
    ];
    const miss = R.order[0] && cand(R.order[0]);
    el.innerHTML = `<div class="status ${st}">
        ${miss ? `<div class="winner">${avatar(miss, 'l')}<div><span class="label gold-txt">Miss France 2027</span><b class="winner-name">${esc(miss.region)}</b><span class="muted small">${esc(miss.name)}</span></div></div>` : ''}
        <div class="steps-bar">${steps.map(([l, p]) => `<div class="${p >= 1 ? 'done' : p > 0 ? 'part' : ''}"><span class="sb"><span style="width:${Math.round(p * 100)}%"></span></span><span class="sl">${l}</span></div>`).join('')}</div>
        <p class="muted small">${st === 'final' ? 'Résultats définitifs.' : 'Scores provisoires, mis à jour à chaque annonce. <b class="amber">?</b> = peut encore changer.'}</p>
        ${R.unresolved.length && GH.isAdmin ? `<p class="muted small">Non reconnu dans results.json : ${R.unresolved.map(esc).join(', ')}</p>` : ''}
      </div>`;
  }

  function renderMyNote() {
    const el = $('#myNote');
    if (!el) return;
    const st = myStatus();
    const txt = {
      incomplete: isClosed() ? '' : 'Vous n’êtes pas encore dans le classement : faites votre Top 12 et enregistrez-le.',
      missing: isClosed() ? '' : 'Votre pronostic n’est pas encore enregistré : « Pronostic » → Enregistrer.',
      outdated: isClosed() ? '' : 'Votre Top 12 a changé depuis l’enregistrement : « Pronostic » → Mettre à jour.',
      ok: ''
    }[st];
    el.innerHTML = txt ? `<p class="note">${txt}</p>` : '';
  }

  const playerInitial = name => (String(name).trim()[0] || '?').toUpperCase();

  const openDetails = new Set();
  function renderRanking() {
    renderResStatus();
    renderMyNote();
    renderAllPicks();
    const el = $('#leaderboard');
    if (!el) return;
    const R = results();
    const entries = state.players.map(p => ({ ...p, ids: decIds(p.code), me: isMe(p) }))
      .map(e => ({ ...e, s: scorePicks(e.ids, R) }));
    const pod = $('#podiumRank');
    if (!entries.length) {
      pod.innerHTML = '';
      $('#lbHead').hidden = true;
      el.innerHTML = `<div class="empty-card">${ICON.trophy}<b>Personne pour l’instant</b><p>Les pronostics apparaissent ici dès qu’ils sont enregistrés.</p>
        ${isComplete() ? '' : '<button class="btn primary" data-action="tab" data-tab="pick">Faire mon pronostic</button>'}</div>`;
      return;
    }
    $('#lbHead').hidden = false;
    const started = resultsStatus(R) !== 'none';
    entries.sort((a, b) => started ? (b.s.total - a.s.total || b.s.exact - a.s.exact || a.name.localeCompare(b.name, 'fr')) : (b.me - a.me || a.name.localeCompare(b.name, 'fr')));
    let rank = 0, prev = null;
    entries.forEach((e, i) => {
      if (started) { const k = `${e.s.total}|${e.s.exact}`; if (k !== prev) rank = i + 1; prev = k; }
      e.rank = rank;
    });
    // Podium des 3 premiers une fois la soirée commencée
    if (started && entries.length >= 2) {
      const top = entries.slice(0, 3);
      const order = top.length === 3 ? [top[1], top[0], top[2]] : [top[1], top[0]];
      pod.innerHTML = `<div class="podium-rank">${order.map(e => `
          <div class="pr pr-${e.rank <= 3 ? e.rank : 3}">
            ${e.rank === 1 ? ICON.crownFill : ''}
            <span class="pr-av">${esc(playerInitial(e.name))}</span>
            <b>${esc(e.name)}${e.me ? ' <small>(moi)</small>' : ''}</b>
            <span class="pr-pts">${e.s.total} pts${e.s.pending ? ' <i class="amber">?</i>' : ''}</span>
            <span class="pr-step">${e.rank}</span>
          </div>`).join('')}</div>`;
    } else pod.innerHTML = '';
    el.innerHTML = entries.map(e => {
      const miss = cand(e.ids[0]);
      const key = `${e.name}|${e.code}`;
      return `<details class="lb-row ${e.me ? 'me' : ''}" data-key="${esc(key)}" ${openDetails.has(key) ? 'open' : ''}>
          <summary>
            <span class="lb-rank ${started && e.rank <= 3 ? 'r' + e.rank : ''}">${started ? e.rank : esc(playerInitial(e.name))}</span>
            <span class="lb-name">
              <span class="lb-line"><b>${esc(e.name)}${e.me ? ' <small>(moi)</small>' : ''}</b><small>${ICON.crown}${esc(miss.region)}</small></span>
              ${started ? `<span class="lb-bar"><span style="width:${Math.round(e.s.total / MAX_SCORE * 100)}%"></span></span>` : ''}
            </span>
            ${started ? `<span class="lb-score">${e.s.total}${e.s.pending ? '<i>?</i>' : ''}</span>` : `<span class="lb-chev">${ICON.chev}</span>`}
          </summary>
          ${picksListHTML(e.ids, started ? e.s : null)}
        </details>`;
    }).join('');
    el.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
      d.open ? openDetails.add(d.dataset.key) : openDetails.delete(d.dataset.key);
    }));
  }

  /* ---------- Classement : vue « Tous les pronostics » ---------- */
  function setRankView(v) {
    state.rankView = v;
    document.querySelectorAll('#rankSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    $('#rankView').hidden = v !== 'rank';
    $('#allView').hidden = v !== 'all';
  }

  function pickCircle(id, size, r) {
    const c = cand(id);
    const k = r ? ` k-${r.kind}` : '';
    return `<button class="pc-pick${k}" data-action="info" data-cid="${id}" aria-label="${esc(c.region)}, ${esc(c.name)}${r ? ' : ' + esc(r.label) : ''}">${avatar(c, size)}</button>`;
  }

  function renderAllPicks() {
    const el = $('#allPicks');
    if (!el) return;
    const R = results();
    const started = resultsStatus(R) !== 'none';
    const entries = state.players.map(p => ({ ...p, ids: decIds(p.code), me: isMe(p) }))
      .map(e => ({ ...e, s: scorePicks(e.ids, R) }))
      .sort((a, b) => b.me - a.me || a.name.localeCompare(b.name, 'fr'));
    if (!entries.length) {
      el.innerHTML = `<div class="empty-card">${ICON.crown}<b>Aucun pronostic enregistré</b><p>Ils apparaissent ici dès que chacun enregistre le sien.</p></div>`;
      return;
    }
    const n = entries.length;
    // La Miss du groupe : qui a été choisie, et par qui
    const miss = new Map();
    entries.forEach(e => { const id = e.ids[0]; if (!miss.has(id)) miss.set(id, []); miss.get(id).push(e.name); });
    const missRows = [...miss.entries()].sort((a, b) => b[1].length - a[1].length || cand(a[0]).region.localeCompare(cand(b[0]).region, 'fr'));
    // Les plus citées dans les Top 12
    const top = new Map();
    entries.forEach(e => e.ids.forEach(id => top.set(id, (top.get(id) || 0) + 1)));
    const topRows = [...top.entries()].sort((a, b) => b[1] - a[1] || cand(a[0]).region.localeCompare(cand(b[0]).region, 'fr')).slice(0, 8);
    el.innerHTML = `
      <section class="group card-block">
        <h2 class="h2">La Miss du groupe</h2>
        <p class="muted small">${n} pronostic${n > 1 ? 's' : ''} enregistré${n > 1 ? 's' : ''}</p>
        <div class="votes">${missRows.map(([id, names]) => {
          const c = cand(id);
          return `<button class="vote" data-action="info" data-cid="${id}">
              ${avatar(c, 's')}
              <span class="vote-main">
                <span class="vote-line"><b>${esc(c.region)}</b><span>${names.length} vote${names.length > 1 ? 's' : ''}</span></span>
                <span class="vote-bar"><span style="width:${Math.round(names.length / n * 100)}%"></span></span>
                <small>${names.map(esc).join(', ')}</small>
              </span>
            </button>`;
        }).join('')}</div>
        <h3>Les plus citées dans les Top 12</h3>
        <div class="cited">${topRows.map(([id, k]) => {
          const c = cand(id);
          return `<button class="cite" data-action="info" data-cid="${id}" aria-label="${esc(c.region)} : ${k} sur ${n}">${avatar(c, 's')}<span>${esc(c.region)}</span><b>${k}/${n}</b></button>`;
        }).join('')}</div>
      </section>
      <div class="pcards">${entries.map(e => {
        const r = i => started ? e.s.rows[i] : null;
        const m = cand(e.ids[0]);
        return `<article class="pcard2 ${e.me ? 'me' : ''}">
            <header><b>${esc(e.name)}${e.me ? ' <small>(moi)</small>' : ''}</b>${started ? `<span class="pc-score">${e.s.total}${e.s.pending ? '<i>?</i>' : ''} pts</span>` : ''}</header>
            <div class="pc-miss">${pickCircle(e.ids[0], 'l', r(0))}<span><span class="slot-label">${ICON.crown}Miss France</span><b>${esc(m.region)}</b><small>${esc(m.name)}</small></span></div>
            <div class="pc-dau">${[1, 2, 3, 4].map(i => `<span class="pc-d">${pickCircle(e.ids[i], 'm', r(i))}<span class="rank-badge">${SHORT_DAU[i]}</span><small>${esc(cand(e.ids[i]).region)}</small></span>`).join('')}</div>
            <div class="pc-top">${[5, 6, 7, 8, 9, 10, 11].map(i => pickCircle(e.ids[i], 's', r(i))).join('')}</div>
          </article>`;
      }).join('')}</div>`;
  }

  // Charger un pronostic reçu par lien dans « Mon pronostic » (pour le modifier sur un autre appareil)
  function adoptPick(code, name) {
    if (!validPickCode(code)) return;
    const ids = decIds(code);
    if (pickCount() && encIds(state.picks) !== code && !confirm('Remplacer le pronostic déjà enregistré sur cet appareil par celui de ce lien ?')) return;
    state.picks = ids;
    state.selected = null;
    if (name) { state.name = name; save(LS.name, name); if ($('#nameInput')) $('#nameInput').value = name; }
    closeSheet();
    commitPicks();
    setTab('pick');
    toast('Pronostic chargé : modifiez-le, puis renvoyez le nouveau lien');
  }

  /* ---------- Favorites : indice palmarès + Instagram ---------- */
  const ODDS_EVERY_DAYS = 3;
  const fmtInt = n => Number(n).toLocaleString('fr-FR');
  const fmtK = n => n >= 10000 ? `${Math.round(n / 1000)} k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} k` : String(n);
  const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const daysSince = iso => Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 864e5);
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  function snapshots() {
    const s = state.instagram && Array.isArray(state.instagram.snapshots) ? state.instagram.snapshots : [];
    return [...s].filter(x => x && x.date && x.followers).sort((a, b) => a.date.localeCompare(b.date));
  }
  const followersOf = (snap, id) => (snap && Number(snap.followers[String(id)])) || 0;

  // Indice : w × part du palmarès (titres + 1) + (1 − w) × part des abonnés
  function computeOdds(snap, w) {
    const tSum = state.cands.reduce((s, c) => s + (c.past_titles || 0) + 1, 0);
    const fSum = state.cands.reduce((s, c) => s + followersOf(snap, c.id), 0) || 1;
    return state.cands.map(c => {
      const t = ((c.past_titles || 0) + 1) / tSum * w * 100;
      const f = followersOf(snap, c.id) / fSum * (1 - w) * 100;
      return { c, t, f, p: t + f, followers: followersOf(snap, c.id) };
    }).sort((a, b) => b.p - a.p);
  }

  function buildOddsTab() {
    $('#tab-odds').innerHTML = `
      <h1 class="h1 page-title">Les favorites</h1>
      <div id="oddsInfo"></div>
      <div class="odds-ctrl card-block">
        <label for="oddsW" class="odds-ctrl-label"><span>Palmarès de la région</span><b id="oddsWTxt"></b><span>Instagram</span></label>
        <input id="oddsW" type="range" min="0" max="100" step="10" value="${Math.round(state.oddsW * 100)}" aria-label="Poids du palmarès par rapport à Instagram">
      </div>
      <div class="odds-legend" aria-hidden="true">
        <span><i class="sw sw-t"></i>Palmarès de la région</span>
        <span><i class="sw sw-f"></i>Abonnés Instagram</span>
      </div>
      <div id="oddsChart" class="odds" role="list"></div>
      <details class="more odds-how">
        <summary>Comment est calculé l’indice ?</summary>
        <p class="small">Chaque candidate reçoit une part du palmarès (titres de Miss France de sa région + 1, pour ne pas donner 0 aux régions jamais titrées) et une part de la popularité (ses abonnés Instagram sur le total des 31). L’indice mélange les deux selon le curseur, puis le total fait 100 %.</p>
        <p class="small muted">C’est un indice pour s’amuser, pas une vraie probabilité : le jury et le vote du public ne regardent ni l’histoire de la région ni Instagram.</p>
      </details>`;
    $('#oddsW').addEventListener('input', e => {
      state.oddsW = +e.target.value / 100;
      save(LS.oddsW, state.oddsW);
      renderOdds();
    });
  }

  function renderOdds() {
    const el = $('#oddsChart');
    if (!el) return;
    const snaps = snapshots();
    const last = snaps[snaps.length - 1];
    const prev = snaps[snaps.length - 2];
    const w = state.oddsW;
    $('#oddsWTxt').textContent = `${Math.round(w * 100)} % / ${Math.round((1 - w) * 100)} %`;
    if (!last) {
      $('#oddsInfo').innerHTML = '';
      el.innerHTML = '<p class="empty-msg">Pas encore de relevé Instagram.</p>';
      return;
    }
    const age = daysSince(last.date);
    $('#oddsInfo').innerHTML = `<p class="odds-date">${ICON.insta}<span>Abonnés relevés le <b>${fmtDate(last.date)}</b>${age >= ODDS_EVERY_DAYS ? ' · nouveau relevé attendu' : ` · prochain relevé le ${fmtDate(addDays(last.date, ODDS_EVERY_DAYS))}`}</span></p>`;
    const rows = computeOdds(last, w);
    const prevRank = prev ? new Map(computeOdds(prev, w).map((r, i) => [r.c.id, i])) : null;
    const max = rows[0].p;
    el.innerHTML = rows.map((r, i) => {
      const c = r.c;
      const dF = prev ? r.followers - followersOf(prev, c.id) : null;
      const move = prevRank ? prevRank.get(c.id) - i : 0;
      const mv = move > 0 ? `<span class="mv up" title="Gagne ${move} place${move > 1 ? 's' : ''}">▲${move}</span>` : move < 0 ? `<span class="mv down" title="Perd ${-move} place${move < -1 ? 's' : ''}">▼${-move}</span>` : '';
      const pct = v => `${v.toFixed(1).replace('.', ',')} %`;
      return `<details class="odd" role="listitem">
          <summary>
            <span class="odd-rank">${i + 1}</span>
            ${avatar(c, 's')}
            <span class="odd-main">
              <span class="odd-line"><b>${esc(c.region)}</b>${mv}<span class="odd-p">${pct(r.p)}</span></span>
              <span class="odd-bar" style="width:${(r.p / max * 100).toFixed(1)}%"><span class="seg-t" style="flex-grow:${r.t.toFixed(3)}"></span><span class="seg-f" style="flex-grow:${r.f.toFixed(3)}"></span></span>
            </span>
          </summary>
          <div class="odd-detail">
            <span><i class="sw sw-t"></i>Palmarès : ${c.past_titles ? `${c.past_titles} titre${c.past_titles > 1 ? 's' : ''}` : 'aucun titre'} → ${pct(r.t)}</span>
            <span><i class="sw sw-f"></i>Instagram : ${fmtInt(r.followers)} abonnés${dF != null ? ` (${dF >= 0 ? '+' : ''}${fmtInt(dF)} depuis le ${fmtDate(prev.date)})` : ''} → ${pct(r.f)}</span>
            <button class="btn small" data-action="info" data-cid="${c.id}">Voir la fiche de ${esc(c.name.split(' ')[0])}</button>
          </div>
        </details>`;
    }).join('');
  }

  /* ---------- Admin : relevé des abonnés ---------- */
  function instaAdminHTML() {
    const snaps = snapshots();
    const last = snaps[snaps.length - 1];
    const late = !last || daysSince(last.date) >= ODDS_EVERY_DAYS;
    const today = new Date().toISOString().slice(0, 10);
    return `<details id="instaEditor" class="card-block" ${instaEditorOpen ? 'open' : ''}>
        <summary>Abonnés Instagram ${late ? '<span class="badge rose">relevé à faire</span>' : ''}</summary>
        <p class="muted small">Dernier relevé : ${last ? `${fmtDate(last.date)} (${daysSince(last.date)} j)` : 'aucun'}. Un relevé tous les ${ODDS_EVERY_DAYS} jours : ouvrez chaque compte (lien), notez le nombre d’abonnés, puis publiez. L’onglet « Favorites » se met à jour pour tout le monde.</p>
        <label class="field"><span class="field-label">Date du relevé</span><input id="instaDate" type="date" value="${today}" max="${today}"></label>
        <div class="insta-grid">${[...state.cands].sort((a, b) => a.region.localeCompare(b.region, 'fr')).map(c => `
          <label class="insta-row">
            <span><b>${esc(c.region)}</b>${instaHandle(c) ? `<a href="${esc(instaUrl(c))}" target="_blank" rel="noopener">@${esc(instaHandle(c))}</a>` : ''}</span>
            <input type="number" inputmode="numeric" min="0" step="1" data-insta="${c.id}" value="${last ? followersOf(last, c.id) || '' : ''}" aria-label="Abonnés de Miss ${esc(c.region)}">
          </label>`).join('')}</div>
        <p id="instaErr" class="err" role="alert"></p>
        <div class="row-actions"><button class="btn primary" data-action="save-insta">Publier ce relevé</button></div>
      </details>`;
  }
  let instaEditorOpen = false;

  async function saveInsta() {
    const date = $('#instaDate').value;
    const err = m => { $('#instaErr').textContent = m; };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err('Date invalide');
    const followers = {};
    for (const inp of document.querySelectorAll('[data-insta]')) {
      const v = inp.value.replace(/[\s.]/g, '');
      if (!/^\d+$/.test(v)) return err(`Nombre manquant ou invalide : Miss ${cand(+inp.dataset.insta).region}`);
      followers[inp.dataset.insta] = +v;
    }
    const data = await adminWrite('Relevé Instagram', () => GH.updateJSON('data/instagram.json', cur => {
      const snaps = (cur && Array.isArray(cur.snapshots) ? cur.snapshots : []).filter(s => s.date !== date);
      snaps.push({ date, source: 'Relevé de l’organisateur', followers });
      snaps.sort((a, b) => a.date.localeCompare(b.date));
      return { _aide: (cur && cur._aide) || '', snapshots: snaps };
    }, `Instagram : relevé du ${date}`)).catch(() => null);
    if (data) { state.instagram = data; renderOdds(); renderAdmin(); }
  }

  /* ---------- Rendu : Admin (organisateur uniquement) ---------- */
  function renderAdmin() {
    const el = $('#tab-admin');
    if (!el || !GH.isAdmin) return;
    const withPhoto = state.cands.filter(c => photoOf(c) && photoSrc(c, 'full')).length;
    el.innerHTML = `
      <div class="status final">${ICON.crown}<div>
        <b>Mode organisateur</b>
        <p>Vos modifications sont publiées dans le dépôt GitHub et visibles par tous d’ici 1 à 2 minutes. Vos amis, eux, ne peuvent que faire leur pronostic.</p>
        <div class="row-actions"><button class="btn ghost small" data-action="admin-logout">Se déconnecter de cet appareil</button></div>
      </div></div>

      <div class="card-block">
        <h3>Joueurs (${state.players.length})</h3>
        <p class="muted">Chacun enregistre lui-même son pronostic dans la base (bouton « Enregistrer »). Pour supprimer un faux pronostic de la base : Supabase → <i>Table Editor</i> → <code>pronostics</code>.</p>
        ${state.players.length ? `<ul class="admin-list">${state.players.map(p => `
          <li><span><b>${esc(p.name)}</b><small>${ICON.crown}${esc(cand(decIds(p.code)[0]).region)} · ${p.db ? 'base' : 'lien ajouté à la main'}</small></span>
          ${p.db ? '' : `<button class="btn ghost small" data-action="remove-player" data-name="${esc(p.name)}" aria-label="Retirer ${esc(p.name)}">${ICON.trash}</button>`}</li>`).join('')}</ul>` : ''}
        <details class="more">
          <summary>Ajouter un pronostic reçu par lien</summary>
          <p class="muted small">Pour quelqu’un qui vous a envoyé son lien au lieu d’enregistrer. Un nouveau lien avec le même pseudo remplace l’ancien.</p>
          <textarea id="linksInput" rows="3" placeholder="https://…#p=…&amp;n=Léa"></textarea>
          <div class="row-actions"><button class="btn primary" data-action="add-links">${ICON.plus}Ajouter au classement</button></div>
        </details>
      </div>

      ${instaAdminHTML()}

      <details id="resEditor" class="card-block" ${resEditorOpen ? 'open' : ''}>
        <summary>Résultats de l’élection</summary>
        <div id="resForm"></div>
      </details>

      <div class="card-block">
        <h3>Photos (${withPhoto}/31 complètes)</h3>
        <p class="muted">Deux photos par candidate : le portrait (utilisé aussi pour les vignettes) et la photo en pied. Le bouton « Photos » ouvre la fiche pour les changer ; les images sont redimensionnées avant envoi.</p>
        <div class="photo-grid">${state.cands.map(c => `
          <div class="ptile">
            ${avatar(c, 'm')}
            <span class="ptile-txt"><b>${esc(c.region)}</b><small>${esc(c.name)}</small></span>
            <button class="btn ghost small icon-only" data-action="edit-cand" data-cid="${c.id}" aria-label="Modifier la fiche de ${esc(c.region)}">${ICON.pencil}</button>
            <span class="ptile-count">${[photoOf(c), photoSrc(c, 'full')].filter(Boolean).length}/2</span>
            <button class="btn small" data-action="info" data-cid="${c.id}">${ICON.camera}Photos</button>
          </div>`).join('')}</div>
      </div>`;
    $('#resEditor').addEventListener('toggle', e => { resEditorOpen = e.target.open; if (e.target.open) renderResForm(); });
    $('#instaEditor').addEventListener('toggle', e => { instaEditorOpen = e.target.open; });
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
        <button class="btn primary" data-action="save-results">Publier les résultats</button>
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

  function renderAll() { renderBoard(); renderPool(); renderShare(); renderCandList(); renderRanking(); renderOdds(); renderAdmin(); }

  /* ---------- Onglets & mode organisateur ---------- */
  const TABS = () => GH.isAdmin ? ['pick', 'cands', 'odds', 'rank', 'admin'] : ['pick', 'cands', 'odds', 'rank'];
  function setTab(tab) {
    if (!TABS().includes(tab)) tab = 'pick';
    state.tab = tab;
    save(LS.tab, tab);
    document.querySelectorAll('.tabbar [role=tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    ['pick', 'cands', 'odds', 'rank', 'admin'].forEach(t => { $('#tab-' + t).hidden = t !== tab; });
    $('#actionbar').hidden = tab !== 'pick';
    document.body.dataset.tab = tab;
    window.scrollTo(0, 0);
  }

  function applyAdminMode() {
    $('#tabAdmin').hidden = !GH.isAdmin;
    $('.tabbar').classList.toggle('five', GH.isAdmin);
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
        <div class="sheet-actions"><button class="btn primary" data-action="admin-do-login">Se connecter</button></div>
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
    const key = sp.get('k');
    if (key && key.length >= 20) {
      // Lien personnel : reprend le pronostic et la clé de modification sur cet appareil
      if (load(LS.editKey, null) !== key && pickCount() && encIds(state.picks) !== code
          && !confirm(`Reprendre le pronostic de ${name || 'ce lien'} sur cet appareil ? Celui déjà présent ici sera remplacé.`)) return;
      save(LS.editKey, key);
      if (name) save(LS.savedAs, name);
      state.picks = decIds(code); state.selected = null;
      if (name) { state.name = name; save(LS.name, name); if ($('#nameInput')) $('#nameInput').value = name; }
      commitPicks(); setTab('pick');
      toast('Pronostic repris sur cet appareil : vous pouvez le modifier puis enregistrer', 4000);
      return;
    }
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
            ? (existing && existing.code === code ? '' : `<button class="btn primary" data-action="import-player" data-code="${code}" data-name="${esc(name)}">${ICON.plus}${existing ? 'Mettre à jour le classement' : 'Ajouter au classement'}</button>`)
            : `<button class="btn primary" data-action="start-own">Faire mon propre pronostic</button>`}
          <button class="btn" data-action="adopt-pick" data-code="${code}" data-name="${esc(name)}">${ICON.pencil}C’est mon pronostic : le modifier</button>
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
      case 'sheet-unpick': removePick(slotOf(cid)); toast(`${cand(cid).region} retirée de votre pronostic`); break;
      case 'start-own': closeSheet(); setTab('pick'); break;
      case 'adopt-pick': adoptPick(t.dataset.code, t.dataset.name); break;
      case 'save-db': saveToDb(); break;
      case 'copy-own-link': copyText(ownLink(), 'Lien personnel copié : ne le partagez pas'); break;
      case 'rank-view': setRankView(t.dataset.v); break;
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
      case 'save-insta': if (GH.isAdmin) saveInsta(); break;
      case 'clear-results':
        if (GH.isAdmin && confirm('Effacer tous les résultats saisis ?')) saveResults({ top12: [], miss_france: null, dauphines: [null, null, null, null] });
        break;
      case 'photo-remove': if (GH.isAdmin) removePhoto(cid, t.dataset.kind === 'full' ? 'full' : 'portrait'); break;
      case 'gallery': {
        const g = t.closest('.fiche-photo').querySelector('.gallery');
        g.scrollTo({ left: g.clientWidth * +t.dataset.i, behavior: 'smooth' });
        break;
      }
      case 'pool-filter': state.poolFilter = t.dataset.f; renderPool(); break;
      case 'cand-filter': state.candFilter = t.dataset.f; renderCandList(); break;
      case 'fiche-rank': ficheSetRank(+t.dataset.r); break;
      case 'fiche-place': fichePlace(cid); break;
      case 'focus-name': $('#nameInput').focus(); $('#nameInput').scrollIntoView({ block: 'center', behavior: 'smooth' }); break;
      case 'edit-cand': if (GH.isAdmin) openEditor(cid); break;
      case 'save-cand': if (GH.isAdmin) saveEditor(cid); break;
    }
  }

  function onChange(e) {
    const input = e.target.closest('input[type=file][data-photo]');
    if (!input || !GH.isAdmin || !input.files || !input.files[0]) return;
    uploadPhoto(+input.dataset.photo, input.files[0], input.dataset.kind === 'full' ? 'full' : 'portrait');
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
    // empêche le glisser natif des images, qui annulerait le glisser-déposer
    document.addEventListener('dragstart', e => { if (e.target.closest('#tab-pick')) e.preventDefault(); });
  }

  /* ---------- Compte à rebours ---------- */
  function renderCountdown() {
    const el = $('#countdown');
    const ms = ELECTION - Date.now();
    const days = Math.ceil(ms / 864e5);
    if (ms > 864e5) el.textContent = `J-${days}`;
    else if (ms > 0) el.textContent = 'Ce soir 21 h 10';
    else if (ms > -6 * 3600e3) el.textContent = 'En direct';
    else el.textContent = 'Terminé';
  }


  /* ---------- Démarrage ---------- */
  const CANDS_PATH = 'data/candidates_2027.json';
  // L'organisateur lit directement le dépôt (toujours à jour) ; les autres lisent le site publié
  const loadShared = path => GH.isAdmin ? GH.readJSON(path).catch(() => getJSON(path)) : getJSON(path);

  async function reloadShared() {
    const [players, res, cands, insta, db] = await Promise.all([
      loadShared('players.json').catch(() => null),
      loadShared('results.json').catch(() => null),
      loadShared(CANDS_PATH).catch(() => null),
      loadShared('data/instagram.json').catch(() => null),
      fetchDbPlayers().catch(() => null)
    ]);
    let changed = false;
    if (insta && JSON.stringify(insta) !== JSON.stringify(state.instagram)) { state.instagram = insta; changed = true; }
    const before = JSON.stringify(state.players);
    state.filePlayers = normPlayers(players);
    if (db) state.dbPlayers = db;
    mergePlayers();
    if (JSON.stringify(state.players) !== before) changed = true;
    if (JSON.stringify(res) !== JSON.stringify(state.results)) { state.results = res; changed = true; }
    if (Array.isArray(cands)) cands.forEach(c => {
      const cur = cand(c.id);
      if (cur && JSON.stringify(cur) !== JSON.stringify(c)) { Object.assign(cur, c); changed = true; }
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

    { const w = Number(load(LS.oddsW, 0.5)); state.oddsW = w >= 0 && w <= 1 ? w : 0.5; }
    buildPickTab(); buildCandsTab(); buildOddsTab(); buildRankTab();
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
      if (await reloadShared()) { renderBoard(); renderPool(); renderShare(); renderCandList(); renderRanking(); renderOdds(); if (state.tab !== 'admin') renderAdmin(); }
    }, 60e3);
    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  init();
})();
