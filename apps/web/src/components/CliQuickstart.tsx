'use client'

import { CopyButton } from './CopyButton'

const INSTALL = 'pnpm add -g @rivet/cli'
const SCAN = 'rivet scan .'
const SCAN_AI = 'rivet scan . --ai --tech-debt'

export function CliQuickstart() {
  return (
    <div className="terminal">
      <div className="terminal__chrome">
        <span className="terminal__dot terminal__dot--accent" />
        <span className="terminal__dot" />
        <span className="terminal__dot" />
        <span className="terminal__title">quickstart</span>
        <div className="terminal__chrome-actions">
          <CopyButton text={`${INSTALL}\n${SCAN}\n${SCAN_AI}`} label="Copy commands" />
        </div>
      </div>
      <pre className="terminal__body">
        <span className="terminal__comment"># Install</span>
        {`
`}
        <span className="terminal__prompt">$</span> <span className="terminal__cmd">{INSTALL}</span>
        {`

`}
        <span className="terminal__comment"># Scan</span>
        {`
`}
        <span className="terminal__prompt">$</span> <span className="terminal__cmd">{SCAN}</span>
        {`

`}
        <span className="terminal__comment"># With AI explanations + debt metrics</span>
        {`
`}
        <span className="terminal__prompt">$</span> <span className="terminal__cmd">{SCAN_AI}</span>
      </pre>
    </div>
  )
}
