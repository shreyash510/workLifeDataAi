import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

// The tutorial folder that gets visualised. Override with CONTENT_DIR=... npm run dev
const CONTENT_DIR = path.resolve(here, process.env.CONTENT_DIR || '../namaste-worklife')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

const toPosix = (p) => p.split(path.sep).join('/')

// Returns a content-relative posix path, or null when the file is outside CONTENT_DIR.
function relInside(abs) {
  const rel = path.relative(CONTENT_DIR, abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return toPosix(rel)
}

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) listFiles(abs, out)
    else out.push({ path: relInside(abs), size: fs.statSync(abs).size, mtime: fs.statSync(abs).mtimeMs })
  }
  return out
}

function contentMiddleware(req, res, next) {
  const url = decodeURIComponent((req.url || '').split('?')[0])

  if (url === '/api/files') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ root: toPosix(CONTENT_DIR), files: fs.existsSync(CONTENT_DIR) ? listFiles(CONTENT_DIR) : [] }))
    return
  }

  if (url.startsWith('/content/')) {
    const abs = path.resolve(CONTENT_DIR, '.' + url.slice('/content'.length))
    if (!relInside(abs) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      res.statusCode = 404
      res.end('Not found')
      return
    }
    res.setHeader('Content-Type', MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-store')
    fs.createReadStream(abs).pipe(res)
    return
  }

  next()
}

function namasteContent() {
  return {
    name: 'namaste-content',
    configureServer(server) {
      server.middlewares.use(contentMiddleware)
      // Watch the tutorial folder and tell the browser to re-read it on every save.
      server.watcher.add(CONTENT_DIR)
      server.watcher.on('all', (event, file) => {
        const rel = relInside(path.resolve(file))
        if (rel) server.ws.send({ type: 'custom', event: 'content-changed', data: { event, path: rel } })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(contentMiddleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), namasteContent()],
  server: { port: 5180 },
})
