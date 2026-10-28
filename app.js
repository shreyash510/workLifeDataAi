// Namaste Work.Life viewer: a static reader for the namaste-worklife tutorial.
// Works on GitHub Pages (no build step, no server). The tutorial files are
// Blogger post fragments; this page renders them with the blogger-template look.

const CONTENT = 'namaste-worklife/'
const INDEX = 'index.html'
const REPO = 'shreyash510/workLifeDataAi'
const BRANCH = 'main'

// Only used when the file list can't come from the GitHub API (local server, rate limit).
const LAB_FILES = [
  'act365_cardholders.csv',
  'act365_door_events_sep2026.csv',
  'act_contacts.csv',
  'act_opportunities.csv',
  'bookings_sep2026.csv',
  'companies.csv',
  'contracts.csv',
  'excel_capacity_budget_2026.csv',
  'members.csv',
  'netsuite_gl_sep2026.csv',
  'plans.csv',
  'resources.csv',
  'sites.csv',
].map((f) => 'lab-data/' + f)

const STATUS_LABEL = { live: 'Live', written: 'Written', next: 'Next up', planned: 'Planned' }

const state = {
  files: null,
  series: { seasons: [], unlisted: [] },
  data: [],
  order: [],
  query: '',
  open: new Map(),
  csv: null,
  token: 0,
}

/* ---------- helpers ---------- */

const $ = (sel) => document.querySelector(sel)
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const contentUrl = (path) => CONTENT + path.split('/').map(encodeURIComponent).join('/')
const githubUrl = (path) => `https://github.com/${REPO}/blob/${BRANCH}/${CONTENT}${path}`
const routeHref = (path) => '#/' + path
const currentRoute = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || INDEX
const isNum = (v) => v !== '' && !isNaN(Number(v))

async function fetchText(path) {
  const res = await fetch(contentUrl(path), { cache: 'no-cache' })
  if (!res.ok) throw Object.assign(new Error(`${path} was not found`), { status: res.status })
  return res.text()
}

function fragment(html) {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content
}

// Resolve an href found inside `base` to a content-relative path (null for external links).
function resolvePath(base, href) {
  if (!href || href.startsWith('#') || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return null
  const clean = href.split('#')[0].split('?')[0]
  const parts = clean.startsWith('/') ? [] : base.split('/').slice(0, -1)
  for (const seg of clean.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg && seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section'

/* ---------- which files exist ---------- */

// The whole repo tree in one request; cached for 5 minutes to stay under the API rate limit.
async function listFromGitHub() {
  const key = 'nv-tree'
  try {
    const cached = JSON.parse(sessionStorage.getItem(key))
    if (cached && Date.now() - cached.at < 5 * 60 * 1000) return new Set(cached.files)
  } catch {}
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`)
  if (!res.ok) throw new Error('GitHub API returned ' + res.status)
  const { tree } = await res.json()
  const files = tree
    .filter((t) => t.type === 'blob' && t.path.startsWith(CONTENT))
    .map((t) => t.path.slice(CONTENT.length))
  try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), files })) } catch {}
  return new Set(files)
}

// Fallback: ask the server about every file we know of. Finds no unlisted chapters.
async function probe(paths) {
  const found = await Promise.all(
    paths.map((p) =>
      fetch(contentUrl(p), { method: 'HEAD', cache: 'no-cache' })
        .then((r) => (r.ok ? p : null))
        .catch(() => null)
    )
  )
  return new Set(found.filter(Boolean))
}

async function listFiles(indexHtml) {
  if (location.hostname.endsWith('github.io')) {
    try { return await listFromGitHub() } catch (err) { console.warn('[viewer] falling back to probing:', err.message) }
  }
  const linked = [...fragment(indexHtml).querySelectorAll('a[href]')]
    .map((a) => resolvePath(INDEX, a.getAttribute('href')))
    .filter((p) => p && /\.(html|csv)$/i.test(p))
  return probe([...new Set([INDEX, ...linked, ...LAB_FILES])])
}

/* ---------- parsing ---------- */

// "01 — What Is Work.Life? ⭐" -> { num: '01', name: 'What Is Work.Life?', star: true }
function splitTitle(raw) {
  const star = raw.includes('⭐')
  const text = raw.replace(/⭐/g, '').replace(/\s+/g, ' ').trim()
  const m = /^(\d+)\s*[—–-]\s*(.*)$/.exec(text)
  return m ? { num: m[1], name: m[2], star } : { num: null, name: text, star }
}

// Reads the .nz-step timeline in index.html into seasons -> chapters.
function parseSeries(html, existing) {
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

  // Chapters that exist in the repo but are not linked from the index yet.
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
function preparePost(html, path, existing) {
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

  // Heading ids so in-page "#section" links can scroll to them.
  const used = new Map()
  doc.querySelectorAll('h3, h4').forEach((h) => {
    let id = slugify(h.textContent)
    const n = used.get(id) || 0
    used.set(id, n + 1)
    if (n) id += '-' + n
    h.id = id
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
    if (target !== null) img.setAttribute('src', contentUrl(target))
  })

  const words = (doc.textContent || '').trim().split(/\s+/).length
  const box = document.createElement('div')
  box.appendChild(doc)
  return { title, html: box.innerHTML, minutes: Math.max(1, Math.round(words / 220)) }
}

function parseCsv(text) {
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

/* ---------- left navigation ---------- */

function navGroups() {
  const groups = state.series.seasons.map((s) => ({
    key: s.id,
    title: s.title.replace(/^Season (\d+) · /, 'S$1 · '),
    sub: s.sub,
    status: s.status,
    items: s.items,
  }))
  if (state.series.unlisted.length) groups.push({ key: 'unlisted', title: 'Not in index yet', items: state.series.unlisted })
  const dataItems = state.data.map((p) => ({ num: '▦', name: p.split('/').pop(), path: p, state: 'ready' }))
  if (dataItems.length) groups.push({ key: 'data', title: 'Lab data (CSV)', items: dataItems })
  return groups
}

function chapterLink(item, route) {
  const label =
    `<span class="num">${esc(item.num ?? '•')}</span>` +
    `<span class="name">${esc(item.name)}${item.star ? '<span class="star" title="Start here"> ⭐</span>' : ''}</span>`
  if (!item.path) return `<li class="chapter planned" title="Planned">${label}</li>`
  const title = item.state === 'missing' ? 'Linked from the index, but the file is not written yet' : item.name
  return (
    `<li class="chapter ${item.state}${route === item.path ? ' active' : ''}">` +
    `<a href="${esc(routeHref(item.path))}" title="${esc(title)}">${label}` +
    (item.state === 'missing' ? '<span class="todo-dot"></span>' : '') +
    (item.unlisted ? '<span class="tag new">new</span>' : '') +
    '</a></li>'
  )
}

function groupHtml(g, route) {
  // Only the first season (the start of the reading order) is open until the reader toggles others.
  const open = state.open.get(g.key) ?? g.key === 'season-0'
  return (
    `<li class="group ${g.status || ''}${open ? ' open' : ''}">` +
    `<button class="group-head" data-group="${esc(g.key)}" title="${esc(g.sub || '')}">` +
    `<span class="dot"></span><span class="group-title">${esc(g.title)}</span>` +
    '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button>' +
    (g.status ? `<div class="group-sub">${STATUS_LABEL[g.status]} · ${esc(g.sub)}</div>` : '') +
    `<ul>${g.items.map((it) => chapterLink(it, route)).join('')}</ul></li>`
  )
}

function renderNav() {
  const route = currentRoute()
  const nav = $('.navigation')
  const q = state.query.trim().toLowerCase()

  if (q) {
    const all = navGroups()
      .flatMap((g) => g.items)
      .filter((it) => `${it.num ?? ''} ${it.name}`.toLowerCase().includes(q))
    nav.innerHTML =
      `<div class="nav-caption">${all.length} result${all.length === 1 ? '' : 's'} <button data-clear>clear</button></div>` +
      `<ul class="flat">${all.map((it) => chapterLink(it, route)).join('')}</ul>`
    return
  }

  nav.innerHTML =
    '<ul>' +
    `<li class="home${route === INDEX ? ' active' : ''}"><a href="${routeHref(INDEX)}">` +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7v9h-6v-6H9v6H3z" /></svg>Series home</a></li>' +
    navGroups().map((g) => groupHtml(g, route)).join('') +
    '</ul>'
}

/* ---------- sidebar footer ---------- */

function renderStats() {
  const chapters = state.order.length - 1
  $('.side-stats').textContent = `${chapters} chapters · ${state.data.length} datasets`
}

/* ---------- main: chat-style thread ---------- */

const ICON_CLOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>'
const ICON_FILE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" /><path d="M14 3v5h5" /></svg>'
const ICON_LINK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>'
const ICON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>'
const ICON_UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" /></svg>'

// The page title is shown as the "question" bubble; the content is the "answer" below it.
function thread(crumb, title, body, actions) {
  return (
    '<div class="thread">' +
    `<div class="msg-user">${crumb ? `<span class="msg-crumb">${esc(crumb)}</span>` : ''}<div class="bubble">${esc(title)}</div></div>` +
    `<div class="msg-ai">${body}${actions ? `<div class="msg-actions">${actions}</div>` : ''}</div>` +
    '</div>'
  )
}

function setTopbar(crumb, path) {
  $('.top-crumb').textContent = crumb ? '› ' + crumb : ''
  $('.top-share').href = path ? githubUrl(path) : `https://github.com/${REPO}`
}

// Composer-style bar at the bottom: previous chapter, and a "continue to" link to the next one.
function setComposer(prev, next) {
  const target = next || { path: INDEX, name: 'Series home' }
  const label = next ? 'Continue to' : 'Back to'
  $('.composer-box').innerHTML =
    (prev
      ? `<a class="c-btn" href="${esc(routeHref(prev.path))}" title="Previous: ${esc(prev.name)}" aria-label="Previous chapter">${ICON_LEFT}</a>`
      : `<span class="c-btn disabled">${ICON_LEFT}</span>`) +
    `<a class="c-input" href="${esc(routeHref(target.path))}">${label} <b>${target.num ? esc(target.num) + ' — ' : ''}${esc(target.name)}</b></a>` +
    `<a class="c-send" href="${esc(routeHref(target.path))}" aria-label="${label} ${esc(target.name)}">${ICON_UP}</a>`
}

async function showPost(path, token) {
  const where = state.order.findIndex((o) => o.path === path)
  const crumb = where > 0 ? state.order[where].season : null
  const prev = where > 0 ? state.order[where - 1] : null
  const next = where >= 0 && where < state.order.length - 1 ? state.order[where + 1] : null
  let post
  try {
    post = preparePost(await fetchText(path), path, state.files)
  } catch {
    if (token !== state.token) return
    $('.main').innerHTML = thread(
      null,
      path,
      '<div class="post-body"><p>✍️ <b>Not written yet.</b> The index links to ' +
        `<code class="code">${esc(path)}</code>, but that file is not in the repo yet. Once it is written and pushed, it will appear here.</p>` +
        `<a class="button" href="${routeHref(INDEX)}">Back to series home</a></div>`
    )
    setTopbar(null, null)
    setComposer(null, null)
    return
  }
  if (token !== state.token) return

  $('.main').innerHTML = thread(
    crumb,
    post.title,
    `<div class="post-body">${post.html}</div>`,
    `<span>${ICON_CLOCK}${post.minutes} min read</span><span>${ICON_FILE}${esc(path)}</span>` +
      `<a href="${esc(githubUrl(path))}" target="_blank" rel="noopener">${ICON_LINK}View on GitHub</a>`
  )
  setTopbar(crumb, path)
  setComposer(prev, next)
}

/* ---------- main: CSV explorer ---------- */

async function showCsv(path, token) {
  setTopbar('Lab data', path)
  setComposer(null, null)
  let rows
  try {
    rows = parseCsv(await fetchText(path))
  } catch {
    if (token !== state.token) return
    $('.main').innerHTML = thread('Lab data', path.split('/').pop(), '<div class="post-body"><p>File not found.</p></div>')
    return
  }
  if (token !== state.token) return

  const [head = [], ...body] = rows
  const numeric = head.map((_, c) => body.length > 0 && body.every((r) => r[c] === '' || isNum(r[c])))
  state.csv = { head, body, numeric, filter: '', sort: { col: -1, dir: 1 } }

  $('.main').innerHTML = thread(
    'Lab data',
    path.split('/').pop(),
    '<div class="csv-tools"><input id="csv-filter" type="text" placeholder="Filter rows…" /><span id="csv-count"></span></div>' +
      '<div class="post-body"><div class="table"><table class="csv"><thead></thead><tbody></tbody></table></div></div>',
    `<span>▦ ${body.length} rows · ${head.length} columns</span>` +
      `<a href="${esc(githubUrl(path))}" target="_blank" rel="noopener">${ICON_LINK}View on GitHub</a>`
  )
  renderCsvRows()
}

function renderCsvRows() {
  const { head, body, numeric, filter, sort } = state.csv
  const q = filter.trim().toLowerCase()
  let shown = q ? body.filter((r) => r.some((v) => v.toLowerCase().includes(q))) : body
  if (sort.col >= 0) {
    const c = sort.col
    shown = [...shown].sort(
      (a, b) => (numeric[c] ? Number(a[c] || 0) - Number(b[c] || 0) : (a[c] || '').localeCompare(b[c] || '')) * sort.dir
    )
  }
  const num = (c) => (numeric[c] ? ' class="num"' : '')

  $('.csv thead').innerHTML =
    '<tr>' +
    head
      .map((h, c) => `<th data-col="${c}"${num(c)}>${esc(h)}<span class="sort">${sort.col === c ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</span></th>`)
      .join('') +
    '</tr>'
  $('.csv tbody').innerHTML = shown.map((r) => '<tr>' + head.map((_, c) => `<td${num(c)}>${esc(r[c])}</td>`).join('') + '</tr>').join('')
  $('#csv-count').textContent = q ? `${shown.length} of ${body.length} match` : ''
}

/* ---------- routing ---------- */

function onRoute() {
  const route = currentRoute()
  const token = ++state.token
  document.body.classList.remove('nav-open')
  window.scrollTo(0, 0)

  // Make sure the group holding the current page is expanded.
  for (const g of navGroups()) if (g.items.some((it) => it.path === route)) state.open.set(g.key, true)
  renderNav()

  state.csv = null
  $('.main').innerHTML = '<div class="thread skeleton">Loading…</div>'
  if (route.toLowerCase().endsWith('.csv')) showCsv(route, token)
  else showPost(route, token)
}

/* ---------- theme ---------- */

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

// The button names the mode it switches to; the icon is swapped by CSS from data-theme.
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  const next = theme === 'dark' ? 'light' : 'dark'
  const btn = $('.dark-switch')
  btn.title = `Switch to ${next} mode`
  btn.setAttribute('aria-label', btn.title)
  $('.dark-switch span').textContent = next === 'dark' ? 'Dark mode' : 'Light mode'
}

// Only an explicit click is remembered; until then the site follows the OS setting.
function storedTheme() {
  try {
    const saved = localStorage.getItem('nv-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {}
  return null
}

function savedTheme() {
  return storedTheme() || (systemDark.matches ? 'dark' : 'light')
}

systemDark.addEventListener('change', (e) => {
  if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light')
})

/* ---------- events ---------- */

const mobile = window.matchMedia('(max-width: 860px)')

document.addEventListener('click', (e) => {
  const t = e.target

  const groupBtn = t.closest('[data-group]')
  if (groupBtn) {
    const li = groupBtn.parentElement
    state.open.set(groupBtn.dataset.group, li.classList.toggle('open'))
    return
  }

  // In-page "#section" links scroll instead of changing the route.
  const anchor = t.closest('a[data-anchor]')
  if (anchor) {
    e.preventDefault()
    document.getElementById(anchor.dataset.anchor)?.scrollIntoView({ behavior: 'smooth' })
    return
  }

  const th = t.closest('.csv th[data-col]')
  if (th && state.csv) {
    const c = Number(th.dataset.col)
    const s = state.csv.sort
    state.csv.sort = { col: c, dir: s.col === c ? -s.dir : 1 }
    renderCsvRows()
    return
  }

  if (t.closest('[data-clear]')) {
    state.query = ''
    $('#search').value = ''
    renderNav()
  } else if (t.closest('.side-toggle')) {
    // Phones slide the sidebar over the page; wider screens collapse it.
    if (mobile.matches) document.body.classList.toggle('nav-open')
    else document.body.classList.toggle('side-closed')
  } else if (t.closest('.nav-overlay')) {
    document.body.classList.remove('nav-open')
  } else if (t.closest('.dark-switch')) {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    applyTheme(theme)
    try { localStorage.setItem('nv-theme', theme) } catch {}
  }
})

document.addEventListener('input', (e) => {
  if (e.target.id === 'search') {
    state.query = e.target.value
    renderNav()
  } else if (e.target.id === 'csv-filter' && state.csv) {
    state.csv.filter = e.target.value
    renderCsvRows()
  }
})

$('#search').addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  e.target.value = ''
  state.query = ''
  renderNav()
})

window.addEventListener('hashchange', onRoute)

/* ---------- start ---------- */

async function init() {
  applyTheme(savedTheme())
  const indexHtml = await fetchText(INDEX).catch(() => '')
  if (!indexHtml && location.protocol === 'file:') {
    $('.main').innerHTML = thread(
      null,
      'Open this through a web server',
      '<div class="post-body"><p>🌐 Browsers block reading local files from <code class="code">file://</code>. ' +
        'Run <code class="code">npx serve</code> in the repo folder, or use the GitHub Pages site.</p></div>'
    )
    return
  }

  state.files = await listFiles(indexHtml)
  state.series = parseSeries(indexHtml, state.files)
  state.data = [...state.files].filter((p) => p.endsWith('.csv')).sort()

  // Reading order used for previous / next buttons.
  state.order = [{ path: INDEX, name: 'Series home' }]
  for (const s of state.series.seasons) for (const it of s.items) if (it.state === 'ready') state.order.push({ ...it, season: s.title })
  for (const it of state.series.unlisted) state.order.push({ ...it, season: 'Not in index yet' })

  renderStats()
  onRoute()
}

init()
