import { useEffect, useState } from 'react'
import { INDEX, routeHref } from '../lib/content.js'

const STATUS_LABEL = { live: 'Live', written: 'Written', next: 'Next up', planned: 'Planned' }

function ChapterLink({ item, route }) {
  const label = (
    <>
      <span className="num">{item.num ?? '•'}</span>
      <span className="name">{item.name}{item.star && <span className="star" title="Start here"> ⭐</span>}</span>
    </>
  )
  if (!item.path) return <li className="chapter planned" title="Planned">{label}</li>
  return (
    <li className={`chapter ${item.state}${route === item.path ? ' active' : ''}`}>
      <a href={routeHref(item.path)} title={item.state === 'missing' ? 'Linked from the index, but the file is not written yet' : item.name}>
        {label}
        {item.state === 'missing' && <span className="todo-dot" />}
        {item.unlisted && <span className="tag new">new</span>}
      </a>
    </li>
  )
}

function Group({ title, sub, status, items, route }) {
  const hasActive = items.some((it) => it.path === route)
  const hasReady = items.some((it) => it.state !== 'planned')
  const [open, setOpen] = useState(hasReady || hasActive)
  useEffect(() => { if (hasActive) setOpen(true) }, [hasActive])
  return (
    <li className={`group ${status || ''}${open ? ' open' : ''}`}>
      <button className="group-head" onClick={() => setOpen((o) => !o)} title={sub}>
        <span className="dot" />
        <span className="group-title">{title}</span>
        <svg className="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
      </button>
      {status && <div className="group-sub">{STATUS_LABEL[status]} · {sub}</div>}
      <ul>{items.map((it, i) => <ChapterLink key={it.path || i} item={it} route={route} />)}</ul>
    </li>
  )
}

export default function NavMenu({ route, series, dataFiles, query, onClearQuery }) {
  const dataItems = dataFiles.map((p) => ({ num: '▦', name: p.split('/').pop(), path: p, state: 'ready' }))
  const q = query.trim().toLowerCase()

  if (q) {
    const all = [
      ...series.seasons.flatMap((s) => s.items),
      ...series.unlisted,
      ...dataItems,
    ].filter((it) => `${it.num ?? ''} ${it.name}`.toLowerCase().includes(q))
    return (
      <nav className="navigation">
        <div className="nav-caption">{all.length} result{all.length === 1 ? '' : 's'} <button onClick={onClearQuery}>clear</button></div>
        <ul className="flat">{all.map((it, i) => <ChapterLink key={(it.path || '') + i} item={it} route={route} />)}</ul>
      </nav>
    )
  }

  return (
    <nav className="navigation">
      <ul>
        <li className={'home' + (route === INDEX ? ' active' : '')}>
          <a href={routeHref(INDEX)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" /></svg>
            Series home
          </a>
        </li>
        {series.seasons.map((s) => (
          <Group key={s.id} title={s.title.replace(/^Season (\d+) · /, 'S$1 · ')} sub={s.sub} status={s.status} items={s.items} route={route} />
        ))}
        {series.unlisted.length > 0 && <Group title="Not in index yet" items={series.unlisted} route={route} />}
        {dataItems.length > 0 && <Group title="Lab data (CSV)" items={dataItems} route={route} />}
      </ul>
    </nav>
  )
}
