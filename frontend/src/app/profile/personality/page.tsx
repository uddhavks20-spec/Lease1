"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PersonalityBadge, type PersonalityInfo } from '@/components/PersonalityBadge'
import { PersonalityQuiz } from '@/components/PersonalityQuiz'
import { ArrowLeft, Sparkles, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PersonalityPage() {
  const [renterPersonality, setRenterPersonality] = useState<string | null>(null)
  const [renterInfo, setRenterInfo] = useState<PersonalityInfo | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    try {
      const res = await api.get('/personality/renter')
      if (res.data.personality) {
        setRenterPersonality(res.data.personality)
        setRenterInfo(res.data.info)
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Renter Personality</h1>
            <p className="text-gray-500">Define your rental style to get matched with the perfect sellers</p>
          </div>
        </div>
      </div>

      {renterPersonality && renterInfo ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
            <PersonalityBadge type={renterPersonality} info={renterInfo} size="xl" showRibbon />
            <div>
              <p className="text-sm text-gray-500">You are</p>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">{renterInfo.name}</h2>
              <p className="text-gray-400 italic mt-1">"{renterInfo.motto}"</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowQuiz(true)} className="rounded-xl">
              <Pencil className="h-4 w-4 mr-2" /> Retake Quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">No personality set yet</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Take a quick quiz to define your renter style. This helps us match you with sellers who fit your needs perfectly.
            </p>
            <Button onClick={() => setShowQuiz(true)} className="rounded-xl">
              <Sparkles className="h-4 w-4 mr-2" /> Take the Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {showQuiz && (
        <PersonalityQuiz
          mode="renter"
          onComplete={(personality) => {
            setShowQuiz(false)
            setRenterPersonality(personality)
            fetch()
          }}
          onSkip={() => setShowQuiz(false)}
        />
      )}
    </div>
  )
}
