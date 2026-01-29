# RIVET Features

Complete documentation of all RIVET features, organized by analysis engine and capability.

---

## 🔍 Analysis Engines

### 1. Code Smell Detector

Identifies anti-patterns and maintainability issues in your code.

#### **Long Methods** 
- **Threshold**: >50 lines
- **Impact**: Hard to understand, test, and maintain
- **Fix**: Extract smaller methods
- **Example**:
  ```typescript
  // ❌ Bad: 80-line method
  function processOrder(order) {
    // 80 lines of mixed concerns...
  }
  
  // ✅ Good: Extracted methods
  function processOrder(order) {
    validateOrder(order)
    calculateTotal(order)
    applyDiscounts(order)
    processPayment(order)
    sendConfirmation(order)
  }
  ```

#### **God Objects**
- **Detection**: Classes with >10 public methods or >500 lines
- **Impact**: Violates Single Responsibility Principle
- **Fix**: Split into multiple focused classes

#### **Duplicate Code**
- **Detection**: Similar code blocks (>6 lines)
- **Impact**: Maintenance nightmare, bug multiplication
- **Fix**: Extract to shared function/module

#### **Magic Numbers**
- **Detection**: Unexplained numeric literals
- **Fix**: Named constants
  ```typescript
  // ❌ Bad
  if (user.age >= 18) { }
  
  // ✅ Good
  const LEGAL_AGE = 18
  if (user.age >= LEGAL_AGE) { }
  ```

#### **Long Parameter Lists**
- **Detection**: Functions with >5 parameters
- **Fix**: Use object parameters or builder pattern

#### **Deep Nesting**
- **Detection**: >3 levels of if/loop nesting
- **Fix**: Early returns, guard clauses

#### **Dead Code**
- **Detection**: Unreachable code, unused variables
- **Fix**: Remove (auto-fixable)

#### **Inconsistent Naming**
- **Detection**: Mixed camelCase/snake_case, unclear names
- **Fix**: Standardize to project conventions

#### **Callback Hell**
- **Detection**: >3 levels of nested callbacks
- **Fix**: Convert to Promises or async/await (auto-fixable)

#### **Missing Error Handling**
- **Detection**: Try/catch gaps, unhandled promises
- **Fix**: Add proper error handling

#### **Tight Coupling**
- **Detection**: High dependency count between modules
- **Fix**: Introduce abstractions, dependency injection

#### **Feature Envy**
- **Detection**: Method uses another class more than its own
- **Fix**: Move method to appropriate class

#### **Primitive Obsession**
- **Detection**: Overuse of primitives instead of objects
- **Fix**: Create value objects

#### **Switch Statements**
- **Detection**: Large switch blocks (>5 cases)
- **Fix**: Consider polymorphism or strategy pattern

#### **Comments Compensating for Bad Code**
- **Detection**: Excessive comments explaining unclear code
- **Fix**: Refactor code to be self-explanatory

---

### 2. Bug & Error Detector

Catches common programming mistakes before they reach production.

#### **Null/Undefined References**
```typescript
// ❌ Detected
const name = user.profile.name  // user or profile might be null

// ✅ Suggested fix
const name = user?.profile?.name ?? 'Unknown'
```

#### **Type Mismatches**
- TypeScript type errors
- Implicit any usage
- Wrong function arguments

#### **Logic Errors**
```typescript
// ❌ Assignment in condition
if (x = 5) { }

// ✅ Comparison
if (x === 5) { }
```

#### **Infinite Loops**
- Loops without exit conditions
- Missing break statements

#### **Memory Leaks**
- Unclosed connections
- Event listener leaks
- Circular references

#### **Race Conditions**
```typescript
// ❌ Race condition
async function updateUser() {
  const user = await getUser()
  user.visits++
  saveUser(user)  // Missing await!
}

// ✅ Fixed
async function updateUser() {
  const user = await getUser()
  user.visits++
  await saveUser(user)
}
```

#### **Off-by-One Errors**
- Array indexing issues
- Loop boundary errors

#### **Unhandled Promises**
```typescript
// ❌ Unhandled
fetchData()  // Promise not awaited or .catch()

// ✅ Handled
await fetchData()
// or
fetchData().catch(handleError)
```

#### **Division by Zero**
- Potential crashes detected

#### **Resource Leaks**
- Files not closed
- Database connections not released

---

### 3. Security Scanner

Comprehensive security analysis based on OWASP Top 10.

#### **A01: Broken Access Control**
- Missing authorization checks
- Insecure direct object references
- Inadequate permissions validation

#### **A02: Cryptographic Failures**
```typescript
// ❌ Detected
const API_KEY = 'sk-1234567890'  // Hardcoded secret
const password = user.password    // Plain text

// ✅ Fix
const API_KEY = process.env.API_KEY
const hashedPassword = await bcrypt.hash(user.password, 10)
```

#### **A03: Injection Vulnerabilities**
```typescript
// ❌ SQL Injection
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ Parameterized
db.query('SELECT * FROM users WHERE id = ?', [userId])

// ❌ XSS
innerHTML = userInput

// ✅ Sanitized
textContent = sanitize(userInput)
```

#### **A04: Insecure Design**
- Missing rate limiting
- No input validation
- Weak session management

#### **A05: Security Misconfiguration**
```typescript
// ❌ Detected
app.set('env', 'development')  // In production
app.use(cors({ origin: '*' }))  // Too permissive

// ✅ Fix
app.set('env', 'production')
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }))
```

#### **A06: Vulnerable Dependencies**
- CVE detection in npm packages
- Outdated libraries with known exploits
- License violations

#### **A07: Authentication Failures**
- Weak password requirements
- Missing MFA
- Session fixation vulnerabilities

#### **A08: Data Integrity Failures**
- Insecure deserialization
- Unsigned data

#### **A09: Logging Failures**
```typescript
// ❌ Logging sensitive data
logger.info(`User ${user.email} password: ${password}`)

// ✅ Safe logging
logger.info(`User ${user.id} authenticated`)
```

#### **A10: SSRF**
- Server-Side Request Forgery detection
- Unvalidated URL redirects

---

### 4. Performance Analyzer

Identifies performance bottlenecks and optimization opportunities.

#### **Algorithmic Complexity**
```typescript
// ❌ O(n²) - Detected
for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length; j++) {
    if (arr[i] === arr[j]) { }
  }
}

// ✅ O(n) - Suggested
const seen = new Set()
for (const item of arr) {
  if (seen.has(item)) { }
  seen.add(item)
}
```

#### **React Unnecessary Re-renders**
```typescript
// ❌ Missing memoization
const Component = ({ data }) => {
  const expensiveCalc = calculateSomething(data)  // Runs every render
  return <div>{expensiveCalc}</div>
}

// ✅ Memoized
const Component = ({ data }) => {
  const expensiveCalc = useMemo(() => calculateSomething(data), [data])
  return <div>{expensiveCalc}</div>
}
```

#### **N+1 Query Problems**
```typescript
// ❌ N+1 queries
for (const user of users) {
  const posts = await db.posts.find({ userId: user.id })
}

// ✅ Single query
const posts = await db.posts.find({
  userId: { $in: users.map(u => u.id) }
})
```

#### **Large Bundle Sizes**
```typescript
// ❌ Importing entire library
import _ from 'lodash'  // +69kb

// ✅ Import specific function
import debounce from 'lodash/debounce'  // +3kb
```

#### **Blocking Operations**
```typescript
// ❌ Synchronous file I/O
const data = fs.readFileSync('large-file.json')

// ✅ Asynchronous
const data = await fs.promises.readFile('large-file.json')
```

#### **Memory Inefficiency**
- Large object copies
- String concatenation in loops
- Memory leaks

#### **Inefficient DOM Manipulation**
- Multiple reflows
- Layout thrashing

#### **Missing Database Indexes**
- Slow queries detected

#### **Regex Catastrophic Backtracking**
```typescript
// ❌ Dangerous regex
/^(a+)+$/  // Can cause exponential time

// ✅ Optimized
/^a+$/
```

---

### 5. Architecture Analyzer

Evaluates code structure and design patterns.

#### **Circular Dependencies**
```
File A imports B
File B imports C
File C imports A  // ⚠️ Circular!
```

#### **Tight Coupling**
- High dependency count
- Direct instantiation instead of DI

#### **SOLID Violations**
- **S**: Single Responsibility
- **O**: Open/Closed
- **L**: Liskov Substitution
- **I**: Interface Segregation
- **D**: Dependency Inversion

#### **Poor Separation of Concerns**
```typescript
// ❌ Business logic in UI
function LoginForm() {
  const handleSubmit = async (data) => {
    const hash = await bcrypt.hash(data.password, 10)
    await db.users.create({ ...data, password: hash })
    // Business logic mixed with UI!
  }
}

// ✅ Separated
function LoginForm() {
  const { register } = useAuth()
  const handleSubmit = (data) => register(data)  // Logic in service
}
```

#### **Anemic Domain Models**
- Objects with no behavior (just data)

#### **Spaghetti Code**
- No clear structure
- Random organization

---

### 6. Best Practices Advisor

Suggests modern patterns and framework-specific improvements.

#### **Outdated Patterns**
```typescript
// ❌ Old callback pattern
fs.readFile('file.txt', (err, data) => {
  if (err) return console.error(err)
  console.log(data)
})

// ✅ Modern async/await
try {
  const data = await fs.promises.readFile('file.txt')
  console.log(data)
} catch (err) {
  console.error(err)
}
```

#### **React: Class to Hooks**
```typescript
// ❌ Old class component
class Counter extends React.Component {
  state = { count: 0 }
  render() {
    return <div>{this.state.count}</div>
  }
}

// ✅ Modern hooks
function Counter() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}
```

#### **Language Features**
```typescript
// ❌ Old var
var x = 10

// ✅ Modern const/let
const x = 10

// ❌ For loop
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i])
}

// ✅ Modern iteration
arr.forEach(item => console.log(item))
// or
for (const item of arr) {
  console.log(item)
}
```

#### **API Updates**
- Deprecated API detection
- Suggested modern alternatives

#### **Accessibility**
```jsx
// ❌ Missing accessibility
<button onClick={handleClick}>
  <img src="icon.png" />
</button>

// ✅ Accessible
<button onClick={handleClick} aria-label="Submit form">
  <img src="icon.png" alt="Submit" />
</button>
```

---

### 7. Dependency Manager

Smart dependency management with breaking change analysis.

#### **Outdated Packages**
```
react: 17.0.2 → 18.3.1 (major update)
├─ Breaking: New root API
├─ Migration: ~2 hours
└─ AI Guide: "Update createRoot()..."

lodash: 4.17.20 → 4.17.21 (patch)
├─ Safe to update
└─ Security fixes included
```

#### **Vulnerabilities**
```
⚠️ Critical: express@4.17.1
├─ CVE-2022-24999: CSRF vulnerability
├─ Fix: Update to 4.18.2+
└─ Impact: HIGH - Authentication bypass possible
```

#### **Unused Dependencies**
```
Unused in package.json:
  • moment (338kb) - Not imported anywhere
  • axios - Using fetch instead
  → Run: rivet deps clean
```

#### **License Compliance**
```
⚠️ License Issue:
  package "gpl-library" (GPL-3.0)
  Your project: MIT
  → Incompatible! Consider alternative.
```

#### **Bundle Impact**
```
Update lodash 4.17.20 → 4.17.21
├─ Bundle size: No change
├─ Breaking changes: None
└─ ✅ Safe to update
```

---

### 8. Flow Testing Engine

Detects untested critical user paths.

#### **Critical Path Detection**
```
✓ User Registration Flow (95% covered)
  signup → verify email → profile setup → dashboard

⚠️ Payment Flow (0% covered) - CRITICAL!
  cart → checkout → payment → confirmation
  → Generate test: rivet flows generate payment

○ Admin Dashboard (45% covered)
  login → admin panel → user management
  Missing: delete user, bulk actions
```

#### **User Journey Mapping**
```typescript
// Auto-detected from routes
const flows = [
  {
    name: 'Purchase Flow',
    steps: [
      { route: '/products', action: 'browse' },
      { route: '/product/:id', action: 'view' },
      { route: '/cart', action: 'add-to-cart' },
      { route: '/checkout', action: 'checkout' },
      { route: '/payment', action: 'pay' },
      { route: '/confirmation', action: 'confirm' },
    ],
    testCoverage: 30%, // Only 2/6 steps tested!
  }
]
```

#### **Generated Tests**
```typescript
// RIVET auto-generated from flow analysis
import { test, expect } from '@playwright/test'

test('complete payment flow', async ({ page }) => {
  // Navigate to products
  await page.goto('/products')
  
  // Add item to cart
  await page.click('[data-testid="product-1"]')
  await page.click('[data-testid="add-to-cart"]')
  
  // Checkout
  await page.goto('/checkout')
  await page.fill('#email', 'test@example.com')
  
  // Payment
  await page.fill('#card-number', '4242424242424242')
  await page.click('[data-testid="submit-payment"]')
  
  // Verify success
  await expect(page).toHaveURL(/\/confirmation/)
  await expect(page.locator('.success')).toBeVisible()
})
```

#### **State Transition Validation**
```typescript
// Detected state machine
const authStates = {
  LOGGED_OUT: ['login'],
  LOGGED_IN: ['logout', 'view-profile'],
  MFA_REQUIRED: ['verify-mfa', 'logout'],
}

// Missing tests:
// ⚠️ LOGGED_IN → logout transition not tested
// ⚠️ MFA_REQUIRED → verify-mfa not tested
```

---

## 🔧 Auto-Fix Capabilities

### Safe Auto-Fixes (No User Confirmation)
- Remove unused imports
- Fix consistent spacing
- Add missing semicolons
- Convert var → const/let
- Remove console.logs
- Fix simple typos

### Interactive Fixes (Requires Confirmation)
- Refactor long methods
- Extract duplicate code
- Update dependencies
- Apply codemods
- Fix security issues

### Migration Codemods
- React class → hooks
- CommonJS → ESM
- Callbacks → async/await
- Jest → Vitest
- CRA → Vite

---

## 📊 Reporting Features

### Tech Debt Score
```
Overall: 72/100 ⚠️

Breakdown:
  Security:        78/100
  Code Quality:    68/100
  Performance:     81/100
  Dependencies:    45/100  ← Needs attention!
  Testing:         65/100
  Documentation:   58/100

Trend: ▁▂▃▄▅▆ Improving
```

### HTML Dashboard
- Interactive issue exploration
- Filter by severity/category
- Historical trends
- Team comparison

### CI/CD Integration
```bash
$ rivet ci --fail-on critical
✓ No critical issues found
○ 3 medium issues (warnings)
→ Exit code: 0
```

---

## 🎯 Configuration

```json
{
  "engines": {
    "security": { "enabled": true, "severity": "high" },
    "performance": { "enabled": true },
    "flows": { "enabled": true, "criticalOnly": true }
  },
  
  "autoFix": {
    "safe": true,
    "interactive": false
  },
  
  "llm": {
    "provider": "openai",
    "model": "gpt-4",
    "maxTokens": 1000
  },
  
  "exclude": [
    "node_modules/**",
    "dist/**",
    "*.test.ts"
  ]
}
```

---

**Every feature designed to make you a better developer.** 🚀
