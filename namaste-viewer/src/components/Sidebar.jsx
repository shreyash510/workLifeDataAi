import { useEffect, useState } from 'react'

function useActiveHeading(toc) {
  const [active, setActive] = useState(null)
  useEffect(() => {
    setActive(toc[0]?.id ?? null)
    if (!toc.length) return
    const onScroll = () => {
      let current = toc[0].id
      for (const t of toc) {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top < 120) current = t.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])
  return active
}

export default function Sidebar({ toc, series, dataCount, root }) {
  const active = useActiveHeading(toc)
  const items = series.seasons.flatMap((s) => s.items)
  const ready = items.filter((i) => i.state === 'ready').length + series.unlisted.length
  const missing = items.filter((i) => i.state === 'missing').length
  const planned = items.filter((i) => i.state === 'planned').length
  const total = ready + missing + planned

  return (
    <aside className="sidebar">
      {toc.length > 0 && (
        <section className="widget toc">
          <h3 className="widget-title">On this page</h3>
          <ol>
            {toc.map((t) => (
              <li key={t.id} className={`lvl-${t.level}${active === t.id ? ' active' : ''}`}>
                <button onClick={() => document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' })}>{t.text}</button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="widget">
        <h3 className="widget-title">Series progress</h3>
        <div className="progress">
          <span className="ready" style={{ flex: ready }} />
          <span className="missing" style={{ flex: missing }} />
          <span className="planned" style={{ flex: planned }} />
        </div>
        <ul className="legend">
          <li><i className="ready" />{ready} written</li>
          <li><i className="missing" />{missing} linked, not written</li>
          <li><i className="planned" />{planned} planned</li>
        </ul>
        <div className="stat-row">
          <div><b>{total}</b><span>chapters</span></div>
          <div><b>{series.seasons.length}</b><span>seasons</span></div>
          <div><b>{dataCount}</b><span>datasets</span></div>
        </div>
      </section>

      {root && (
        <section className="widget source">
          <h3 className="widget-title">Reading from</h3>
          <code>{root}</code>
          <p>Live: save any file there and this page updates.</p>
        </section>
      )}
    </aside>
  )
}
