"use client"
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'
import { Gift, Share2, Users, IndianRupee, Copy, CheckCircle2, UserPlus } from 'lucide-react'

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      api.get('/referrals/my-code'),
      api.get('/referrals/my-stats'),
    ]).then(([codeRes, statsRes]) => {
      setReferralCode(codeRes.data.referralCode)
      setStats(statsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('In your clipboard 📋')
    setTimeout(() => setCopied(false), 2000)
  }

  const claimRewards = async () => {
    try {
      const res = await api.post('/referrals/claim')
      toast.success(`Reward unlocked 🤑 — ₹${res.data.amountClaimed}`)
      const statsRes = await api.get('/referrals/my-stats')
      setStats(statsRes.data)
    } catch {
      toast.error('Treasure chest locked 🧭')
    }
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center">
          <Gift className="h-7 w-7 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
          <p className="text-gray-500">Invite friends and earn ₹100 for every successful referral</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none bg-blue-50/50 shadow-sm">
          <CardContent className="py-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-blue-700">{stats?.totalReferrals || 0}</div>
            <p className="text-sm text-blue-500 font-bold">Total Referrals</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-green-50/50 shadow-sm">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-green-700">{stats?.completedReferrals || 0}</div>
            <p className="text-sm text-green-500 font-bold">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50/50 shadow-sm">
          <CardContent className="py-6 text-center">
            <IndianRupee className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <div className="text-3xl font-black text-amber-700">{stats?.totalReward || 0}</div>
            <p className="text-sm text-amber-500 font-bold">Pending Reward</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <Card className="border-2 border-dashed border-yellow-200 dark:border-yellow-900">
        <CardContent className="py-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-black">Share Your Referral Link</h2>
            <p className="text-gray-500">Zero referrals is crazy. Do you actually have no friends on campus, or are you just allergic to free cash? Fix your broke status and spam the link.</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-2xl p-2">
              <div className="flex-1 px-4 py-2 font-mono font-bold text-sm truncate">{referralLink}</div>
              <Button onClick={copyLink} className="rounded-xl flex-shrink-0">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-gray-400 font-bold">Or share your code: <span className="font-mono text-primary-600">{referralCode}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Claim Rewards */}
      {parseFloat(stats?.totalReward || 0) > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-bold text-green-800">₹{stats.totalReward} in unclaimed rewards!</p>
                <p className="text-sm text-green-600">Claim now to add to your wallet balance</p>
              </div>
            </div>
            <Button onClick={claimRewards} className="bg-green-600 hover:bg-green-700">
              <IndianRupee className="h-4 w-4 mr-2" />Claim Rewards
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentReferrals?.length > 0 ? (
            <div className="divide-y">
              {stats.recentReferrals.map((ref: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{ref.display_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{ref.status}</Badge>
                    {ref.status === 'completed' && <span className="font-bold text-green-600">+₹{ref.reward_amount}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No referrals yet. Share your link to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
