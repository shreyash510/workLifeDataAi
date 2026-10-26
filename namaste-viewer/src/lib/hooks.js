import { useEffect, useState } from 'react'
import { INDEX } from './content.js'

const currentRoute = () => decodeURIComponent(window.location.hash.replace(/^#\/?/, '')) || INDEX

export function useRoute() {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const onHash = () => setRoute(currentRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

// Bumps whenever a file in the tutorial folder is saved, added or deleted.
export function useContentVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!import.meta.hot) return
    const bump = () => setVersion((v) => v + 1)
    import.meta.hot.on('content-changed', bump)
    return () => import.meta.hot.off?.('content-changed', bump)
  }, [])
  return version
}

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('nv-theme')
      if (saved) return saved
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('nv-theme', theme) } catch {}
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}
