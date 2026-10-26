export default function Header({ theme, onToggleTheme, onToggleNav, query, onQuery }) {
  return (
    <header className="header">
      <div className="brand">
        <button className="icon-btn burger" aria-label="Toggle menu" onClick={onToggleNav}>
          <i /><i /><i />
        </button>
        <a href="#/index.html" className="brand-name">
          <span className="brand-mark">🙏</span>
          <span>Namaste <b>Work.Life</b></span>
        </a>
      </div>
      <div className="searchbar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          type="text"
          placeholder="Search chapters and data…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onQuery('')}
        />
      </div>
      <button className="dark-switch" onClick={onToggleTheme} aria-label="Toggle dark mode" title="Dark mode">
        <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        <i className={theme === 'dark' ? 'on' : ''} />
      </button>
    </header>
  )
}
