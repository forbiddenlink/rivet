import { NextRequest, NextResponse } from 'next/server'

interface ExplanationRequest {
  detection: {
    message: string
    severity: string
    category: string
    ruleId: string
  }
  code?: string
}

interface ExplanationResponse {
  explanation: string
  remediation: string
  references?: string[]
}

export async function POST(request: NextRequest): Promise<NextResponse<ExplanationResponse | { error: string }>> {
  try {
    const body: ExplanationRequest = await request.json()
    const { detection, code } = body

    if (!detection) {
      return NextResponse.json({ error: 'Detection is required' }, { status: 400 })
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Return mock explanation if no API key (for development)
      return NextResponse.json({
        explanation: `This is a ${detection.severity} ${detection.category} issue detected by the ${detection.ruleId} rule.
        
The problem: ${detection.message}

This issue typically indicates a potential vulnerability or code quality problem that should be addressed.`,
        remediation: `To fix this issue, consider:
1. Reviewing the code context where this issue occurs
2. Applying best practices for ${detection.category}
3. Testing the fix thoroughly to ensure it resolves the issue
4. Adding unit tests to prevent regression`,
        references: ['https://owasp.org/', 'https://cwe.mitre.org/', 'https://github.com/forbiddenlink/rivet'],
      })
    }

    // Use OpenAI API for enhanced explanations
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code quality reviewer. Provide concise, technical explanations of code issues. Focus on why this is a problem and how to fix it.',
          },
          {
            role: 'user',
            content: `Analyze this code issue:
Category: ${detection.category}
Severity: ${detection.severity}
Issue: ${detection.message}
Rule: ${detection.ruleId}
${code ? `\nCode context:\n${code}` : ''}

Provide:
1. A brief explanation (2-3 sentences) of why this is a problem
2. Step-by-step remediation (3-4 bullet points)
3. Any relevant security/performance concerns`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      // Fallback to mock explanation on API error
      return NextResponse.json({
        explanation: `This ${detection.category} issue (${detection.ruleId}) requires attention.

${detection.message}`,
        remediation: 'Please review best practices for this category and apply appropriate fixes.',
      })
    }

    const data = await response.json()
    const explanationText = data.choices[0]?.message?.content || ''

    // Parse the response into structured format
    const [explanation, remediation] = explanationText.split('Remediation:').map((s: string) => s.trim())

    return NextResponse.json({
      explanation: explanation || explanationText,
      remediation: remediation || 'Please review the code and apply appropriate fixes.',
      references: ['https://owasp.org/', 'https://github.com/forbiddenlink/rivet'],
    })
  } catch (error) {
    console.error('Explanation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}
