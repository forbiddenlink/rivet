import type { Detection } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detects dynamic code execution: `eval`, the `Function` constructor, and the
 * string forms of `setTimeout` / `setInterval` / `execScript`.
 *
 * Each of these compiles a runtime string as code. When any part of that string
 * can be influenced by input, the result is arbitrary code execution in the
 * caller's context — CWE-95. This is the most basic check a JavaScript security
 * scanner is expected to make, and RIVET shipped without it.
 */

/** Direct calls whose entire purpose is to run a string as code. */
const ALWAYS_UNSAFE = new Set(['eval', 'execScript'])

/** Timer functions that execute a string argument as code, but are safe with a callback. */
const STRING_ARGUMENT_SINKS = new Set(['setTimeout', 'setInterval'])

interface Finding {
  callee: string
  severity: Detection['severity']
  message: string
  recommendation: string
}

function describe(callee: string, argumentIsLiteralString: boolean): Finding | null {
  if (ALWAYS_UNSAFE.has(callee)) {
    return {
      callee,
      // A literal is still a code-execution sink, but an attacker cannot reach it
      // without editing the source, so it does not carry the same urgency.
      severity: argumentIsLiteralString ? 'medium' : 'critical',
      message: `Dynamic code execution: ${callee}() runs its argument as code`,
      recommendation:
        'Replace with an explicit function call. To parse data, use JSON.parse; to pick behaviour at runtime, use a lookup object keyed by a validated string.',
    }
  }

  if (callee === 'Function') {
    return {
      callee,
      severity: argumentIsLiteralString ? 'medium' : 'critical',
      message: 'Dynamic code execution: the Function constructor compiles a string as code',
      recommendation:
        'Define the function directly. The Function constructor is eval with extra steps and is blocked by any Content-Security-Policy without unsafe-eval.',
    }
  }

  if (STRING_ARGUMENT_SINKS.has(callee)) {
    return {
      callee,
      severity: 'high',
      message: `Dynamic code execution: ${callee}() was given a string, which it evaluates as code`,
      recommendation: `Pass a function instead of a string: ${callee}(() => doWork(), delay).`,
    }
  }

  return null
}

function calleeName(node: ASTNode): string {
  if (node.type === 'Identifier' && node.raw.type === 'Identifier') {
    return node.raw.name
  }
  if (node.type === 'MemberExpression' && node.children) {
    // `window.eval(...)` and `globalThis.Function(...)` are the same sinks.
    const identifiers = node.children.filter((child) => child.type === 'Identifier')
    const property = identifiers[identifiers.length - 1]
    if (property && property.raw.type === 'Identifier') {
      return property.raw.name
    }
  }
  return ''
}

/**
 * True when the first argument is a plain string literal, which means nothing
 * outside the source file can change what gets executed.
 */
function firstArgumentIsLiteralString(call: ASTNode, callee: ASTNode): boolean {
  const args = (call.children ?? []).filter((child) => child !== callee)
  const first = args[0]
  if (!first) {
    return false
  }
  return first.type === 'Literal' && typeof (first.raw as { value?: unknown })?.value === 'string'
}

export function detectDynamicCodeExecution(ast: ASTNode, filePath: string): Detection[] {
  const detections: Detection[] = []

  function visit(node: ASTNode): void {
    const isNew = node.type === 'NewExpression'
    const isCall = node.type === 'CallExpression' || isNew

    if (isCall && node.children) {
      const candidates = node.children.filter(
        (child) => child.type === 'Identifier' || child.type === 'MemberExpression'
      )
      // This parser emits the callee first for a CallExpression but last for a
      // NewExpression, so `new Function(body)` lists `body` before `Function`.
      const callee = isNew ? candidates[candidates.length - 1] : candidates[0]

      if (callee) {
        const name = calleeName(callee)
        const literalArgument = firstArgumentIsLiteralString(node, callee)

        // A timer is only a sink when it is handed a string; a callback is fine.
        const isTimerWithCallback = STRING_ARGUMENT_SINKS.has(name) && !literalArgument
        const finding = isTimerWithCallback ? null : describe(name, literalArgument)

        if (finding) {
          detections.push({
            id: `dynamic-code-execution-${filePath}-${node.loc?.start.line ?? 0}`,
            ruleId: 'dynamic-code-execution',
            filePath,
            loc: {
              start: { line: node.loc?.start.line ?? 0, column: node.loc?.start.column ?? 0 },
              end: { line: node.loc?.end.line ?? 0, column: node.loc?.end.column ?? 0 },
            },
            severity: finding.severity,
            category: 'security',
            message: finding.message,
            metadata: {
              pattern: 'dynamic-code-execution',
              callee: finding.callee,
              explanation:
                'Compiling a string into code at runtime means any input that reaches that string becomes executable. It also defeats Content-Security-Policy and prevents bundlers and type checkers from seeing the code at all.',
              recommendation: finding.recommendation,
              cwe: 'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code',
              owasp: 'A03:2021 - Injection',
            },
          })
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(ast)
  return detections
}
