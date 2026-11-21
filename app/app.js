// Trophy Atlas — GTA VI guide, tracker and platinum roadmap. Offline ES module, no dependencies.
const KEY = 'trophy-…s-v1';
const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const doc = await (await fetch('data/trophies.json')).json();
const T = doc.trophies;
const byId = new Map(T.map((t) => [t.id, t]));
const CHAPTERS = { 0: 'Endgame', 1: 'Chapter 1', 2: 'Chapter 2', 3: 'Chapter 3', 4: 'Chapter 4', 5: 'Chapter 5' };
const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

// ?shot= scenes render without chrome: checklist, roadmap, detail&id=N, filters.
const q = new URLSearchParams(location.search);
const shot = q.get('shot');
if (shot) document.body.dataset.shot = shot;

let state = { spoilers: false };
const earned = new Set();
try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  if (raw && Array.isArray(raw.earned)) {
    for (const id of raw.earned) if (byId.has(id)) earned.add(id);
    state.spoilers = !!raw.spoilers;
  }
} catch { /* corrupted save: start fresh */ }
let selected = null;

function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], spoilers: state.spoilers }));
}
const isMasked = (t) => t.hidden && !state.spoilers;
const chapterLabel = (t) => CHAPTERS[t.chapter] ?? 'Anytime';

function renderProgress() {
  const n = earned.size, total = T.length, pct = Math.round((n / total) * 100);
  $('#progress').textContent = `${n} / ${total} earned · ${pct}%`;
  $('#bar').style.width = pct + '%';
  $('#gradecounts').textContent = GRADES.map((g) => {
    const all = T.filter((t) => t.grade === g);
    return `${all.filter((t) => earned.has(t.id)).length}/${all.length} ${g}`;
  }).join(' · ');
  const sb = $('#spoilers');
  sb.textContent = state.spoilers ? 'Spoilers: shown' : 'Spoilers: hidden';
  sb.setAttribute('aria-pressed', String(state.spoilers));
}

function currentFilters() {
  return {
    grade: $('#f-grade').value,
    chapter: $('#f-chapter').value,
    status: $('#f-status').value,
    text: $('#f-text').value.trim().toLowerCase(),
  };
}
function matches(t, f) {
  if (f.grade !== 'all' && t.grade !== f.grade) return false;
  if (f.chapter !== 'all' && String(t.chapter) !== f.chapter) return false;
  if (f.status === 'earned' && !earned.has(t.id)) return false;
  if (f.status === 'unearned' && earned.has(t.id)) return false;
  if (f.status === 'missable' && !t.missable) return false;
  if (f.text) {
    const hay = isMasked(t) ? '' : `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(f.text)) return false;
  }
  return true;
}

function renderList() {
  const f = currentFilters();
  const list = $('#list');
  list.replaceChildren();
  const shown = T.filter((t) => matches(t, f));
  $('#f-count').textContent = `${shown.length} shown`;
  for (const t of shown) {
    const li = el('li', 'row' + (earned.has(t.id) ? ' earned' : '') + (selected === t.id ? ' selected' : ''));
    li.tabIndex = 0;
    const box = el('input', 'tick');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + (isMasked(t) ? 'hidden trophy' : t.name) + ' earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderAll();
    });
    const body = el('div', 'rowbody');
    body.append(el('div', 'rowname', isMasked(t) ? 'Hidden trophy' : t.name));
    body.append(el('div', 'rowdesc', isMasked(t) ? 'Spoiler-hidden — reveal to read the official description.' : t.description));
    const chips = el('div', 'chips');
    chips.append(el('span', 'chip', chapterLabel(t)), el('span', 'chip', t.kind));
    if (t.missable) chips.append(el('span', 'chip warn', 'MISSABLE'));
    body.append(chips);
    li.append(box, el('span', 'badge ' + t.grade, t.grade), body);
    li.addEventListener('click', (e) => { if (e.target !== box) { selected = t.id; renderAll(); } });
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === li) { selected = t.id; renderAll(); } });
    list.append(li);
  }
  if (!shown.length) list.append(el('li', 'empty', 'No trophies match these filters.'));
}

function renderDetail() {
  const panel = $('#detail');
  panel.replaceChildren();
  const t = byId.get(selected);
  if (!t) {
    panel.append(el('p', 'kicker', 'Trophy detail'));
    panel.append(el('p', 'placeholder muted', 'Select a trophy from the checklist to read its guide, steps and missable warnings.'));
    return;
  }
  const head = el('div', 'dhead');
  head.append(el('span', 'badge ' + t.grade, t.grade), el('h2', 'dname', isMasked(t) ? 'Hidden trophy' : t.name));
  panel.append(head);
  if (isMasked(t)) {
    panel.append(el('p', 'muted', 'This trophy is hidden to avoid story spoilers. Its name, description and guide stay masked until you reveal spoilers.'));
    const b = el('button', 'btn', 'Reveal spoilers');
    b.type = 'button';
    b.addEventListener('click', () => { state.spoilers = true; save(); renderAll(); });
    panel.append(b);
  } else {
    panel.append(el('p', 'official', t.description));
    const meta = el('div', 'chips');
    meta.append(el('span', 'chip', chapterLabel(t)), el('span', 'chip', t.kind), el('span', 'chip', 'id ' + t.id));
    if (t.missable) meta.append(el('span', 'chip warn', 'MISSABLE'));
    panel.append(meta);
    if (t.missable) panel.append(el('p', 'warnbox', 'Missable: read the guide before advancing the story.'));
    panel.append(el('h3', 'kicker', 'Guide'));
    panel.append(el('p', 'guide', t.guide));
    panel.append(el('h3', 'kicker', 'Steps'));
    const ol = el('ol', 'steps');
    for (const s of t.steps) ol.append(el('li', null, s));
    panel.append(ol);
  }
  const b = el('button', 'btn primary', earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned');
  b.type = 'button';
  b.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    save(); renderAll();
  });
  panel.append(b);
}

function renderRoadmap() {
  const root = $('#roadmap');
  root.replaceChildren();
  root.append(el('h2', 'kicker', 'Platinum roadmap'));
  root.append(el('p', 'muted', 'Story first, cleanup after. The only missable is the Chapter 1 meditation — everything else can wait for the endgame. Counts update as you tick trophies off.'));
  for (const ch of [1, 2, 3, 4, 5, 0]) {
    const items = T.filter((t) => t.chapter === ch);
    if (!items.length) continue;
    const got = items.filter((t) => earned.has(t.id)).length;
    const sec = el('section', 'rgroup');
    const head = el('div', 'rhead');
    head.append(el('h3', null, ch === 0 ? 'Endgame & 100% cleanup' : CHAPTERS[ch]));
    head.append(el('span', 'count', `${got} / ${items.length}`));
    sec.append(head);
    const bar = el('div', 'rbar');
    const fill = el('div', 'rfill');
    fill.style.width = Math.round((got / items.length) * 100) + '%';
    bar.append(fill);
    sec.append(bar);
    const ul = el('ul', 'rlist');
    for (const t of items) {
      const li = el('li', 'ritem' + (earned.has(t.id) ? ' done' : ''));
      li.append(el('span', 'rdot ' + t.grade), el('span', 'rname', isMasked(t) ? 'Hidden trophy' : t.name));
      if (t.missable) li.append(el('span', 'chip warn', 'MISSABLE'));
      li.addEventListener('click', () => { selected = t.id; renderAll(); });
      ul.append(li);
    }
    sec.append(ul);
    root.append(sec);
  }
}

function renderAll() { renderProgress(); renderList(); renderDetail(); renderRoadmap(); }

for (const id of ['f-grade', 'f-chapter', 'f-status']) $('#' + id).addEventListener('change', renderAll);
$('#f-text').addEventListener('input', renderAll);
$('#spoilers').addEventListener('click', () => { state.spoilers = !state.spoilers; save(); renderAll(); });

$('#export').addEventListener('click', () => {
  const payload = { app: 'trophy-atlas', version: 1, exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'trophy-atlas-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const msg = $('#importmsg');
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.earned) ? data.earned : null);
    if (!list) throw new Error('expected an array of trophy ids');
    const ids = [];
    for (const v of list) {
      if (typeof v === 'number' && byId.has(v)) ids.push(v);
      else if (typeof v === 'string') {
        const t = T.find((x) => x.name === v);
        if (!t) throw new Error('unknown trophy: ' + v);
        ids.push(t.id);
      } else throw new Error('invalid trophy id: ' + JSON.stringify(v));
    }
    earned.clear();
    for (const id of ids) earned.add(id);
    save(); renderAll();
    msg.textContent = `Imported ${ids.length} earned trophies.`;
  } catch (err) {
    msg.textContent = 'Import rejected: ' + err.message;
  }
});

if (shot) {
  state.spoilers = true; // showcase scenes show the full guide
  // Sample progress so captures show a used tracker (8/55, spread over chapters).
  // Seeded only when there is no saved progress, and never written back to localStorage.
  if (!earned.size) for (const id of [2, 3, 8, 12, 14, 15, 16, 20]) earned.add(id);
}
if (shot === 'detail') {
  const id = Number(q.get('id'));
  if (byId.has(id)) selected = id;
}
renderAll();
