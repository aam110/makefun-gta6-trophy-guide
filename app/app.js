// Leonida Legend — the tracker: checklist, filters, spoiler mode, progress
// saved in localStorage, export and import. Everything runs offline; the only
// file it fetches is its own data/trophies.json.

import { renderRoadmap } from './roadmap.js';

const STORAGE_KEY = 'leonida-legend-progress-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-v1';

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const spoilerInput = document.getElementById('spoiler');
const listNote = document.getElementById('listNote');
const roadmapContainer = document.getElementById('roadmap');

let trophies = [];
let trophiesById = new Map();
let earned = new Set();
let spoilerOn = false;
let kindFilter = 'all';
let openGuides = new Set();

function loadStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    earned = new Set(Array.isArray(raw) ? raw : raw.earned ?? []);
  } catch {
    earned = new Set();
  }
  spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
  spoilerInput.checked = spoilerOn;
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function formatCount(trophy) {
  if (trophy.count == null) return null;
  if (trophy.id === 52) return 'Target $250,000';
  if (trophy.id === 53) return 'Target $100,000';
  return `Target ${trophy.count}`;
}

function matchesFilters(trophy) {
  if (kindFilter === 'missable' && !trophy.missable) return false;
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && trophy.kind !== kindFilter) return false;
  if (gradeSelect.value !== 'all' && trophy.grade !== gradeSelect.value) return false;
  const query = searchInput.value.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function buildGuidePanel(trophy) {
  const panel = document.createElement('div');
  panel.className = 'guide-panel';

  const text = document.createElement('p');
  text.textContent = trophy.guide;
  panel.append(text);

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    panel.append(steps);
  }

  if (trophy.prediction) {
    const note = document.createElement('p');
    note.className = 'prediction-note';
    note.textContent =
      'Method unconfirmed: no guide source has confirmed how this unlocks yet. ' +
      'This guide is a reasoned prediction from the official description — check updated guides after launch.';
    panel.append(note);
  }

  const sources = document.createElement('p');
  sources.className = 'sources';
  const label = document.createElement('b');
  label.textContent = 'Sources: ';
  sources.append(label);
  sources.append(document.createTextNode((trophy.sources ?? []).join(' · ')));
  panel.append(sources);

  return panel;
}

function buildCard(trophy) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.trophyId = String(trophy.id);
  if (earned.has(trophy.name)) card.classList.add('earned');

  const head = document.createElement('div');
  head.className = 'card-head';

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earn-box';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveProgress();
    renderAll();
  });
  head.append(box);

  const textWrap = document.createElement('div');

  const name = document.createElement('h3');
  name.className = 'trophy-name';
  if (isSpoilerHidden(trophy)) {
    const masked = document.createElement('span');
    masked.className = 'hidden-name';
    masked.textContent = 'Hidden story trophy — earn it to reveal';
    name.append(masked);
  } else {
    name.textContent = trophy.name;
  }
  textWrap.append(name);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = isSpoilerHidden(trophy)
    ? 'Its name and description are hidden until earned (spoiler setting is on).'
    : trophy.description;
  textWrap.append(desc);

  head.append(textWrap);
  card.append(head);

  const badges = document.createElement('div');
  badges.className = 'badges';

  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${trophy.grade}`;
  gradeBadge.textContent = gradeLabel(trophy.grade);
  badges.append(gradeBadge);

  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge kind';
  kindBadge.textContent = kindLabel(trophy.kind);
  badges.append(kindBadge);

  if (trophy.hidden) {
    const hiddenBadge = document.createElement('span');
    hiddenBadge.className = 'badge hidden-badge';
    hiddenBadge.textContent = 'Hidden on PSN';
    badges.append(hiddenBadge);
  }

  if (trophy.missable) {
    const missBadge = document.createElement('span');
    missBadge.className = 'badge missable-badge';
    missBadge.textContent = '⚠ Missable';
    badges.append(missBadge);
  }

  const target = formatCount(trophy);
  if (target) {
    const countBadge = document.createElement('span');
    countBadge.className = 'badge count';
    countBadge.textContent = target;
    badges.append(countBadge);
  }

  const stageBadge = document.createElement('span');
  stageBadge.className = 'badge stage';
  stageBadge.textContent = `Roadmap stage ${trophy.stage}`;
  badges.append(stageBadge);

  card.append(badges);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  if (isSpoilerHidden(trophy)) {
    toggle.textContent = 'Guide hidden until earned';
    toggle.disabled = true;
  } else {
    toggle.textContent = openGuides.has(trophy.id) ? 'Hide guide ▲' : 'Read the guide ▼';
  }
  toggle.addEventListener('click', () => {
    if (openGuides.has(trophy.id)) openGuides.delete(trophy.id);
    else openGuides.add(trophy.id);
    renderAll();
  });
  card.append(toggle);

  if (openGuides.has(trophy.id) && !isSpoilerHidden(trophy)) {
    card.append(buildGuidePanel(trophy));
  }

  return card;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById('progressLabel').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('toolbarProgress').textContent = `${done} of ${total} earned · ${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;

  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const ofGrade = trophies.filter((t) => t.grade === grade);
    const earnedOfGrade = ofGrade.filter((t) => earned.has(t.name)).length;
    return `${earnedOfGrade}/${ofGrade.length} ${grade}`;
  });
  document.getElementById('gradeCounts').textContent = counts.join('  ·  ');
}

function renderHeroStats() {
  const stats = [
    ['55', 'trophies'],
    ['1P · 2G · 6S · 46B', 'grades'],
    ['28', 'hidden on PSN'],
    ['~200 h', 'to the platinum'],
    ['4/10', 'difficulty (PowerPyx)'],
    ['0', 'online trophies'],
  ];
  const wrap = document.getElementById('heroStats');
  wrap.replaceChildren();
  for (const [value, label] of stats) {
    const pill = document.createElement('span');
    pill.className = 'stat';
    const strong = document.createElement('b');
    strong.textContent = value;
    pill.append(strong, document.createTextNode(` ${label}`));
    wrap.append(pill);
  }
}

function renderGrid() {
  const visible = trophies.filter(matchesFilters);
  grid.replaceChildren();

  if (kindFilter === 'online') {
    emptyState.hidden = false;
    emptyState.textContent =
      'No online trophies: all 55 unlock in single-player. GTABase and PowerPyx both confirm there are no online or DLC trophies at launch, so the whole list is yours offline.';
    listNote.textContent = 'Showing the Online filter: 0 trophies.';
    return;
  }

  if (visible.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent = 'No trophies match these filters. Clear the search or pick another filter.';
    listNote.textContent = 'Showing 0 trophies.';
    return;
  }

  emptyState.hidden = true;
  for (const trophy of visible) grid.append(buildCard(trophy));
  listNote.textContent = `Showing ${visible.length} of ${trophies.length} trophies.` +
    (spoilerOn ? ' Spoiler mode is on: story trophies stay hidden until earned.' : '');
}

function renderAll() {
  renderProgress();
  renderRoadmap(roadmapContainer, earned, trophiesById);
  renderGrid();
}

function downloadProgress() {
  const payload = {
    app: 'leonida-legend',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function importProgress(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('not a progress file');
  const known = new Set(trophies.map((t) => t.name));
  const valid = names.filter((name) => known.has(name));
  if (valid.length === 0 && names.length > 0) throw new Error('no known trophies in file');
  earned = new Set(valid);
  saveProgress();
  renderAll();
}

document.getElementById('export').addEventListener('click', downloadProgress);

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    await importProgress(file);
    listNote.textContent = `Imported ${earned.size} earned trophies from ${file.name}.`;
  } catch {
    listNote.textContent = 'That file is not a Leonida Legend progress export. Nothing was changed.';
  }
});

document.getElementById('reset').addEventListener('click', () => {
  if (earned.size === 0) return;
  if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
  earned = new Set();
  openGuides = new Set();
  saveProgress();
  renderAll();
});

document.getElementById('kindChips').addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  kindFilter = chip.dataset.kind;
  for (const button of document.querySelectorAll('.chip')) {
    button.classList.toggle('active', button === chip);
  }
  renderGrid();
});

spoilerInput.addEventListener('change', () => {
  spoilerOn = spoilerInput.checked;
  saveSpoiler();
  renderAll();
});

gradeSelect.addEventListener('change', renderGrid);
searchInput.addEventListener('input', renderGrid);

loadStored();
const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
trophiesById = new Map(trophies.map((t) => [t.id, t]));
renderHeroStats();
renderAll();
