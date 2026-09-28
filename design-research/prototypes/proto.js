// Prototype data: the dashboard's DEMO_CODE and the real /api/analyze output for it,
// captured 2026-09-27 from the local dev server (see demo-scan.json).
const DEMO = `// Demo snippet with intentional issues for RIVET
const API_KEY = "sk-live-demo-do-not-use";

export async function processOrder(user, items) {
  // Nested conditionals + missing error handling
  if (user) {
    if (user.active) {
      if (items && items.length > 0) {
        let total = 0;
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length; j++) {
            total += items[i].price * (items[j].qty || 1);
          }
        }

        const res = await fetch("https://api.example.com/charge", {
          method: "POST",
          body: JSON.stringify({ total, key: API_KEY }),
        });
        return res.json();
      }
    }
  }
  return null;
}

export function AdminPanel({ data }) {
  // Dangerous sink
  return <div dangerouslySetInnerHTML={{ __html: data.html }} />;
}`

const F = [
  [
    'critical',
    'security',
    'hardcoded-secret',
    2,
    16,
    'Potential API Key detected in hardcoded string',
  ],
  [
    'high',
    'flows',
    'async-without-error-handling',
    4,
    7,
    'Async function lacks error handling (try-catch or .catch())',
  ],
  ['high', 'flows', 'fetch-without-error-handling', 16, 26, 'fetch() call without error handling'],
  [
    'high',
    'bugs',
    'unhandled-promise',
    20,
    15,
    'Unhandled promise: promise result not awaited or caught',
  ],
  [
    'high',
    'security',
    'xss-react',
    29,
    14,
    'Potential XSS: dangerouslySetInnerHTML used without sanitization',
  ],
  ['medium', 'bugs', 'async-no-catch', 4, 7, 'Async function with await but no try-catch block'],
  [
    'medium',
    'smells',
    'deep-nesting',
    10,
    8,
    'Code is deeply nested (depth: 4). Simplify control flow for better readability.',
  ],
  [
    'medium',
    'smells',
    'deep-nesting',
    11,
    10,
    'Code is deeply nested (depth: 5). Simplify control flow for better readability.',
  ],
  [
    'medium',
    'performance',
    'nested-loops',
    11,
    10,
    'Loop nested at depth 2 - complexity is O(n^2)',
  ],
  [
    'low',
    'practices',
    'missing-documentation',
    4,
    7,
    "Function 'processOrder' lacks documentation",
  ],
  ['low', 'practices', 'missing-documentation', 27, 7, "Function 'AdminPanel' lacks documentation"],
  [
    'info',
    'performance',
    'inline-function-in-jsx',
    29,
    14,
    'Inline function/object on a DOM element allocates on every render',
  ],
].map(([severity, category, ruleId, line, col, message], i) => ({
  i,
  severity,
  category,
  ruleId,
  line,
  col,
  message,
}))

const RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
function hl(line) {
  let s = esc(line)
  if (/^\s*\/\//.test(line)) return `<span class="tok-c">${s}</span>`
  s = s.replace(/("[^"]*")/g, '<span class="tok-s">$1</span>')
  s = s.replace(
    /\b(const|let|export|async|function|return|if|for|await|null)\b/g,
    '<span class="tok-k">$1</span>'
  )
  return s
}
function worstOn(line, list) {
  return list.filter((f) => f.line === line).sort((a, b) => RANK[b.severity] - RANK[a.severity])[0]
}

/** Render annotated source. opts: {from, to, list, active, notes:[findingIndex]} */
function renderSource(el, opts) {
  const lines = DEMO.split('\n')
  const from = opts.from || 1
  const to = opts.to || lines.length
  const list = opts.list || F
  let html = ''
  for (let n = from; n <= to; n++) {
    const w = worstOn(n, list)
    const active = opts.active && opts.active.line === n
    html += `<div class="ln"${w ? ` data-sev="${w.severity}"` : ''}${active ? ' data-active' : ''} data-line="${n}">`
    html += `<span class="ln__mark">${w ? `<span class="rivet sev-${w.severity}" title="${w.severity}"></span>` : ''}</span>`
    html += `<span class="ln__no">${n}</span><span>${hl(lines[n - 1]) || ' '}</span></div>`
    for (const idx of opts.notes || []) {
      const f = F[idx]
      if (f.line === n)
        html += `<div class="src__note sev-${f.severity}"><b>${esc(f.message)}</b><br><span>L${f.line}:${f.col}  ${f.severity}  ${f.ruleId}</span></div>`
    }
  }
  el.innerHTML = html
}
