import type { ReactNode } from 'react'

export interface ProseSection {
  id: string
  title: string
  body: ReactNode
}

interface ProsePageProps {
  title: string
  lede: ReactNode
  meta?: string
  sections: readonly ProseSection[]
}

/** Shared layout for About, Contact and Privacy: a readable column and an on-page index. */
export function ProsePage({ title, lede, meta, sections }: ProsePageProps): React.ReactElement {
  return (
    <main className="wrap prose-grid">
      <article className="prose">
        <h1>{title}</h1>
        {meta && <p className="prose__meta">{meta}</p>}
        <p className="prose__lede">{lede}</p>
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
            <h2 id={`${s.id}-title`}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
      <nav className="toc" aria-label="On this page">
        <p>On this page</p>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
      </nav>
    </main>
  )
}
