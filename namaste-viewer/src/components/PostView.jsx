import { useEffect, useRef, useState } from 'react'
import { INDEX, fetchText, preparePost, routeHref } from '../lib/content.js'

export default function PostView({ path, version, existing, root, crumbs, prev, next, onToc }) {
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    let live = true
    fetchText(path)
      .then((html) => {
        if (!live) return
        const prepared = preparePost(html, path, existing)
        setPost(prepared)
        setError(null)
        onToc(prepared.toc)
      })
      .catch((err) => {
        if (!live) return
        setPost(null)
        setError(err)
        onToc([])
      })
    return () => { live = false }
  }, [path, version, existing, onToc])

  // In-page "#section" links scroll instead of changing the route.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onClick = (e) => {
      const a = e.target.closest('a[data-anchor]')
      if (!a) return
      e.preventDefault()
      document.getElementById(a.dataset.anchor)?.scrollIntoView({ behavior: 'smooth' })
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [post])

  if (error) {
    return (
      <article className="post-card empty">
        <div className="empty-icon">✍️</div>
        <h1 className="post-title">Not written yet</h1>
        <p>The index links to <code className="code">{path}</code>, but that file does not exist in the tutorial folder.</p>
        <p>Create it and this page will appear here automatically.</p>
        <a className="button" href={routeHref(INDEX)}>Back to series home</a>
      </article>
    )
  }
  if (!post) return <div className="post-card skeleton">Loading…</div>

  const fsPath = root ? `${root}/${path}` : path
  return (
    <>
      <article className="post-card">
        <div className="breadcrumbs">
          <a href={routeHref(INDEX)}>Home</a>
          {crumbs && <><span>›</span><span>{crumbs}</span></>}
        </div>
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <span>⏱ {post.minutes} min read</span>
          <span title={fsPath}>📄 {path}</span>
          <a href={`vscode://file/${fsPath}`}>Open in VS Code</a>
        </div>
        <div ref={bodyRef} className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>

      {(prev || next) && (
        <div className="post-nav">
          {prev ? (
            <a className="prev" href={routeHref(prev.path)}>
              <span className="nav-label">← Previous</span>
              <span className="nav-title">{prev.num ? `${prev.num} — ` : ''}{prev.name}</span>
            </a>
          ) : <span />}
          {next ? (
            <a className="next" href={routeHref(next.path)}>
              <span className="nav-label">Next →</span>
              <span className="nav-title">{next.num ? `${next.num} — ` : ''}{next.name}</span>
            </a>
          ) : <span />}
        </div>
      )}
    </>
  )
}
