import type { AnalysisContext } from '@rivet/core'
import { parseTypeScript } from '@rivet/parsers'
import { describe, expect, it } from 'vitest'

import { detectUntestedStateTransitions } from './untested-state-transitions'

function createContext(code: string, filePath = 'component.tsx'): AnalysisContext {
  const parseResult = parseTypeScript({
    filePath,
    sourceCode: code,
    extractTypes: false,
  })
  return {
    parseResult,
    projectRoot: '/test',
    config: {},
  }
}

describe('Untested State Transitions Detector', () => {
  it('should detect useState hooks', () => {
    const code = `
      function Counter() {
        const [count, setCount] = useState(0)
        return <button onClick={() => setCount(count + 1)}>{count}</button>
      }
    `

    const detections = detectUntestedStateTransitions(createContext(code))

    expect(detections.length).toBeGreaterThan(0)
    expect(detections[0]?.ruleId).toBe('untested-state-transition')
  })

  it('should detect useReducer hooks', () => {
    const code = `
      function TodoApp() {
        const [state, dispatch] = useReducer(todoReducer, initialState)
        return <div>{state.items.length}</div>
      }
    `

    const detections = detectUntestedStateTransitions(createContext(code))

    expect(detections.some((d) => d.ruleId === 'untested-reducer')).toBe(true)
  })

  it('should detect Redux createAction', () => {
    const code = `
      const increment = createAction('counter/increment')
      const fetchUser = createAsyncThunk('user/fetch', async (id) => id)
    `

    const detections = detectUntestedStateTransitions(createContext(code))

    expect(detections.length).toBeGreaterThanOrEqual(1)
    expect(detections.some((d) => d.ruleId === 'untested-redux-action')).toBe(true)
  })

  it('should not flag unrelated code', () => {
    const code = `
      function Hello() {
        return <p>Hello</p>
      }
    `

    const detections = detectUntestedStateTransitions(createContext(code))
    expect(detections).toEqual([])
  })
})
