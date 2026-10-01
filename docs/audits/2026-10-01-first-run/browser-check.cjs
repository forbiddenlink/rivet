// Optional local browser check. Supply an installed Playwright module path; never calls a provider.
const { chromium } = require(process.argv[2] || '@playwright/test')
const assert = require('node:assert/strict')
const path = require('node:path')
;(async () => {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    const requests = []
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin !== 'http://127.0.0.1:4322') return route.abort()
      if (url.pathname === '/api/explain') {
        const body = route.request().postDataJSON()
        requests.push(body)
        return route.fulfill({
          json: {
            explanation: 'Synthetic guidance',
            remediation: 'Review the synthetic fixture.',
            source: body.ai === true ? 'ai' : 'guide',
          },
        })
      }
      return route.continue()
    })
    await page.goto('http://127.0.0.1:4322/dashboard')
    await page
      .locator('#code-input')
      .fill('export function demo(value: any) { if (value == 42) { return eval(value) } }')
    await page.getByRole('button', { name: 'Analyze code', exact: true }).click()
    const consent = page.getByRole('button', { name: 'Send this finding to OpenAI', exact: true })
    await consent.waitFor()
    await page.getByText('Synthetic guidance', { exact: true }).waitFor()
    assert.ok(requests.length > 0)
    assert.ok(
      requests.every((r) => r.ai === false),
      'Opening findings must not opt into AI'
    )
    await consent.click()
    await page.getByRole('button', { name: 'AI requested for this finding' }).waitFor()
    await page.waitForResponse((response) => response.url().endsWith('/api/explain'))
    assert.equal(requests.filter((r) => r.ai === true).length, 1)
    const nextGuide = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/explain') && response.request().postDataJSON().ai === false
    )
    await page.getByRole('button', { name: 'Next finding', exact: true }).click()
    await nextGuide
    await consent.waitFor()
    await page.getByText('Synthetic guidance', { exact: true }).waitFor()
    assert.equal(
      requests.filter((r) => r.ai === true).length,
      1,
      'Consent must not carry to the next finding'
    )
    assert.equal(requests.at(-1).ai, false)
    assert.ok(requests.every((r) => !('code' in r || 'filePath' in r)))
    await page.screenshot({ path: path.join(__dirname, 'consent.png'), fullPage: true })
    process.stdout.write(
      JSON.stringify(
        {
          passed: true,
          requests: requests.map((r) => ({ ruleId: r.detection.ruleId, ai: r.ai })),
          externalRequestsAllowed: false,
        },
        null,
        2
      )
    )
  } finally {
    await browser.close()
  }
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`)
  process.exitCode = 1
})
