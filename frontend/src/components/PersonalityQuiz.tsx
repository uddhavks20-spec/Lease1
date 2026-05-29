"use client"

import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface PersonalityQuizProps {
  mode: 'renter' | 'seller'
  itemId?: string
  onComplete: (personality: string) => void
  onSkip: () => void
}

const RENTER_QUESTIONS = [
  {
    question: 'What brings you here today?',
    key: 'goal',
    options: [
      { value: 'saver', label: 'I need an item for the long haul (6+ months)', icon: '🏦' },
      { value: 'trialler', label: 'I want to try premium gear before buying', icon: '🧪' },
      { value: 'flexer', label: 'I need something affordable, quick', icon: '💪' },
      { value: 'switcher', label: 'I love switching up my gear often', icon: '🔄' },
      { value: 'missionary', label: 'I need something for a fixed period', icon: '🎯' },
      { value: 'aspirer', label: 'I want luxury experiences without the price tag', icon: '✨' },
    ],
  },
  {
    question: 'Minimum condition you\'d accept?',
    key: 'minCondition',
    options: [
      { value: 'fair', label: 'Fair — signs of use but functional', icon: '👍' },
      { value: 'good', label: 'Good — minor wear, full function', icon: '✅' },
      { value: 'excellent', label: 'Excellent — near-perfect condition', icon: '✨' },
      { value: 'mint', label: 'Mint — like-new condition', icon: '🌟' },
      { value: 'new', label: 'New — unused, in original packaging', icon: '💎' },
    ],
  },
  {
    question: 'Ideal rental duration?',
    key: 'duration',
    options: [
      { value: 'short', label: 'Short term (1-3 months)', icon: '⏱️' },
      { value: 'medium', label: 'Medium term (4-11 months)', icon: '📅' },
      { value: 'long', label: 'Long term (12-24 months)', icon: '📆' },
      { value: 'extended', label: 'Extended (25+ months)', icon: '🗓️' },
      { value: 'flexible', label: 'Flexible / Not sure', icon: '🔄' },
    ],
  },
  {
    question: 'Monthly budget range?',
    key: 'budget',
    options: [
      { value: 'minimal', label: '₹500 — ₹1,000', icon: '💰' },
      { value: 'moderate', label: '₹1,000 — ₹3,000', icon: '💵' },
      { value: 'premium', label: '₹3,000 — ₹10,000', icon: '💎' },
      { value: 'luxury', label: '₹10,000+', icon: '👑' },
    ],
  },
]

const SELLER_QUESTIONS = [
  {
    question: 'Why are you renting this out?',
    key: 'goal',
    options: [
      { value: 'declutterer', label: 'It\'s collecting dust, want passive income', icon: '🧹' },
      { value: 'upgrader', label: 'Want to fund an upgrade', icon: '⬆️' },
      { value: 'collector', label: 'I curate items for people to enjoy', icon: '🎨' },
      { value: 'mogul', label: 'I\'m building a rental business', icon: '💼' },
      { value: 'hobbyist', label: 'I rent it when I\'m not using it', icon: '🎸' },
      { value: 'seasonal', label: 'I only list during peak seasons', icon: '🎪' },
    ],
  },
  {
    question: 'How fast do you want this rented?',
    key: 'speed',
    options: [
      { value: 'asap', label: 'ASAP — within this week', icon: '⚡' },
      { value: 'soon', label: 'Within a month', icon: '📅' },
      { value: 'no_rush', label: 'No rush — whenever it rents', icon: '😌' },
    ],
  },
  {
    question: 'Preferred rental duration?',
    key: 'duration',
    options: [
      { value: 'short', label: 'Short (1-3 months)', icon: '⏱️' },
      { value: 'medium', label: 'Medium (4-11 months)', icon: '📅' },
      { value: 'long', label: 'Long (12+ months)', icon: '📆' },
      { value: 'any', label: 'Any duration is fine', icon: '🔄' },
    ],
  },
  {
    question: 'Open to negotiating rent?',
    key: 'negotiate',
    options: [
      { value: 'yes', label: 'Yes — flexible on price', icon: '🤝' },
      { value: 'no', label: 'No — fixed price', icon: '🔒' },
    ],
  },
]

export function PersonalityQuiz({ mode, itemId, onComplete, onSkip }: PersonalityQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const questions = mode === 'renter' ? RENTER_QUESTIONS : SELLER_QUESTIONS
  const currentQ = questions[step]

  const select = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.key]: value }))
  }

  const next = () => {
    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      save()
    }
  }

  const prev = () => {
    if (step > 0) setStep(step - 1)
  }

  const save = async () => {
    setSaving(true)
    try {
      const personality = answers.goal
      const payload = { personality, answers }

      if (mode === 'renter') {
        await api.post('/personality/renter', payload)
      } else if (itemId) {
        await api.post(`/personality/item/${itemId}`, payload)
      }
      toast.success(`${mode === 'renter' ? 'Renter' : 'Seller'} personality saved!`)
      onComplete(personality)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isSelected = (value: string) => answers[currentQ.key] === value

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto border-0 shadow-2xl">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider">
                  {mode === 'renter' ? 'Discover Your Renter Style' : 'Define Your Item Personality'}
                </h2>
                <p className="text-[10px] text-gray-400">
                  Step {step + 1} of {questions.length}
                </p>
              </div>
            </div>
            <button onClick={onSkip} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">{currentQ.key}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{currentQ.question}</h3>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map(opt => (
              <button
                key={opt.value}
                onClick={() => select(opt.value)}
                className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                  isSelected(opt.value)
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-bold ${isSelected(opt.value) ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                    {opt.label}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected(opt.value) ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                }`}>
                  {isSelected(opt.value) && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {step > 0 ? (
                <Button variant="ghost" size="sm" onClick={prev} className="rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={onSkip} className="rounded-xl text-gray-400">
                  Skip all
                </Button>
              )}
            </div>
            <Button
              size="sm"
              onClick={next}
              disabled={!answers[currentQ.key] || saving}
              className="rounded-xl"
            >
              {saving ? 'Saving...' : step < questions.length - 1 ? 'Next' : 'Finish'}
              {!saving && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>

          {/* Skip note */}
          {step === 0 && (
            <p className="text-[10px] text-center text-gray-400">
              This helps us match you with the perfect {mode === 'renter' ? 'sellers' : 'renters'}.
              You can always update this later in your profile settings.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
