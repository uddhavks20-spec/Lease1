"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { StatusTimeline } from '@/components/StatusTimeline'
import { ReviewStars } from '@/components/ReviewStars'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ArrowLeft, Calendar, CreditCard, Shield, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RentalDetail {
  id: string
  item_id: string
  renter_id: string
  duration_months: number
  total_rent: number
  deposit_amount: number
  platform_commission: number
  status: string
  start_date: string | null
  end_date: string | null
  actual_end_date: string | null
  delivery_address: string | null
  delivery_notes: string | null
  created_at: string
  item_title: string
  seller_id: string
  seller_name: string
}

interface TimelineEntry {
  id: string
  from_status: string | null
  to_status: string
  notes: string | null
  created_at: string
}

export default function RentalDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [rental, setRental] = useState<RentalDetail | null>(null)
  const [history, setHistory] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (!id) return

    api.get(`/rentals/${id}/timeline`).then(res => {
      setRental(res.data.rental)
      setHistory(res.data.history || [])
    }).catch(() => {
      toast.error('Rental details corrupted 📁')
      router.push('/renter/dashboard')
    }).finally(() => setLoading(false))
  }, [id, user, router])

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
  if (!rental) return null

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    disputed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const monthlyRent = rental.total_rent / rental.duration_months

  return (
    <div className="container py-10">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Timeline */}
        <div className="lg:col-span-5">
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Rental Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={rental.status} history={history} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{rental.item_title}</h1>
                <Badge className={`${statusColors[rental.status] || 'bg-gray-100 text-gray-700'} border-none capitalize font-bold text-xs px-4 py-1.5`}>
                  {rental.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Rent</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{formatCurrency(monthlyRent)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deposit</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{formatCurrency(rental.deposit_amount)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{rental.duration_months}mo</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Rent</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{formatCurrency(rental.total_rent)}</p>
                </div>
              </div>

              {rental.start_date && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>Started: {formatDate(rental.start_date)}</span>
                  {rental.end_date && (
                    <span>• Ends: {formatDate(rental.end_date)}</span>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {(rental.status === 'active' || rental.status === 'scheduled') && (
                  <Link href={`/renter/return/${rental.id}`}>
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                      Return Item
                    </Button>
                  </Link>
                )}
                <Link href={`/items/${rental.item_id}`}>
                  <Button variant="ghost">View Item</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* History Log */}
          {history.length > 0 && (
            <Card className="border-gray-100 dark:border-gray-800 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px] font-bold">
                          {entry.from_status || '—'}
                        </Badge>
                        <span className="text-gray-300">→</span>
                        <Badge className="capitalize text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-none">
                          {entry.to_status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
