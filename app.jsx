/* app.jsx — Núcleo Marketplace React app */
const { useState, useEffect, useRef } = React;

// ── Data helpers ────────────────────────────────────────

function buildInstallCmd(item, scope) {
  const raw  = `https://raw.githubusercontent.com/${item.repo}/main/${item.file}`;
  const name = item.id;
  const base = scope === 'global' ? '~' : '.';

  switch (item.type) {
    case 'skill':
      return `mkdir -p ${base}/.claude/commands && curl -fsSL "${raw}" -o ${base}/.claude/commands/${name}.md`;
    case 'agent':
      return `mkdir -p ${base}/.claude/agents && curl -fsSL "${raw}" -o ${base}/.claude/agents/${name}.md`;
    case 'playbook':
      return `mkdir -p ${base}/.devin/playbooks && curl -fsSL "${raw}" -o ${base}/.devin/playbooks/${name}.yaml`;
    case 'hook':
      return `# Adicione ao settings.json do Claude Code\n# Veja em: https://github.com/${item.repo}/blob/main/${item.file}`;
    default:
      return `curl -fsSL "${raw}" -o ${item.file.split('/').pop()}`;
  }
}

function transformItem(item) {
  return {
    id:          item.id,
    name:        item.name,
    summary:     item.description,
    type:        item.type,
    icon:        item.icon || window.typeIcon(item.type),
    author:      item.author,
    version:     item.version || '1.0.0',
    tags:        item.tags || [],
    featured:    !!item.featured,
    repo:        item.repo,
    file:        item.file,
    cmdGlobal:   buildInstallCmd(item, 'global'),
    cmdProject:  buildInstallCmd(item, 'project'),
  };
}

// ── TopBar ──────────────────────────────────────────────

function TopBar({ theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo">◈</span>
        <span className="brand-name">Marketplace de Soluções de IA</span>
        <span className="brand-tag">beta</span>
      </div>
      <div className="topbar-actions">
        <a
          className="btn-ghost topbar-btn"
          href="https://github.com/leoporto15/leoporto15.github.io"
          target="_blank"
          rel="noopener"
        >
          {window.Icons.external}
          <span>GitHub</span>
        </a>
        <button
          className="btn-ghost topbar-btn icon-only"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? window.Icons.sun : window.Icons.moon}
        </button>
      </div>
    </header>
  );
}

// ── Hero ────────────────────────────────────────────────

function Hero({ items, activeType, onSelect }) {
  const count = (type) => items.filter(i => i.type === type).length;

  const cats = [
    { type: 'skill',    label: 'Skills',    icon: '⚡', desc: 'Slash commands para Claude Code' },
    { type: 'playbook', label: 'Playbooks', icon: '📋', desc: 'Automações para o Devin' },
    { type: 'agent',    label: 'Agentes',   icon: '🤖', desc: 'Sub-agentes especializados' },
    { type: 'hook',     label: 'Hooks',     icon: '🔗', desc: 'Automações de ciclo de vida' },
  ];

  return (
    <section className="hero">
      <div className="hero-eyebrow">Skills · Playbooks · Agentes · Hooks</div>
      <h1 className="hero-title">
        Instale em segundos,<br />acelere no mesmo dia
      </h1>
      <p className="hero-sub">
        {items.length} recursos da comunidade para turbinar seu fluxo com IA.
      </p>
      <div className="hero-cats">
        {cats.map(c => (
          <button
            key={c.type}
            className={`hero-cat${activeType === c.type ? ' active' : ''}`}
            onClick={() => onSelect(c.type)}
          >
            <span className="hero-cat-icon">{c.icon}</span>
            <span className="hero-cat-label">{c.label}</span>
            <span className="hero-cat-count">{count(c.type)}</span>
            <span className="hero-cat-desc">{c.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── SearchRow ───────────────────────────────────────────

function SearchRow({ search, onSearch, sort, onSort, view, onView, count, activeType, onClear }) {
  return (
    <div className="search-row">
      <div className="search-wrap">
        <span className="search-icon">{window.Icons.search}</span>
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por nome, tag ou autor… (⌘K)"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
        {activeType !== 'all' && (
          <button className="search-clear-filter" onClick={onClear}>
            {window.typeLabel(activeType)} ×
          </button>
        )}
      </div>
      <div className="search-controls">
        <select className="seg" value={sort} onChange={e => onSort(e.target.value)}>
          <option value="featured">Destaque</option>
          <option value="name">Nome</option>
          <option value="type">Tipo</option>
        </select>
        <div className="view-btns">
          <button className={`view-btn${view === 'grid'  ? ' active' : ''}`} onClick={() => onView('grid')}  title="Grade">   {window.Icons.grid}  </button>
          <button className={`view-btn${view === 'list'  ? ' active' : ''}`} onClick={() => onView('list')}  title="Lista">   {window.Icons.rows}  </button>
          <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => onView('table')} title="Tabela">  {window.Icons.table} </button>
        </div>
      </div>
    </div>
  );
}

// ── TypeTabs ────────────────────────────────────────────

function TypeTabs({ activeType, onSelect, items }) {
  const types = ['all', 'skill', 'playbook', 'agent', 'hook'];
  const label = { all: 'Todos', skill: 'Skills', playbook: 'Playbooks', agent: 'Agentes', hook: 'Hooks' };
  const count = (t) => t === 'all' ? items.length : items.filter(i => i.type === t).length;

  return (
    <div className="type-tabs">
      {types.map(t => (
        <button
          key={t}
          className={`type-tab${activeType === t ? ' active' : ''}`}
          onClick={() => onSelect(t)}
        >
          {label[t]}
          <span className="type-tab-count">{count(t)}</span>
        </button>
      ))}
    </div>
  );
}

// ── Card ────────────────────────────────────────────────

function Card({ item, onOpen }) {
  return (
    <article
      className={`card${item.featured ? ' featured' : ''}`}
      onClick={() => onOpen(item)}
    >
      <div className="card-top">
        <span className="card-icon">{item.icon}</span>
        <span className={`badge badge-${item.type}`}>{window.typeLabel(item.type)}</span>
      </div>
      <div className="card-name">{item.name}</div>
      <div className="card-summary">{item.summary}</div>
      <div className="card-bottom">
        <div className="card-tags">
          {item.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="card-author">by {item.author}</div>
      </div>
    </article>
  );
}

// ── GridView ────────────────────────────────────────────

function GridView({ items, onOpen }) {
  return (
    <div className="grid">
      {items.map(item => (
        <Card key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ── ListView ────────────────────────────────────────────

function ListView({ items, onOpen }) {
  return (
    <div className="list">
      {items.map(item => (
        <div key={item.id} className="row" onClick={() => onOpen(item)}>
          <span className="row-icon">{item.icon}</span>
          <div className="row-body">
            <div className="row-name">{item.name}</div>
            <div className="row-summary">{item.summary}</div>
          </div>
          <div className="row-meta">
            <span className={`badge badge-${item.type}`}>{window.typeLabel(item.type)}</span>
            <span className="row-author">{item.author}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TableView ───────────────────────────────────────────

function TableView({ items, onOpen }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Autor</th>
            <th>Tags</th>
            <th>Destaque</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => onOpen(item)} className="table-row">
              <td>
                <span className="table-icon">{item.icon}</span>
                {item.name}
              </td>
              <td><span className={`badge badge-${item.type}`}>{window.typeLabel(item.type)}</span></td>
              <td>{item.author}</td>
              <td>{item.tags.slice(0, 3).join(', ')}</td>
              <td>{item.featured ? '⭐' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SlideOver ───────────────────────────────────────────

function SlideOver({ item, onClose }) {
  const [tab, setTab] = useState('global');
  const [copied, setCopied] = useState(false);
  const [docs, setDocs] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTab('global');
    setCopied(false);
    setDocs(null);
    setDocsLoading(true);

    const urls = [
      `https://raw.githubusercontent.com/${item.repo}/main/${item.file}`,
      `https://raw.githubusercontent.com/${item.repo}/main/README.md`,
    ];

    (async () => {
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const md = await res.text();
          setDocs(md);
          setDocsLoading(false);
          return;
        } catch { continue; }
      }
      setDocs(null);
      setDocsLoading(false);
    })();
  }, [item ? item.id : null]);

  const isOpen = !!item;
  const cmd = item ? (tab === 'global' ? item.cmdGlobal : item.cmdProject) : '';

  function copyCmd() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd).then(done).catch(() => {
        fallbackCopy(cmd); done();
      });
    } else { fallbackCopy(cmd); done(); }
  }

  function fallbackCopy(text) {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }

  function renderDocs(md) {
    if (!md) return '';
    let s = md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    s = s.replace(/```(?:\w+)?\n([\s\S]*?)```/g, (_, c) => `<pre><code>${c.trim()}</code></pre>`);
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    const lines = s.split('\n');
    const out = []; let inUl = false, inPre = false;

    function il(text) {
      const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
          if (/^(javascript|data|vbscript):/i.test(url.trim())) return esc(label);
          return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
        });
    }
    function end() { if (inUl) { out.push('</ul>'); inUl = false; } }

    for (const raw of lines) {
      if (raw.includes('<pre>'))  { inPre = true; }
      if (raw.includes('</pre>')) { inPre = false; out.push(raw); continue; }
      if (inPre) { out.push(raw); continue; }

      if (/^### /.test(raw))     { end(); out.push(`<h3>${il(raw.slice(4))}</h3>`); }
      else if (/^## /.test(raw)) { end(); out.push(`<h2>${il(raw.slice(3))}</h2>`); }
      else if (/^# /.test(raw))  { end(); out.push(`<h1>${il(raw.slice(2))}</h1>`); }
      else if (/^> /.test(raw))  { end(); out.push(`<blockquote>${il(raw.slice(2))}</blockquote>`); }
      else if (/^[-*] /.test(raw)) { if (!inUl) { out.push('<ul>'); inUl = true; } out.push(`<li>${il(raw.slice(2))}</li>`); }
      else if (raw.trim() === '') { end(); out.push(''); }
      else { end(); out.push(`<p>${il(raw)}</p>`); }
    }
    end();
    return out.join('\n');
  }

  return (
    <>
      <div className={`slideover-backdrop${isOpen ? ' so-open' : ''}`} onClick={onClose} />
      <aside className={`slideover${isOpen ? ' so-open' : ''}`} onClick={e => e.stopPropagation()}>
        {item && (
          <>
            <div className="slideover-header">
              <div className="slideover-title-row">
                <span className="slideover-icon">{item.icon}</span>
                <div style={{flex:1}}>
                  <div className="slideover-name">{item.name}</div>
                  <div className="slideover-author">por {item.author} · v{item.version}</div>
                </div>
                <button type="button" className="slideover-close" onClick={onClose}>{window.Icons.x}</button>
              </div>
              <div className="slideover-badges">
                <span className={`badge badge-${item.type}`}>{window.typeLabel(item.type)}</span>
                {item.featured && <span className="badge badge-featured">⭐ Destaque</span>}
              </div>
              <p className="slideover-summary">{item.summary}</p>
              <div className="slideover-tags">
                {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            </div>

            <div className="slideover-body">
              <div className="so-install-block">
                <div className="so-install-label">
                  {window.Icons.download}
                  {item.type !== 'hook' ? 'Instalar' : 'Configurar'}
                </div>
                {item.type !== 'hook' && (
                  <div className="so-install-tabs">
                    <button type="button" className={`so-install-tab${tab === 'global' ? ' active' : ''}`} onClick={() => setTab('global')}>
                      Global
                    </button>
                    <button type="button" className={`so-install-tab${tab === 'project' ? ' active' : ''}`} onClick={() => setTab('project')}>
                      Projeto
                    </button>
                  </div>
                )}
                <pre className="so-install-cmd">{cmd}</pre>
                <div className="so-install-actions">
                  <button type="button" className={`so-copy-btn${copied ? ' copied' : ''}`} onClick={copyCmd}>
                    {copied ? window.Icons.check : window.Icons.copy}
                    {copied ? 'Copiado!' : 'Copiar comando'}
                  </button>
                  <a
                    className="so-gh-btn"
                    href={`https://github.com/${item.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {window.Icons.external} Ver no GitHub
                  </a>
                </div>
              </div>

              <div className="slideover-docs">
                <div className="docs-title">Documentação</div>
                {docsLoading && (
                  <div className="docs-loading">
                    <span className="spinner" /> Carregando…
                  </div>
                )}
                {!docsLoading && docs && (
                  <div
                    className="docs-content"
                    dangerouslySetInnerHTML={{ __html: renderDocs(docs) }}
                  />
                )}
                {!docsLoading && !docs && (
                  <p className="docs-empty">
                    Documentação disponível em{' '}
                    <a href={`https://github.com/${item.repo}`} target="_blank" rel="noopener">
                      github.com/{item.repo}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ── App ─────────────────────────────────────────────────

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'dark'
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState('featured');
  const [view, setView]           = useState('grid');
  const [activeType, setActiveType] = useState('all');
  const [selected, setSelected]   = useState(null);

  const browseRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch('registry.json')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { setItems(data.items.map(transformItem)); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        browseRef.current && browseRef.current.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => document.querySelector('.search-input') && document.querySelector('.search-input').focus(), 400);
      }
      if (e.key === 'Escape') setSelected(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function getFiltered() {
    let list = items.slice();
    if (activeType !== 'all') list = list.filter(i => i.type === activeType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q)) ||
        i.author.toLowerCase().includes(q)
      );
    }
    if (sort === 'name')     list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'type') list.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    else                     list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }

  function selectType(type) {
    setActiveType(type);
    setSearch('');
    browseRef.current && browseRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  const filtered = getFiltered();

  return (
    <>
      <TopBar
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      />

      <Hero
        items={items}
        activeType={activeType}
        onSelect={selectType}
      />

      <main className="main" ref={browseRef} id="browse">
        <SearchRow
          search={search}
          onSearch={q => { setSearch(q); if (q) setActiveType('all'); }}
          sort={sort}
          onSort={setSort}
          view={view}
          onView={setView}
          count={filtered.length}
          activeType={activeType}
          onClear={() => setActiveType('all')}
        />

        <TypeTabs
          activeType={activeType}
          onSelect={t => { setActiveType(t); setSearch(''); }}
          items={items}
        />

        <div className="results-header">
          <span className="results-count">
            {loading ? 'Carregando…' : `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'}`}
          </span>
        </div>

        {loading && (
          <div className="grid">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p>Não foi possível carregar o registry.</p>
            <a href="registry.json">Ver JSON</a>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Nenhum resultado</div>
            <div className="empty-sub">Tente outros termos ou limpe o filtro.</div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          view === 'grid'  ? <GridView  items={filtered} onOpen={setSelected} /> :
          view === 'list'  ? <ListView  items={filtered} onOpen={setSelected} /> :
                             <TableView items={filtered} onOpen={setSelected} />
        )}
      </main>

      <footer className="footer">
        <span>Marketplace de Soluções de IA · Comunidade</span>
        <a href="https://github.com/leoporto15/leoporto15.github.io" target="_blank" rel="noopener">
          Contribuir {window.Icons.external}
        </a>
      </footer>

      <SlideOver item={selected} onClose={() => setSelected(null)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
