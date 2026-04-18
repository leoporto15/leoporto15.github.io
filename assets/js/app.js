/* =====================================================
   Claude Marketplace — app.js
   ===================================================== */

let registry = null;
let activeType = 'all';
let searchQuery = '';
let sortBy = 'featured';

// ── Bootstrap ──────────────────────────────────────────
async function init() {
  showSkeletons(6);
  try {
    const res = await fetch('registry.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    registry = await res.json();
    updateStats();
    render();
    setupListeners();
  } catch (err) {
    document.getElementById('items-grid').innerHTML =
      `<p style="color:var(--text-2);grid-column:1/-1;padding:40px 0;text-align:center">
        Não foi possível carregar o registry.
        <a href="registry.json">Ver JSON</a>
      </p>`;
    document.getElementById('results-count').textContent = '';
    console.error('Registry load failed:', err);
  }
}

// ── Stats ───────────────────────────────────────────────
function updateStats() {
  const { items } = registry;
  setText('stat-total',     items.length);
  setText('stat-skills',    items.filter(i => i.type === 'skill').length);
  setText('stat-agents',    items.filter(i => i.type === 'agent').length);
  setText('stat-playbooks', items.filter(i => i.type === 'playbook').length);
}

// ── Render grid ─────────────────────────────────────────
function getFiltered() {
  let items = registry.items.slice();

  if (activeType !== 'all')
    items = items.filter(i => i.type === activeType);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.toLowerCase().includes(q)) ||
      i.author.toLowerCase().includes(q)
    );
  }

  if (sortBy === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'type') {
    items.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  } else {
    // featured first
    items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return items;
}

function render() {
  const items = getFiltered();
  const grid  = document.getElementById('items-grid');
  const empty = document.getElementById('empty-state');

  setText('results-count', `${items.length} ${items.length === 1 ? 'item' : 'itens'}`);

  if (!items.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = items.map((item, idx) => `
    <div class="item-card"
         data-type="${item.type}"
         data-id="${h(item.id)}"
         onclick="openModal('${h(item.id)}')"
         style="animation-delay:${idx * 25}ms">
      <div class="card-header">
        <div class="card-icon-name">
          <div class="card-icon">${item.icon || typeIcon(item.type)}</div>
          <div>
            <div class="card-name">${h(item.name)}</div>
            <div class="card-author">by ${h(item.author)}</div>
          </div>
        </div>
        <span class="type-badge type-badge-${item.type}">${typeLabel(item.type)}</span>
      </div>

      <p class="card-description">${h(item.description)}</p>

      <div class="card-tags">
        ${(item.tags || []).slice(0, 4).map(t => `<span class="tag">${h(t)}</span>`).join('')}
      </div>

      <div class="card-footer">
        <div class="card-meta">
          <span>v${h(item.version || '1.0.0')}</span>
          ${item.featured ? '<span>⭐ Destaque</span>' : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-primary"
            onclick="event.stopPropagation();openModal('${h(item.id)}')">
            Instalar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Skeletons ───────────────────────────────────────────
function showSkeletons(n) {
  document.getElementById('items-grid').innerHTML =
    Array(n).fill('<div class="loading-card"></div>').join('');
  setText('results-count', 'Carregando…');
}

// ── Modal ───────────────────────────────────────────────
let currentItem = null;

function openModal(id) {
  const item = registry.items.find(i => i.id === id);
  if (!item) return;
  currentItem = item;

  setText('modal-icon',        item.icon || typeIcon(item.type));
  setText('modal-title',       item.name);
  setText('modal-description', item.description);

  document.getElementById('modal-meta').innerHTML = `
    <span class="type-badge type-badge-${item.type}">${typeLabel(item.type)}</span>
    <span>por ${h(item.author)} · v${h(item.version || '1.0.0')}</span>
  `;
  document.getElementById('modal-tags').innerHTML =
    (item.tags || []).map(t => `<span class="tag">${h(t)}</span>`).join('');

  // Install commands
  setText('install-cmd-user',    buildCmd(item, true));
  setText('install-cmd-project', buildCmd(item, false));

  // Repo link
  const repoBtn = document.getElementById('modal-repo-btn');
  repoBtn.href = `https://github.com/${item.repo}`;

  // Reset UI state
  showInstallTab('user', document.querySelector('.install-tab'));

  // Show modal
  document.getElementById('modal-backdrop').classList.add('is-open');
  document.body.style.overflow = 'hidden';

  // Load docs async
  loadDocs(item);
}

function buildCmd(item, global) {
  const raw  = `https://raw.githubusercontent.com/${item.repo}/main/${item.file}`;
  const name = item.id;
  const file = item.file.split('/').pop();

  switch (item.type) {
    case 'skill':
      return global
        ? `mkdir -p ~/.claude/commands && curl -fsSL "${raw}" -o ~/.claude/commands/${name}.md`
        : `mkdir -p .claude/commands && curl -fsSL "${raw}" -o .claude/commands/${name}.md`;
    case 'playbook':
      return global
        ? `mkdir -p ~/.claude/playbooks && curl -fsSL "${raw}" -o ~/.claude/playbooks/${name}.md`
        : `mkdir -p .claude/playbooks && curl -fsSL "${raw}" -o .claude/playbooks/${name}.md`;
    case 'hook':
      return global
        ? `mkdir -p ~/.claude/hooks && curl -fsSL "${raw}" -o ~/.claude/hooks/${file}`
        : `mkdir -p .claude/hooks && curl -fsSL "${raw}" -o .claude/hooks/${file}`;
    case 'agent':
      return `# Siga as instruções em:\n# https://github.com/${item.repo}`;
    default:
      return `curl -fsSL "${raw}" -o ${file}`;
  }
}

async function loadDocs(item) {
  const loading = document.getElementById('docs-loading');
  const content = document.getElementById('docs-content');
  content.innerHTML = '';
  loading.style.display = 'block';

  const urls = [
    `https://raw.githubusercontent.com/${item.repo}/main/${item.file}`,
    `https://raw.githubusercontent.com/${item.repo}/main/README.md`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const md = await res.text();
      loading.style.display = 'none';
      content.innerHTML = renderMarkdown(md);
      return;
    } catch {
      continue;
    }
  }

  loading.style.display = 'none';
  content.innerHTML = `<p style="color:var(--text-3)">Documentação disponível em:
    <a href="https://github.com/${item.repo}" target="_blank" rel="noopener">
      github.com/${item.repo}
    </a></p>`;
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('is-open');
  document.body.style.overflow = '';
  currentItem = null;
}

// ── Install tabs ────────────────────────────────────────
function showInstallTab(tab, clickedBtn) {
  document.getElementById('install-tab-user').style.display    = tab === 'user'    ? 'block' : 'none';
  document.getElementById('install-tab-project').style.display = tab === 'project' ? 'block' : 'none';
  document.querySelectorAll('.install-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.install-tab')[tab === 'user' ? 0 : 1].classList.add('active');
}

// ── Copy to clipboard ───────────────────────────────────
function copyCmd(elementId, btn) {
  const text = document.getElementById(elementId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ Copiado!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = '📋 Copiar'; btn.classList.remove('copied'); }, 2000);
  });
}

// ── Simple Markdown renderer ────────────────────────────
function renderMarkdown(md) {
  // Escape HTML first
  let s = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks
  s = s.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);

  // Inline code
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  const lines = s.split('\n');
  const out = [];
  let inUl = false, inPre = false;

  for (const raw of lines) {
    if (raw.includes('<pre>'))  { inPre = true; }
    if (raw.includes('</pre>')) { inPre = false; out.push(raw); continue; }
    if (inPre) { out.push(raw); continue; }

    if (/^### /.test(raw)) {
      closeList(); out.push(`<h3>${inline(raw.slice(4))}</h3>`);
    } else if (/^## /.test(raw)) {
      closeList(); out.push(`<h2>${inline(raw.slice(3))}</h2>`);
    } else if (/^# /.test(raw)) {
      closeList(); out.push(`<h1>${inline(raw.slice(2))}</h1>`);
    } else if (/^> /.test(raw)) {
      closeList(); out.push(`<blockquote>${inline(raw.slice(2))}</blockquote>`);
    } else if (/^[-*] /.test(raw)) {
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${inline(raw.slice(2))}</li>`);
    } else if (raw.trim() === '') {
      closeList(); out.push('');
    } else {
      closeList(); out.push(`<p>${inline(raw)}</p>`);
    }
  }
  closeList();
  return out.join('\n');

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false; }
  }
}

function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// ── Event listeners ─────────────────────────────────────
function setupListeners() {
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    render();
  });

  document.querySelectorAll('.category-card').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-card').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      render();
    });
  });

  document.getElementById('sort-select').addEventListener('change', e => {
    sortBy = e.target.value;
    render();
  });

  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input').focus();
    }
    if (e.key === 'Escape') closeModal();
  });
}

// ── Helpers ─────────────────────────────────────────────
function h(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function typeIcon(t)  { return { skill:'⚡', playbook:'📋', agent:'🤖', hook:'🔗' }[t] || '✦'; }
function typeLabel(t) { return { skill:'Skill', playbook:'Playbook', agent:'Agente', hook:'Hook' }[t] || t; }

// ── Go ───────────────────────────────────────────────────
init();
