// ─── GUARDRAIL LAYER ─────────────────────────────────────────────
// Validates every Gemini response before it reaches the user.
// Blocks hallucinations, competitor leaks, policy violations, tone breaks.

const COMPETITOR_PATTERNS = [
  /\bamazon\b/i, /\bflipkart\b/i, /\bolx\b/i, /\bcashify\b/i,
  /\brentomojo\b/i, /\bfurlenco\b/i, /\bgrabhouse\b/i, /\broyal brothers\b/i,
  /\bcroma\b/i, /\breliance digital\b/i, /\bvijay sales\b/i,
  /\bjiomart\b/i, /\bshopclues\b/i, /\btatacliq\b/i, /\bmyntra\b/i,
  /\bmesho\b/i, /\bmeesho\b/i,
]

const PROMOTIONAL_PATTERNS = [
  /\bbuy now\b/i, /\border now\b/i, /\bshop now\b/i,
  /\blimited offer\b/i, /\bexclusive deal\b/i,
]

const FILLER_STARTS = [
  'great question', 'certainly', 'i\'d be happy to', 'happy to help',
  'absolutely', 'of course', 'sure thing', 'you bet',
  'i understand', 'i hear you', 'that\'s a great',
]

const AI_PATTERNS = [
  /as an ai/i, /as a language model/i, /i am an ai/i,
  /i don't have access to/i, /i cannot access/i,
  /as an artificial intelligence/i,
]

const PII_PATTERNS = [
  /\b\d{10}\b/,                                    // 10-digit phone
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // email
  /upi:\s*\w+@\w+/,                                 // UPI ID
  /\b\d{12}\b/,                                     // Aadhaar
]

const PRICING_PATTERN = /[₹]\s*[\d,]+/g

const COMPETITOR_LEAVE_PHRASES = [
  'check out', 'try', 'you can also', 'alternatively',
  'on amazon', 'on flipkart', 'on olx', 'on cashify',
  'through amazon', 'via amazon',
]

interface GuardrailResult {
  passed: boolean
  sanitized: string
  issues: string[]
}

function extractPricingNumbers(text: string): number[] {
  const matches = text.match(PRICING_PATTERN)
  if (!matches) return []
  return matches.map(m => parseInt(m.replace(/[₹,\s]/g, ''), 10))
}

function checkCompetitorContext(text: string): boolean {
  // Check if competitor names appear in a recommending context
  const sentences = text.split(/[.!?]+/)
  for (const sentence of sentences) {
    const hasCompetitor = COMPETITOR_PATTERNS.some(p => p.test(sentence))
    if (!hasCompetitor) continue
    const isRecommending = COMPETITOR_LEAVE_PHRASES.some(p =>
      sentence.toLowerCase().includes(p)
    )
    // Also flag if competitor name is the main subject (not just a comparison)
    const isComparison = /\bbetter than\b|\bcheaper than\b|\bversus\b|\bvs\b/i.test(sentence)
    if (isRecommending || (hasCompetitor && !isComparison)) return true
  }
  return false
}

function checkPricingConsistency(text: string, sessionContext: { leaseRent?: number; deposit?: number; competitorTotal?: number; months?: number }): string[] {
  const numbers = extractPricingNumbers(text)
  if (numbers.length === 0) return []

  const issues: string[] = []

  for (const num of numbers) {
    // If lease rent is known, flag wildly different figures
    if (sessionContext.leaseRent && sessionContext.leaseRent > 0) {
      const ratio = num / sessionContext.leaseRent
      if (ratio > 3 && num > 50000) {
        issues.push(`Price ₹${num.toLocaleString('en-IN')} seems high vs expected rent ₹${sessionContext.leaseRent.toLocaleString('en-IN')}`)
      }
    }
    // Flag suspiciously round numbers that look made up
    if (num >= 100000 && num % 100000 === 0) {
      issues.push(`Round number ₹${num.toLocaleString('en-IN')} may be invented`)
    }
  }

  return issues
}

export function guardOutput(
  text: string,
  sessionContext?: { leaseRent?: number; deposit?: number; competitorTotal?: number; months?: number },
): GuardrailResult {
  const issues: string[] = []
  let sanitized = text.trim()

  // 1. Empty response
  if (!sanitized) {
    return { passed: false, sanitized: "I didn't quite get that. Can you ask again?", issues: ['Empty response'] }
  }

  // 2. Filler phrase starts
  const first50 = sanitized.slice(0, 50).toLowerCase()
  for (const filler of FILLER_STARTS) {
    if (first50.startsWith(filler)) {
      // Remove filler prefix
      sanitized = sanitized.replace(new RegExp(`^${filler}[\\s,!:;.]*`, 'i'), '')
      issues.push(`Removed filler start: "${filler}"`)
      break
    }
  }

  // 3. "As an AI" patterns
  for (const p of AI_PATTERNS) {
    if (p.test(sanitized)) {
      sanitized = sanitized.replace(p, 'I')
      issues.push('Removed AI self-reference')
    }
  }

  // 4. Competitor recommendations
  if (checkCompetitorContext(sanitized)) {
    issues.push('Competitor mention detected')
    // Remove sentences that recommend competitors
    const sentences = sanitized.split(/(?<=[.!?])\s+/)
    sanitized = sentences.filter(s => {
      const hasCompetitor = COMPETITOR_PATTERNS.some(p => p.test(s))
      if (!hasCompetitor) return true
      const isRecommending = COMPETITOR_LEAVE_PHRASES.some(p =>
        s.toLowerCase().includes(p)
      )
      return !isRecommending
    }).join(' ')
    if (!sanitized.trim()) {
      sanitized = "I can only speak about Lease — we're the best option for student rentals on campus."
    }
  }

  // 5. Promotional language
  for (const p of PROMOTIONAL_PATTERNS) {
    if (p.test(sanitized)) {
      sanitized = sanitized.replace(p, '')
      issues.push('Removed promotional language')
    }
  }

  // 6. PII detection
  for (const p of PII_PATTERNS) {
    const matches = sanitized.match(p)
    if (matches) {
      for (const match of matches) {
        sanitized = sanitized.replace(match, '[redacted]')
        issues.push(`Redacted PII: ${match}`)
      }
    }
  }

  // 7. Pricing consistency
  if (sessionContext) {
    const pricingIssues = checkPricingConsistency(sanitized, sessionContext)
    issues.push(...pricingIssues)
    // If pricing is wildly off, replace with a safe response
    if (pricingIssues.length >= 2) {
      sanitized = "I don't have exact pricing for that combination. Can you tell me the item value and how long you need it?"
    }
  }

  // 8. Question count - ensure max 1 question
  const questionMarks = (sanitized.match(/\?/g) || []).length
  if (questionMarks > 1) {
    // Keep only the first question, remove the rest
    const parts = sanitized.split('?')
    sanitized = parts.slice(0, 2).join('?') + '.'
    issues.push(`Reduced from ${questionMarks} questions to 1`)
  }

  // 9. Length enforcement (300 words soft max for responses with tables)
  const words = sanitized.split(/\s+/).length
  if (words > 300) {
    const sentences = sanitized.match(/[^.!?]+[.!?]+/g)
    if (sentences) {
      let truncated = ''
      let wc = 0
      for (const s of sentences) {
        const sw = s.split(/\s+/).length
        if (wc + sw > 250) break
        truncated += s + ' '
        wc += sw
      }
      sanitized = truncated.trim()
      issues.push(`Truncated from ${words} to ~${wc} words`)
    }
  }

  // 10. ALL CAPS detection
  const upperWords = sanitized.split(/\s+/).filter(w => w.length > 3 && w === w.toUpperCase())
  if (upperWords.length > 2) {
    sanitized = sanitized.toLowerCase()
    // Re-capitalize first letter
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
    issues.push('Lowercased ALL CAPS')
  }

  // 11. Emoji count limit (max 2)
  const emojiCount = (sanitized.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
  if (emojiCount > 2) {
    // Remove extra emojis, keep first 2
    let count = 0
    sanitized = sanitized.replace(/[\u{1F300}-\u{1F9FF}]/gu, (m) => {
      count++
      return count > 2 ? '' : m
    })
    issues.push(`Capped emojis at 2`)
  }

  return {
    passed: issues.length === 0,
    sanitized: sanitized.trim(),
    issues,
  }
}

export function checkInput(message: string): { valid: boolean; reason?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, reason: 'empty' }
  }
  if (message.length > 2000) {
    return { valid: false, reason: 'too_long' }
  }
  // Block messages that are just spam characters
  if (/^[.,!?\-_#@$%^&*()\s]{5,}$/.test(message)) {
    return { valid: false, reason: 'spam' }
  }
  return { valid: true }
}
