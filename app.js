// ════════════════════════════════════════════════════════════
//  VAULT — app.js
//  All logic lives here. When you add a backend (EC2, etc.),
//  just replace the localStorage calls in save() and loadAll()
//  with fetch() API calls. Everything else stays the same.
// ════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────
let entries = [];
let selectedType = 'note';
let searchQuery = '';

// ── STORAGE LAYER ─────────────────────────────────────────────
// 🔁 SWAP THESE with fetch('/api/...') when your EC2 backend is ready

function save(entry) {
  entries.unshift(entry);
  localStorage.setItem('vault_entries', JSON.stringify(entries));
}

function deleteById(id) {
  entries = entries.filter(e => e.id !== id);
  localStorage.setItem('vault_entries', JSON.stringify(entries));
}

function loadAll() {
  entries = JSON.parse(localStorage.getItem('vault_entries') || '[]');
}

// ── INIT ──────────────────────────────────────────────────────
loadAll();
render();

// ── TYPE TAG SELECTION ────────────────────────────────────────
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
  });
});

// ── ADD ENTRY ─────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', addEntry);

function addEntry() {
  const titleEl   = document.getElementById('inp-title');
  const contentEl = document.getElementById('inp-content');

  const title   = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    showToast('Fill in title & content!');
    return;
  }

  const entry = {
    id:      generateId(),
    title,
    content,
    type:    selectedType,
    created: new Date().toISOString()
  };

  save(entry);

  titleEl.value   = '';
  contentEl.value = '';

  render();
  showToast('Stored ✓');
}

// ── SEARCH ────────────────────────────────────────────────────
document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

// ── KEYBOARD SHORTCUT: Ctrl/Cmd + Enter to save ───────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    addEntry();
  }
});

// ── RENDER ────────────────────────────────────────────────────
function render() {
  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(searchQuery)   ||
    e.content.toLowerCase().includes(searchQuery) ||
    e.type.includes(searchQuery)
  );

  renderStats();
  renderCount(filtered.length);
  renderGrid(filtered);
}

function renderStats() {
  const types = ['note', 'secret', 'link', 'code', 'todo'];
  const html = `
    <div class="stat">
      <div class="stat-value">${entries.length}</div>
      <div class="stat-label">Total</div>
    </div>
    ${types.map(t => `
      <div class="stat">
        <div class="stat-value">${entries.filter(e => e.type === t).length}</div>
        <div class="stat-label">${t}s</div>
      </div>
    `).join('')}
  `;
  document.getElementById('stats-bar').innerHTML = html;
}

function renderCount(n) {
  document.getElementById('count-badge').textContent =
    `${n} ENTR${n === 1 ? 'Y' : 'IES'}`;
}

function renderGrid(filtered) {
  const grid = document.getElementById('vault-grid');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="big">EMPTY</div>
        <p>${entries.length === 0 ? 'vault is empty — start storing' : 'no results found'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(e => buildCard(e)).join('');
}

function buildCard(e) {
  const isSecret = e.type === 'secret';
  const date     = new Date(e.created);
  const timeStr  =
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return `
    <div class="entry-card" data-type="${e.type}" data-id="${e.id}">
      <div class="entry-header">
        <div class="entry-title">${escHtml(e.title)}</div>
        <div class="entry-type">${e.type}</div>
      </div>
      <div class="entry-body ${isSecret ? 'secret-blur' : ''}"
           ${isSecret ? 'title="Hover to reveal"' : ''}>
        ${escHtml(e.content)}
      </div>
      <div class="entry-footer">
        <div class="entry-time">${timeStr}</div>
        <div class="entry-actions">
          <button class="icon-btn"     onclick="copyEntry('${e.id}')"   title="Copy">⎘</button>
          <button class="icon-btn del" onclick="deleteEntry('${e.id}')" title="Delete">✕</button>
        </div>
      </div>
    </div>`;
}

// ── ENTRY ACTIONS ─────────────────────────────────────────────
function copyEntry(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;
  navigator.clipboard.writeText(e.content)
    .then(() => showToast('Copied!'))
    .catch(() => showToast('Copy failed'));
}

function deleteEntry(id) {
  deleteById(id);
  render();
  showToast('Deleted');
}

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ── UTILS ─────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function escHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
