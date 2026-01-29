import type { Detection, AnalysisContext } from '@rivet/core'
import type { ASTNode } from '@rivet/parsers'

/**
 * Detect untested state transitions (Redux, Zustand, useState, etc.)
 */
export function detectUntestedStateTransitions(context: AnalysisContext): Detection[] {
  const detections: Detection[] = []
  const { parseResult } = context
  let detectionCounter = 0

  function visit(node: ASTNode, filePath: string): void {
    // Detect useState calls
    if (node.type === 'CallExpression' && node.raw.type === 'CallExpression') {
      const callee = node.raw.callee
      if (callee && callee.type === 'Identifier' && callee.name === 'useState' && node.loc) {
        detections.push({
          id: `untested-state-${++detectionCounter}`,
          ruleId: 'untested-state-transition',
          filePath,
          loc: {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
          },
          severity: 'low',
          category: 'flows',
          message: 'useState hook found - ensure state transitions are tested',
          metadata: {
            pattern: 'untested-state',
            explanation: 'State management logic should be tested to verify correct state transitions',
            recommendation: 'Add tests using @testing-library/react to verify state changes',
          },
        })
      }

      // Detect useReducer calls
      if (callee && callee.type === 'Identifier' && callee.name === 'useReducer' && node.loc) {
        detections.push({
          id: `untested-reducer-${++detectionCounter}`,
          ruleId: 'untested-reducer',
          filePath,
          loc: {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
          },
          severity: 'medium',
          category: 'flows',
          message: 'useReducer hook found - verify reducer logic is tested',
          metadata: {
            pattern: 'untested-reducer',
            explanation: 'Reducers contain business logic that should be unit tested separately',
            recommendation: 'Extract reducer to separate file and add unit tests for all actions',
          },
        })
      }
    }

    // Detect Redux action creators
    if (node.type === 'CallExpression' && node.children) {
      const callee = node.children.find((child) => child.type === 'Identifier')
      if (callee && callee.raw.type === 'Identifier' && 
          (callee.raw.name === 'createAction' || callee.raw.name === 'createAsyncThunk') && node.loc) {
        detections.push({
          id: `untested-action-${++detectionCounter}`,
          ruleId: 'untested-redux-action',
          filePath,
          loc: {
            start: { line: node.loc.start.line, column: node.loc.start.column },
            end: { line: node.loc.end.line, column: node.loc.end.column },
          },
          severity: 'medium',
          category: 'flows',
          message: 'Redux action found - ensure action creators and reducers are tested',
          metadata: {
            pattern: 'untested-redux-action',
            explanation: 'Redux actions and reducers should be tested to verify state management logic',
            recommendation: 'Add tests for action creators and verify reducer behavior',
          },
        })
      }
    }

    if (node.children) {
      for (const child of node.children) {
        visit(child, filePath)
      }
    }
  }

  if (parseResult.files) {
    for (const file of parseResult.files) {
      if (file.ast) {
        visit(file.ast, file.filePath)
      }
    }
  }

  return detections
}
