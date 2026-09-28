import type { Metadata } from 'next'
import Link from 'next/link'

import { ProsePage } from '../../components/ProsePage'
import { ENGINES } from '../../lib/analysis'
import { REPO_URL } from '../../lib/links'

export const metadata: Metadata = {
  title: 'About: RIVET',
  description:
    'RIVET is an open-source code quality tool: eight static analysis engines for JavaScript and TypeScript, with explanations for every finding.',
}

const ENGINE_NOTES: Record<(typeof ENGINES)[number]['key'], string> = {
  security: 'injection, hardcoded secrets, unsafe HTML, weak crypto and randomness',
  bugs: 'loose equality, constant or duplicate conditions, empty catches, unawaited promises',
  performance: 'nested and blocking loops, DOM queries in loops, re-render waste',
  architecture: 'circular dependencies, layer violations, coupling',
  smells: 'long methods, god objects, deep nesting, duplication, magic numbers',
  practices: 'leftover console and debugger statements, thrown strings, naming',
  dependencies: 'unused code, duplicate and side-effect imports, barrel-file chains',
  flows: 'async paths without error handling, untested routes, missing error boundaries',
}

export default function AboutPage(): React.ReactElement {
  return (
    <ProsePage
      title="About RIVET"
      lede="RIVET finds quality and security problems in JavaScript and TypeScript and explains each one, so a finding is something you can act on rather than a flag to dismiss."
      sections={[
        {
          id: 'engines',
          title: 'What it checks',
          body: (
            <>
              <p>Eight engines run in parallel on the parsed syntax tree:</p>
              <ul>
                {ENGINES.map((e) => (
                  <li key={e.key}>
                    <strong>{e.label}</strong>: {ENGINE_NOTES[e.key]}
                  </li>
                ))}
              </ul>
              <p>
                The <Link href="/dashboard">dashboard</Link> scans one file. The CLI scans a whole
                project, which is where the cross-file rules such as circular dependencies apply.
              </p>
            </>
          ),
        },
        {
          id: 'explanations',
          title: 'Explanations',
          body: (
            <p>
              Every finding comes with guidance on why it matters and how to fix it. With an OpenAI
              key configured, a model writes that guidance; without one, RIVET uses its built-in
              guide for the finding&apos;s category. The dashboard labels which one you are reading.
            </p>
          ),
        },
        {
          id: 'status',
          title: 'Project status',
          body: (
            <p>
              RIVET is early. It runs from source today; the npm package is not published yet. The{' '}
              <a href={`${REPO_URL}/blob/main/docs/ROADMAP.md`} className="ext">
                roadmap
              </a>{' '}
              lists what is planned.
            </p>
          ),
        },
        {
          id: 'open-source',
          title: 'Open source',
          body: (
            <p>
              RIVET is MIT licensed and{' '}
              <a href={REPO_URL} className="ext">
                developed on GitHub
              </a>
              . Issues, discussions and pull requests are welcome; the{' '}
              <Link href="/contact">contact page</Link> lists where each one goes.
            </p>
          ),
        },
      ]}
    />
  )
}
