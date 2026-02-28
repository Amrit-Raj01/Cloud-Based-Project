// ════════════════════════════════════════════════════════════
//  app.js — Frontend Logic
//  localStorage REMOVED — sab MongoDB Atlas se hoga
//  EC2 backend se connect ho raha hai
// ════════════════════════════════════════════════════════════

// ── STATE ────────────────────────────────────────────────────
let entries = [];
let selectedType = 'note';
let searchQuery  = '';

// ── API BASE URL ──────────────────────────────────────────────
// Same EC2 pe frontend+backend hai toh '' rakho
// Alag hai (GitHub Pages) toh: const API = 'http://YOUR_EC2_IP';
const API = '';

// ── APP START ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
});

// ── TYPE TAG SELECTION ────────────────────────────────────────
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
  });
});

// ── SEARCH ────────────────────────────────────────────────────
document.getElementById('search').addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase();
  render();
});

// ── KEYBOARD SHORTCUT ─────────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addEntry();
});

// ── ADD ENTRY ─────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', addEntry);

async function addEntry() {
  const titleEl   = document.getElementById('inp-title');
  const contentEl = document.getElementById('inp-content');
  const fileEl    = document.getElementById('inp-file');

  const title   = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) { showToast('Fill in title & content!'); return; }

  const btn = document.getElementById('btn-save');
  btn.textContent = '[ SAVING... ]';
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('name', title);
    formData.append('email', 'user@vault.com');
    formData.append('message', content);
    formData.append('type', selectedType);
    if (fileEl && fileEl.files[0]) formData.append('file', fileEl.files[0]);

    const res  = await fetch(`${API}/api/submit`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');

    titleEl.value = '';
    contentEl.value = '';
    if (fileEl) fileEl.value = '';

    showToast('Stored ✓');
    await loadEntries();

  } catch (error) {
    showToast('Error: ' + error.message);
  } finally {
    btn.textContent = '[ STORE TO VAULT ]';
    btn.disabled = false;
  }
}

// ── LOAD FROM MONGODB ─────────────────────────────────────────
async function loadEntries() {
  try {
    const res  = await fetch(`${API}/api/entries`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    entries = data.data || [];
    render();
  } catch (error) {
    showToast('Could not load entries');
  }
}

// ── DELETE ────────────────────────────────────────────────────
async function deleteEntry(id) {
  try {
    const res  = await fetch(`${API}/api/entries/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    entries = entries.filter(e => e._id !== id);
    render();
    showToast('Deleted');
  } catch (error) {
    showToast('Delete failed');
  }
}

// ── COPY ──────────────────────────────────────────────────────
function copyEntry(id) {
  const e = entries.find(x => x._id === id);
  if (!e) return;
  navigator.clipboard.writeText(e.message)
    .then(() => showToast('Copied!'))
    .catch(() => showToast('Copy failed'));
}

// ── RENDER ────────────────────────────────────────────────────
function render() {
  const filtered = entries.filter(e =>
    (e.name    || '').toLowerCase().includes(searchQuery) ||
    (e.message || '').toLowerCase().includes(searchQuery) ||
    (e.type    || '').toLowerCase().includes(searchQuery)
  );
  renderStats();
  renderCount(filtered.length);
  renderGrid(filtered);
}

function renderStats() {
  const types = ['note','secret','link','code','todo'];
  const el    = document.getElementById('stats-bar');
  if (!el) return;
  el.innerHTML = `
    <div class="stat"><div class="stat-value">${entries.length}</div><div class="stat-label">Total</div></div>
    ${types.map(t => `
      <div class="stat">
        <div class="stat-value">${entries.filter(e=>(e.type||'note')===t).length}</div>
        <div class="stat-label">${t}s</div>
      </div>`).join('')}`;
}

function renderCount(n) {
  const el = document.getElementById('count-badge');
  if (el) el.textContent = `${n} ENTR${n===1?'Y':'IES'}`;
}

function renderGrid(filtered) {
  const grid = document.getElementById('vault-grid');
  if (!grid) return;
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="big">EMPTY</div>
        <p>${entries.length===0 ? 'vault is empty — start storing' : 'no results found'}</p>
      </div>`;
    return;
  }
  grid.innerHTML = filtered.map(e => buildCard(e)).join('');
}

function buildCard(e) {
  const isSecret = (e.type||'note') === 'secret';
  const date     = new Date(e.createdAt);
  const timeStr  =
    date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) +
    ' · ' +
    date.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  const fileBadge = e.file && e.file.filename
    ? `<span class="file-badge">📎 ${e.file.originalname}</span>` : '';
  return `
    <div class="entry-card" data-type="${e.type||'note'}" data-id="${e._id}">
      <div class="entry-header">
        <div class="entry-title">${escHtml(e.name)}</div>
        <div class="entry-type">${e.type||'note'}</div>
      </div>
      <div class="entry-body ${isSecret?'secret-blur':''}" ${isSecret?'title="Hover to reveal"':''}>
        ${escHtml(e.message)}
      </div>
      ${fileBadge}
      <div class="entry-footer">
        <div class="entry-time">${timeStr}</div>
        <div class="entry-actions">
          <button class="icon-btn"     onclick="copyEntry('${e._id}')"   title="Copy">⎘</button>
          <button class="icon-btn del" onclick="deleteEntry('${e._id}')" title="Delete">✕</button>
        </div>
      </div>
    </div>`;
}

// ── TOAST ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── UTILS ─────────────────────────────────────────────────────
function escHtml(str='') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
