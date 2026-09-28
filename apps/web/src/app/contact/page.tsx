import type { Metadata } from 'next'

import { ProsePage } from '../../components/ProsePage'
import { REPO_URL } from '../../lib/links'

export const metadata: Metadata = {
  title: 'Contact: RIVET',
  description:
    'Report a bug, request a feature, ask a question, or report a vulnerability in RIVET.',
}

const CHANNELS = [
  {
    href: `${REPO_URL}/issues/new?labels=bug`,
    title: 'Report a bug',
    detail: 'Opens a new issue with the bug label. Include the code and the finding you expected.',
  },
  {
    href: `${REPO_URL}/issues/new?labels=enhancement`,
    title: 'Request a feature',
    detail: 'Opens a new issue with the enhancement label.',
  },
  {
    href: `${REPO_URL}/discussions`,
    title: 'Ask a question',
    detail: 'GitHub Discussions, for usage questions and ideas that are not yet a request.',
  },
  {
    href: `${REPO_URL}/pulls`,
    title: 'Contribute a change',
    detail: 'Open pull requests. CONTRIBUTING.md in the repo covers setup and conventions.',
  },
]

export default function ContactPage(): React.ReactElement {
  return (
    <ProsePage
      title="Contact"
      lede="RIVET is run in the open on GitHub. Pick the channel that matches what you need."
      sections={[
        {
          id: 'channels',
          title: 'GitHub',
          body: (
            <ul className="links">
              {CHANNELS.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    <b className="ext">{c.title}</b>
                    <span>{c.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: 'security',
          title: 'Report a vulnerability',
          body: (
            <>
              <p>
                Do not open a public issue for a security problem. Report it privately through
                GitHub instead:
              </p>
              <ul className="links">
                <li>
                  <a
                    href={`${REPO_URL}/security/advisories/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <b className="ext">Report privately</b>
                    <span>Opens a private security advisory visible only to maintainers.</span>
                  </a>
                </li>
              </ul>
              <p>Include steps to reproduce, and allow time for a fix before public disclosure.</p>
            </>
          ),
        },
      ]}
    />
  )
}
