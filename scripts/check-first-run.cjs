// Offline regression for the executable commands advertised to first-time users.
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const root = path.resolve(__dirname, '..')
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rivet-first-run-'))
try {
  fs.writeFileSync(
    path.join(temp, 'fixture.ts'),
    'export function calculate(value: number) { return value == 2 }'
  )
  const cli = path.join(root, 'apps/cli/dist/index.js')
  const env = { PATH: process.env.PATH, HOME: temp, NO_COLOR: '1', OPENAI_API_KEY: '' }
  const help = execFileSync(process.execPath, [cli, 'scan', '--help'], { env, encoding: 'utf8' })
  assert.match(help, /--ai-model/)
  assert.match(help, /--fail-on/)
  const text = execFileSync(
    process.execPath,
    [cli, 'scan', temp, '--format', 'json', '--fail-on', 'none'],
    { env, encoding: 'utf8', timeout: 30000 }
  )
  const report = JSON.parse(text)
  assert.ok(report.detections.length > 0, 'Synthetic first scan must produce real findings')
  const keyFile = path.join(temp, 'synthetic.env')
  fs.writeFileSync(keyFile, 'FIRST_RUN_ENV_LOADED=yes\n')
  assert.equal(
    execFileSync(
      process.execPath,
      [`--env-file=${keyFile}`, '-p', 'process.env.FIRST_RUN_ENV_LOADED'],
      { env, encoding: 'utf8' }
    ).trim(),
    'yes'
  )
  process.stdout.write(
    `First-run CLI passed: ${report.detections.length} findings; documented executable and explicit env-file loading work.\n`
  )
} finally {
  fs.rmSync(temp, { recursive: true, force: true })
}
