import { useEffect, useMemo, useState } from 'react'
import { INDEX, fetchText, parseCsv, routeHref } from '../lib/content.js'

const isNum = (v) => v !== '' && !isNaN(Number(v))

export default function CsvView({ path, version, onToc }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState({ col: -1, dir: 1 })

  useEffect(() => {
    onToc([])
    let live = true
    fetchText(path)
      .then((text) => {
        if (!live) return
        setRows(parseCsv(text))
        setError(null)
      })
      .catch((err) => live && setError(err))
    return () => { live = false }
  }, [path, version, onToc])

  const [head, ...body] = rows || [[]]
  const numeric = useMemo(
    () => head.map((_, c) => body.length > 0 && body.every((r) => r[c] === '' || isNum(r[c]))),
    [rows]
  )

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let out = q ? body.filter((r) => r.some((v) => v.toLowerCase().includes(q))) : body
    if (sort.col >= 0) {
      const c = sort.col
      out = [...out].sort((a, b) =>
        (numeric[c] ? Number(a[c] || 0) - Number(b[c] || 0) : (a[c] || '').localeCompare(b[c] || '')) * sort.dir
      )
    }
    return out
  }, [rows, filter, sort, numeric])

  if (error) return <div className="post-card empty"><h1 className="post-title">File not found</h1><p>{path}</p></div>
  if (!rows) return <div className="post-card skeleton">Loading…</div>

  const toggleSort = (c) => setSort((s) => ({ col: c, dir: s.col === c ? -s.dir : 1 }))

  return (
    <article className="post-card">
      <div className="breadcrumbs">
        <a href={routeHref(INDEX)}>Home</a><span>›</span><span>Lab data</span>
      </div>
      <h1 className="post-title">{path.split('/').pop()}</h1>
      <div className="post-meta">
        <span>▦ {body.length} rows · {head.length} columns</span>
        <span>📄 {path}</span>
      </div>
      <div className="csv-tools">
        <input type="text" placeholder="Filter rows…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        {filter && <span>{shown.length} of {body.length} match</span>}
      </div>
      <div className="post-body">
        <div className="table">
          <table className="csv">
            <thead>
              <tr>
                {head.map((h, c) => (
                  <th key={c} onClick={() => toggleSort(c)} className={numeric[c] ? 'num' : ''}>
                    {h}<span className="sort">{sort.col === c ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i}>
                  {head.map((_, c) => <td key={c} className={numeric[c] ? 'num' : ''}>{r[c]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  )
}
