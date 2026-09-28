import type { Metadata } from 'next'

import { ProsePage } from '../../components/ProsePage'

export const metadata: Metadata = {
  title: 'Privacy: RIVET',
  description: 'How RIVET handles the code you scan and what it stores in your browser.',
}

export default function PrivacyPage(): React.ReactElement {
  return (
    <ProsePage
      title="Privacy"
      meta="Last updated: September 2026"
      lede="RIVET is built to scan code without keeping it. This page lists exactly what goes where."
      sections={[
        {
          id: 'dashboard',
          title: 'The web dashboard',
          body: (
            <ul>
              <li>
                Code you paste or upload is sent to the server, written to a temporary file for the
                scan, and deleted when the scan finishes. It is not stored.
              </li>
              <li>Results are returned to your browser and are not kept on the server.</li>
              <li>Code is not sold or shared.</li>
            </ul>
          ),
        },
        {
          id: 'ai',
          title: 'AI explanations',
          body: (
            <p>
              When the server has an OpenAI key, the details of a finding you open (rule, message,
              severity and category) are sent to OpenAI to write its explanation. Your file is not
              sent, but a finding&apos;s message can quote a short fragment of code. Without a key,
              explanations come from RIVET&apos;s built-in guide and nothing leaves the server.
            </p>
          ),
        },
        {
          id: 'cli',
          title: 'The CLI',
          body: (
            <p>
              The CLI runs on your machine and your code stays there. With <code>--ai</code>, the
              same finding details plus the file path are sent to OpenAI using your own key.
            </p>
          ),
        },
        {
          id: 'storage',
          title: 'Browser storage',
          body: (
            <p>
              RIVET sets no cookies and runs no analytics or tracking scripts. The dashboard saves
              your engine and severity settings in your browser&apos;s local storage under{' '}
              <code>rivet-config</code>; clearing site data removes it. The hosting provider keeps
              standard request logs.
            </p>
          ),
        },
        {
          id: 'contact',
          title: 'Questions',
          body: (
            <p>Privacy questions can be raised through the GitHub repository&apos;s discussions.</p>
          ),
        },
      ]}
    />
  )
}
