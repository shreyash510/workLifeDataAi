export const INDEX = 'index.html'

export async function fetchText(path) {
  const res = await fetch('/content/' + path.split('/').map(encodeURIComponent).join('/'), { cache: 'no-store' })
  if (!res.ok) throw Object.assign(new Error(`${path} was not found on disk`), { status: res.status })
  return res.text()
}

export async function fetchFiles() {
  const res = await fetch('/api/files', { cache: 'no-store' })
  return res.json()
}

// Resolve an href found inside `base` to a content-relative path (null for external links).
export function resolvePath(base, href) {
  if (!href || href.startsWith('#') || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return null
  const clean = href.split('#')[0].split('?')[0]
  const parts = clean.startsWith('/') ? [] : base.split('/').slice(0, -1)
  for (const seg of clean.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

export const routeHref = (path) => '#/' + path

function fragment(html) {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section'

// "01 — What Is Work.Life? ⭐" -> { num: '01', name: 'What Is Work.Life?', star: true }
function splitTitle(raw) {
  const star = raw.includes('⭐')
  const text = raw.replace(/⭐/g, '').replace(/\s+/g, ' ').trim()
  const m = /^(\d+)\s*[—–-]\s*(.*)$/.exec(text)
  return m ? { num: m[1], name: m[2], star } : { num: null, name: text, star }
}

// Reads the .nz-step timeline in index.html into seasons -> chapters.
export function parseSeries(html, existing) {
  const doc = fragment(html)
  const seasons = [...doc.querySelectorAll('.nz-step')].map((step, i) => {
    const cls = step.classList
    const status = cls.contains('nz-planned') ? 'planned' : cls.contains('nz-written') ? 'written' : cls.contains('nz-done') ? 'live' : 'next'
    const items = [...step.querySelectorAll('li')].map((li) => {
      const a = li.querySelector('a')
      const path = a ? resolvePath(INDEX, a.getAttribute('href')) : null
      const state = !path ? 'planned' : existing.has(path) ? 'ready' : 'missing'
      return { ...splitTitle(li.textContent), path, state }
    })
    return {
      id: 'season-' + i,
      title: step.querySelector('.nz-title')?.textContent.trim() || `Season ${i}`,
      sub: step.querySelector('.nz-sub')?.textContent.trim() || '',
      status,
      items,
    }
  })

  // Chapters that exist on disk but are not linked from the index yet.
  const linked = new Set(seasons.flatMap((s) => s.items.map((it) => it.path)).filter(Boolean))
  const unlisted = [...existing]
    .filter((p) => p.endsWith('.html') && p !== INDEX && !linked.has(p))
    .sort()
    .map((path) => {
      const base = path.split('/').pop().replace(/\.html$/, '')
      const m = /chapter-(\d+)-(.*)/.exec(base)
      const name = (m ? m[2] : base).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      return { num: m ? m[1] : null, name, star: false, path, state: 'ready', unlisted: true }
    })

  return { seasons, unlisted }
}

// Cleans a Blogger post fragment for in-app reading.
export function preparePost(html, path, existing) {
  const doc = fragment(html)
  doc.querySelectorAll('.page-flags').forEach((el) => el.remove())

  const titleEl = doc.querySelector('h2') || doc.querySelector('h1, h3')
  const title = titleEl ? titleEl.textContent.trim() : path
  titleEl?.remove()

  // Wrap tables so wide ones scroll horizontally (same idea as the template's .table).
  doc.querySelectorAll('table').forEach((table) => {
    table.removeAttribute('border')
    table.removeAttribute('cellpadding')
    const wrap = document.createElement('div')
    wrap.className = 'table'
    table.replaceWith(wrap)
    wrap.appendChild(table)
  })

  const used = new Map()
  const toc = []
  doc.querySelectorAll('h3, h4').forEach((h) => {
    let id = slugify(h.textContent)
    const n = used.get(id) || 0
    used.set(id, n + 1)
    if (n) id += '-' + n
    h.id = id
    toc.push({ id, text: h.textContent.trim(), level: h.tagName === 'H3' ? 3 : 4 })
  })

  doc.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href')
    if (href.startsWith('#')) {
      a.setAttribute('data-anchor', href.slice(1))
      return
    }
    const target = resolvePath(path, href)
    if (target === null) {
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      return
    }
    a.setAttribute('href', routeHref(target))
    if (!existing.has(target)) {
      a.classList.add('is-missing')
      a.title = 'Not written yet: ' + target
    }
  })

  doc.querySelectorAll('img[src]').forEach((img) => {
    const target = resolvePath(path, img.getAttribute('src'))
    if (target !== null) img.setAttribute('src', '/content/' + target)
  })

  const words = (doc.textContent || '').trim().split(/\s+/).length
  const box = document.createElement('div')
  box.appendChild(doc)
  return { title, html: box.innerHTML, toc, minutes: Math.max(1, Math.round(words / 220)) }
}

export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((v) => v !== ''))
}
