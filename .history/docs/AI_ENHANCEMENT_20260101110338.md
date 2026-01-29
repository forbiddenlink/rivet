# Using RIVET AI Enhancement

RIVET can enhance code quality detections with AI-powered explanations and suggestions using GPT-4.

## Setup

1. **Get an OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Generate an API key from your dashboard

2. **Set Environment Variable**
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

## Using AI Enhancement in CLI

Currently, the AI enhancement feature is implemented in the `@rivet/ai` package and ready for integration. To use it:

### Option 1: Programmatic Usage

```typescript
import { RivetEngine } from '@rivet/core'
import { AIEnhancer, TechDebtCalculator } from '@rivet/ai'
import { SmellsEngine } from '@rivet/engine-smells'

// Create engine and run analysis
const engine = new RivetEngine()
engine.registerEngine(new SmellsEngine())
const result = await engine.analyze('./src')

// Enhance with AI explanations
const aiEnhancer = new AIEnhancer({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
})

const enhanced = await aiEnhancer.enhanceDetections(result.detections)

// Calculate tech debt
const metrics = TechDebtCalculator.calculate(enhanced)
console.log(TechDebtCalculator.formatMetrics(metrics))

// Show enhanced detections
enhanced.forEach(detection => {
  console.log(`\n${detection.ruleId}: ${detection.message}`)
  if (detection.aiExplanation) {
    console.log(`💡 ${detection.aiExplanation}`)
  }
  if (detection.aiSuggestion) {
    console.log(`🔧 ${detection.aiSuggestion}`)
  }
  if (detection.aiAnalogy) {
    console.log(`📖 ${detection.aiAnalogy}`)
  }
})
```

### Option 2: CLI Integration (Coming Soon)

The next step is to add `--ai` flag to the CLI:

```bash
# Future usage:
rivet scan ./src --ai
rivet scan ./src --ai --tech-debt
```

## AI Features

### 1. Enhanced Explanations
AI provides clear, contextual explanations for each detection:
- **Why it matters**: Understanding the impact of the issue
- **How to fix**: Specific actionable steps
- **Simple analogy**: Easy-to-understand comparison

### 2. Tech Debt Calculation
Automatically estimates time to fix issues:
- Critical: 4 hours
- High: 2 hours
- Medium: 1 hour
- Low: 30 minutes

### 3. Batch Processing
Process multiple detections efficiently with rate limiting to avoid API throttling.

## Configuration Options

```typescript
const aiEnhancer = new AIEnhancer({
  apiKey: process.env.OPENAI_API_KEY,  // Required
  model: 'gpt-4',                       // Default: 'gpt-4'
  temperature: 0.7,                     // Default: 0.7
  maxTokens: 500,                       // Default: 500
  enabled: true,                        // Default: true
})
```

## Cost Considerations

- Each detection enhancement costs ~$0.001-0.003 (GPT-4)
- Use selective enhancement for large codebases
- Consider using GPT-3.5-turbo for lower costs: `model: 'gpt-3.5-turbo'`

## Example Output

```
[HIGH] unhandled-promise
  File: src/api.ts:42:2
  Message: Unhandled promise: promise result not awaited or caught

💡 Explanation: Unhandled promises can lead to silent failures in your application. 
When a promise rejects and there's no error handler, the error is swallowed, making 
debugging extremely difficult. This is particularly problematic in production where 
you won't see console errors.

🔧 Suggestion: Add `await` before the promise call or chain a `.catch()` handler. 
If in an async function, wrap in try-catch. For fire-and-forget scenarios, 
explicitly add `.catch(err => console.error('Background task failed:', err))`.

📖 Analogy: It's like sending a letter without a return address - if something 
goes wrong, you'll never know about it.
```

## Privacy & Security

- Code snippets are sent to OpenAI for analysis
- No code is stored; only used for generating explanations
- Review [OpenAI's API data usage policy](https://openai.com/policies/api-data-usage-policies)
- For sensitive codebases, consider self-hosted LLM alternatives

## Disabling AI Features

```typescript
const aiEnhancer = new AIEnhancer({ enabled: false })
```

Or don't set the `OPENAI_API_KEY` environment variable - the enhancement will be skipped automatically.
