import type { Detection } from '@rivet/core'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

export interface AIConfig {
  apiKey?: string
  model?: string
  temperature?: number
  maxTokens?: number
  enabled?: boolean
}

export interface EnhancedDetection extends Detection {
  aiExplanation?: string
  aiSuggestion?: string
  aiAnalogy?: string
}

export class AIEnhancer {
  private llm: ChatOpenAI | null = null
  private config: Required<AIConfig>

  constructor(config: AIConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 500,
      enabled: config.enabled ?? true,
    }

    if (this.config.enabled && this.config.apiKey) {
      this.llm = new ChatOpenAI({
        openAIApiKey: this.config.apiKey,
        modelName: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      })
    }
  }

  async enhanceDetection(detection: Detection): Promise<EnhancedDetection> {
    if (!this.llm || !this.config.enabled) {
      return detection
    }

    try {
      const explanationPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an expert software engineer providing clear, concise explanations for code quality issues. 
Focus on WHY the issue matters and HOW to fix it. Be practical and actionable.`,
        ],
        [
          'user',
          `Explain this code quality issue:

Rule: {ruleId}
Message: {message}
Severity: {severity}
Category: {category}
File: {filePath}

Provide:
1. A clear explanation (2-3 sentences) of why this is a problem
2. A specific suggestion (1-2 sentences) on how to fix it
3. A simple analogy (1 sentence) to help understand the concept

Format as JSON:
{{"explanation": "...", "suggestion": "...", "analogy": "..."}}`,
        ],
      ])

      const chain = explanationPrompt.pipe(this.llm).pipe(new StringOutputParser())

      const response = await chain.invoke({
        ruleId: detection.ruleId,
        message: detection.message,
        severity: detection.severity,
        category: detection.category,
        filePath: detection.filePath,
      })

      // Parse the JSON response
      const parsed = this.parseAIResponse(response)

      return {
        ...detection,
        aiExplanation: parsed.explanation,
        aiSuggestion: parsed.suggestion,
        aiAnalogy: parsed.analogy,
      }
    } catch (error) {
      // If AI enhancement fails, return the original detection
      console.warn(`AI enhancement failed for ${detection.ruleId}:`, error)
      return detection
    }
  }

  async enhanceDetections(
    detections: Detection[],
    maxConcurrent: number = 5
  ): Promise<EnhancedDetection[]> {
    if (!this.llm || !this.config.enabled || detections.length === 0) {
      return detections
    }

    // Process detections in batches to avoid rate limits
    const results: EnhancedDetection[] = []

    for (let i = 0; i < detections.length; i += maxConcurrent) {
      const batch = detections.slice(i, i + maxConcurrent)
      const enhanced = await Promise.all(batch.map((d) => this.enhanceDetection(d)))
      results.push(...enhanced)
    }

    return results
  }

  private parseAIResponse(response: string): {
    explanation: string
    suggestion: string
    analogy: string
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          explanation: parsed.explanation || '',
          suggestion: parsed.suggestion || '',
          analogy: parsed.analogy || '',
        }
      }
    } catch {
      // If parsing fails, try to extract sections manually
      const explanation = this.extractSection(response, 'explanation')
      const suggestion = this.extractSection(response, 'suggestion')
      const analogy = this.extractSection(response, 'analogy')

      return { explanation, suggestion, analogy }
    }

    // Fallback: use the raw response as explanation
    return {
      explanation: response.trim(),
      suggestion: '',
      analogy: '',
    }
  }

  private extractSection(text: string, section: string): string {
    const regex = new RegExp(`${section}[:"'\\s]+(.*?)(?=\\n|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].replace(/['"]/g, '').trim() : ''
  }

  isEnabled(): boolean {
    return this.config.enabled && !!this.llm
  }
}
