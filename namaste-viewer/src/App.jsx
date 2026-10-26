import { useEffect, useMemo, useState } from 'react'
import { INDEX, fetchFiles, fetchText, parseSeries } from './lib/content.js'
import { useContentVersion, useRoute, useTheme } from './lib/hooks.js'
import Header from './components/Header.jsx'
import NavMenu from './components/NavMenu.jsx'
import PostView from './components/PostView.jsx'
import CsvView from './components/CsvView.jsx'
import Sidebar from './components/Sidebar.jsx'

export default function App() {
  const route = useRoute()
  const version = useContentVersion()
  const [theme, toggleTheme] = useTheme()
  const [files, setFiles] = useState(null)
  const [indexHtml, setIndexHtml] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toc, setToc] = useState([])

  useEffect(() => {
    let live = true
    Promise.all([fetchFiles(), fetchText(INDEX).catch(() => '')]).then(([f, html]) => {
      if (!live) return
      setFiles(f)
      setIndexHtml(html)
    })
    return () => { live = false }
  }, [version])

  const existing = useMemo(() => new Set(files?.files.map((f) => f.path) ?? []), [files])
  const series = useMemo(() => parseSeries(indexHtml, existing), [indexHtml, existing])
  const dataFiles = useMemo(() => [...existing].filter((p) => p.endsWith('.csv')).sort(), [existing])

  // Reading order used for previous / next buttons.
  const order = useMemo(() => {
    const list = [{ path: INDEX, name: 'Series home' }]
    for (const s of series.seasons) for (const it of s.items) if (it.state === 'ready') list.push({ ...it, season: s.title })
    for (const it of series.unlisted) list.push({ ...it, season: 'Not in index yet' })
    return list
  }, [series])

  useEffect(() => {
    setNavOpen(false)
    window.scrollTo(0, 0)
  }, [route])

  const where = order.findIndex((o) => o.path === route)
  const crumbs = where > 0 ? order[where].season : route.endsWith('.csv') ? 'Lab data' : null
  const isCsv = route.toLowerCase().endsWith('.csv')

  return (
    <div className={'app' + (navOpen ? ' nav-open' : '')}>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleNav={() => setNavOpen((o) => !o)}
        query={query}
        onQuery={setQuery}
      />
      <NavMenu route={route} series={series} dataFiles={dataFiles} query={query} onClearQuery={() => setQuery('')} />
      <div className="nav-overlay" onClick={() => setNavOpen(false)} />

      <main className="main">
        {!files ? (
          <div className="post-card skeleton">Reading tutorial folder…</div>
        ) : isCsv ? (
          <CsvView key={route} path={route} version={version} onToc={setToc} />
        ) : (
          <PostView
            path={route}
            version={version}
            existing={existing}
            root={files.root}
            crumbs={crumbs}
            prev={where > 0 ? order[where - 1] : null}
            next={where >= 0 && where < order.length - 1 ? order[where + 1] : null}
            onToc={setToc}
          />
        )}
      </main>

      <Sidebar toc={toc} series={series} dataCount={dataFiles.length} root={files?.root} />
    </div>
  )
}
