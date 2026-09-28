// The dashboard's demo snippet, and what the engines report for it.
// DEMO_FINDINGS is a captured copy used by the home page, so the page does not
// run eight engines on every render. demo.test.ts fails if it drifts from what
// the engines actually report.

export const DEMO_CODE = `// Demo snippet with intentional issues for RIVET
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
}
`

export interface DemoFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  ruleId: string
  line: number
  column: number
  message: string
}

export const DEMO_FINDINGS: readonly DemoFinding[] = [
  {
    severity: 'critical',
    category: 'security',
    ruleId: 'hardcoded-secret',
    line: 2,
    column: 16,
    message: 'Potential API Key detected in hardcoded string',
  },
  {
    severity: 'high',
    category: 'flows',
    ruleId: 'async-without-error-handling',
    line: 4,
    column: 7,
    message: 'Async function lacks error handling (try-catch or .catch())',
  },
  {
    severity: 'high',
    category: 'flows',
    ruleId: 'fetch-without-error-handling',
    line: 16,
    column: 26,
    message: 'fetch() call without error handling',
  },
  {
    severity: 'high',
    category: 'bugs',
    ruleId: 'unhandled-promise',
    line: 20,
    column: 15,
    message: 'Unhandled promise: promise result not awaited or caught',
  },
  {
    severity: 'high',
    category: 'security',
    ruleId: 'xss-react',
    line: 29,
    column: 14,
    message: 'Potential XSS: dangerouslySetInnerHTML used without sanitization',
  },
  {
    severity: 'medium',
    category: 'bugs',
    ruleId: 'async-no-catch',
    line: 4,
    column: 7,
    message: 'Async function with await but no try-catch block',
  },
  {
    severity: 'medium',
    category: 'smells',
    ruleId: 'deep-nesting',
    line: 10,
    column: 8,
    message: 'Code is deeply nested (depth: 4). Simplify control flow for better readability.',
  },
  {
    severity: 'medium',
    category: 'smells',
    ruleId: 'deep-nesting',
    line: 11,
    column: 10,
    message: 'Code is deeply nested (depth: 5). Simplify control flow for better readability.',
  },
  {
    severity: 'medium',
    category: 'performance',
    ruleId: 'nested-loops',
    line: 11,
    column: 10,
    message: 'Loop nested at depth 2 - complexity is O(n^2)',
  },
  {
    severity: 'low',
    category: 'practices',
    ruleId: 'missing-documentation',
    line: 4,
    column: 7,
    message: "Function 'processOrder' lacks documentation",
  },
  {
    severity: 'low',
    category: 'practices',
    ruleId: 'missing-documentation',
    line: 27,
    column: 7,
    message: "Function 'AdminPanel' lacks documentation",
  },
  {
    severity: 'info',
    category: 'performance',
    ruleId: 'inline-function-in-jsx',
    line: 29,
    column: 14,
    message: 'Inline function/object on a DOM element allocates on every render',
  },
]
