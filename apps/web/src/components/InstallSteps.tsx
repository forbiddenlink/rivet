import { REPO_URL } from '../lib/links'
import { CopyButton } from './CopyButton'

const STEPS: Array<{ command: string; note?: React.ReactNode }> = [
  { command: `git clone ${REPO_URL} && cd rivet` },
  { command: 'pnpm install && pnpm build' },
  {
    command: 'pnpm --filter @rivet/cli dev scan /path/to/project',
    note: (
      <>
        Add <code>--ai</code> with <code>OPENAI_API_KEY</code> set for model-written explanations,
        or <code>--format sarif</code> for CI.
      </>
    ),
  },
]

/** The real from-source install path. The npm package is not published yet. */
export function InstallSteps(): React.ReactElement {
  return (
    <ol className="steps">
      {STEPS.map((step, i) => (
        <li key={step.command} className="steps__item">
          <span className="steps__n" aria-hidden="true">
            {i + 1}
          </span>
          <div className="steps__body">
            <code className="steps__cmd">{step.command}</code>
            {step.note && <p className="steps__note">{step.note}</p>}
          </div>
          <CopyButton
            text={step.command}
            label="Copy"
            ariaLabel={`Copy step ${i + 1}`}
            className="btn btn--quiet btn--sm"
          />
        </li>
      ))}
    </ol>
  )
}
