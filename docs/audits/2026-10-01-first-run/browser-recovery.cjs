const { chromium } = require(process.argv[2] || '@playwright/test')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '../../..')
const out = path.resolve(process.argv[3] || __dirname)
fs.mkdirSync(out, { recursive: true })
const base = 'http://127.0.0.1:4326'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const log = fs.openSync(path.join(out, 'server.log'), 'w')
  const server = spawn(
    process.execPath,
    [
      path.join(root, 'apps/web/node_modules/next/dist/bin/next'),
      'start',
      '-H',
      '127.0.0.1',
      '-p',
      '4326',
    ],
    { cwd: path.join(root, 'apps/web'), stdio: ['ignore', log, log] }
  )
  let browser
  const results = []
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(base)).ok) break
      } catch {}
      if (i === 99) throw new Error('Local server did not start')
      await sleep(200)
    }
    browser = await chromium.launch()
    for (const [name, viewport] of [
      ['desktop', { width: 1440, height: 1000 }],
      ['mobile', { width: 390, height: 844 }],
    ]) {
      const page = await browser.newPage({ viewport })
      page.setDefaultTimeout(7000)
      let mode = 'guide-network',
        aiCalls = 0,
        held
      const requests = []
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (url.origin !== base) return route.abort()
        if (url.pathname !== '/api/explain') return route.continue()
        const body = route.request().postDataJSON()
        requests.push(body)
        assert.equal('code' in body || 'filePath' in body, false)
        if (mode === 'guide-network') return route.abort('failed')
        if (body.ai) aiCalls++
        if (body.ai && mode === 'network') return route.abort('failed')
        if (body.ai && mode === '429')
          return route.fulfill({ status: 429, json: { error: 'Synthetic rate limit' } })
        if (body.ai && mode === 'hold') {
          held = route
          return
        }
        return route.fulfill({
          json: {
            explanation: body.ai ? 'Synthetic AI recovered' : 'Synthetic built-in guidance',
            remediation: 'Review the fixture.',
            source: body.ai ? 'ai' : 'guide',
          },
        })
      })
      await page.goto(base)
      assert.ok((await page.locator('body').innerText()).includes('Requires Node 22.12.0 or later'))
      await page.goto(`${base}/about`)
      assert.ok(
        (await page.locator('body').innerText()).includes(
          'Neither interface builds a cross-file dependency graph'
        )
      )
      await page.goto(`${base}/dashboard`)
      await page
        .locator('#code-input')
        .fill('export function demo(value: any) { if (value == 42) { return eval(value) } }')
      await page.getByRole('button', { name: 'Analyze code', exact: true }).click()
      if (name === 'mobile')
        await page.getByRole('listbox', { name: 'Findings' }).getByRole('option').first().click()
      await page.getByText('Guidance did not load', { exact: true }).waitFor()
      mode = 'guide'
      await page.getByRole('button', { name: 'Retry guidance', exact: true }).click()
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      assert.equal(aiCalls, 0)
      mode = 'network'
      const consent = page.getByRole('button', { name: 'Send this finding to OpenAI', exact: true })
      await consent.focus()
      await page.keyboard.press('Enter')
      await page.getByText('Guidance did not load', { exact: true }).waitFor()
      await page.screenshot({ path: path.join(out, `${name}-network-error.png`), fullPage: true })
      // This assertion fails on the original candidate: no retry control exists.
      const retry = page.getByRole('button', { name: 'Retry AI guidance', exact: true })
      await retry.waitFor()
      mode = 'success'
      await retry.click()
      await page.getByText('Synthetic AI recovered', { exact: true }).waitFor()
      assert.equal(aiCalls, 2)
      await page.getByRole('button', { name: 'Next finding', exact: true }).click()
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        'Next finding'
      )
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      assert.equal(aiCalls, 2)
      mode = '429'
      await consent.click()
      await page.getByText('Synthetic rate limit', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Use built-in guidance', exact: true }).click()
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      assert.equal(aiCalls, 3)
      mode = 'hold'
      await consent.click()
      for (let i = 0; i < 100 && !held; i++) await sleep(20)
      assert.ok(held)
      await page.getByRole('button', { name: 'Next finding', exact: true }).click()
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        'Next finding'
      )
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      await held
        .fulfill({ json: { explanation: 'STALE AI RESPONSE', remediation: 'stale', source: 'ai' } })
        .catch(() => {})
      await sleep(300)
      assert.equal(await page.getByText('STALE AI RESPONSE', { exact: true }).count(), 0)
      assert.equal(requests.at(-1).ai, false)
      // Returning to an aborted request must not silently retry the provider.
      await page.getByRole('button', { name: 'Previous finding', exact: true }).click()
      await sleep(500)
      assert.equal(aiCalls, 4, 'Returning to an aborted finding must require explicit opt-in')
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      await consent.waitFor()
      mode = 'network'
      await consent.click()
      await page.getByText('Guidance did not load', { exact: true }).waitFor()
      assert.equal(aiCalls, 5)
      await page.getByRole('button', { name: 'Next finding', exact: true }).click()
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        'Next finding'
      )
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      await page.getByRole('button', { name: 'Previous finding', exact: true }).click()
      await sleep(500)
      assert.equal(aiCalls, 5, 'Returning to a failed finding must require explicit opt-in')
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      mode = 'success'
      await consent.click()
      await page.getByText('Synthetic AI recovered', { exact: true }).waitFor()
      assert.equal(aiCalls, 6, 'Explicit opt-in after returning sends exactly one request')
      await page.getByRole('button', { name: 'Next finding', exact: true }).click()
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        'Next finding'
      )
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      for (let step = 0; step < 3; step++) {
        await page.getByRole('button', { name: 'Next finding', exact: true }).click()
        await page.getByRole('button', { name: 'Previous finding', exact: true }).click()
      }
      await sleep(500)
      assert.equal(aiCalls, 6, 'Rapid navigation must not reuse consent')
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute('aria-label')),
        'Previous finding'
      )
      await page.getByText('Synthetic built-in guidance', { exact: true }).waitFor()
      await consent.waitFor()
      await consent.scrollIntoViewIfNeeded()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: path.join(out, `${name}-recovered.png`), fullPage: true })
      results.push({
        name,
        passed: true,
        aiCalls,
        requests: requests.map((r) => ({ ai: r.ai, rule: r.detection.ruleId })),
        checks: [
          'built-in failure and retry',
          'default guide',
          'keyboard opt-in',
          'network failure',
          'AI retry',
          'next finding guide',
          '429',
          'built-in recovery',
          'stale response ignored',
          'no overflow',
          'aborted finding return requires opt-in',
          'failed finding return requires opt-in',
          'explicit retry after return',
          'navigation retains focus',
          'runtime and cross-file copy',
          'rapid navigation preserves consent isolation and focus',
        ],
      })
      await page.close()
    }
    fs.writeFileSync(
      path.join(out, 'browser-results.json'),
      `${JSON.stringify(results, null, 2)}\n`
    )
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
    await new Promise((resolve) => {
      if (server.exitCode !== null) resolve()
      else server.once('exit', resolve)
    })
    fs.closeSync(log)
  }
})().catch((e) => {
  process.stderr.write(`${e.stack}\n`)
  process.exitCode = 1
})
