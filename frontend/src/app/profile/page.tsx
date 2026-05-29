"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PersonalityBadge, type PersonalityInfo } from '@/components/PersonalityBadge'
import Link from 'next/link'
import { Sparkles, User, ArrowRight } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [renterPersonality, setRenterPersonality] = useState<string | null>(null)
  const [renterInfo, setRenterInfo] = useState<PersonalityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/personality/renter').then((res) => {
      if (res.data.personality) {
        setRenterPersonality(res.data.personality)
        setRenterInfo(res.data.info)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="container py-10 max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Profile</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Manage your account & preferences</p>
      </div>

      <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
              <User className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">{user?.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-black uppercase tracking-tighter">Your Renter Personality</h2>
        </div>

        {loading ? (
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </Card>
        ) : renterPersonality && renterInfo ? (
          <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
              <PersonalityBadge type={renterPersonality} info={renterInfo} size="xl" showRibbon />
              <div>
                <p className="text-sm text-gray-500">You are a</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{renterInfo.name}</h3>
                <p className="text-gray-400 italic mt-1">"{renterInfo.motto}"</p>
              </div>
              <Link href="/profile/personality">
                <Button variant="outline" size="sm" className="rounded-xl">
                  Update Personality
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-12 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">No personality set yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Take a quick quiz to define your renter style and get matched with the perfect sellers.
              </p>
            </div>
            <Link href="/profile/personality">
              <Button className="rounded-xl">
                <Sparkles className="h-4 w-4 mr-2" /> Take the Quiz
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
