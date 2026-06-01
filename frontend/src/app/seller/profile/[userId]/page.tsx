"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ReviewStars } from '@/components/ReviewStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Medal, Clock, Package, Star, CheckCircle, MapPin } from 'lucide-react'
import Image from 'next/image'

interface SellerProfile {
  id: string
  displayName: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  bio: string | null
  storeName: string | null
  memberSince: string
  role: string
  stats: {
    totalListings: number
    activeListings: number
    totalRentals: number
    completedRentals: number
    avgRating: number
    reviewCount: number
    responseTimeHrs: number
  }
  badges: string[]
}

interface SellerItem {
  id: string
  title: string
  monthly_rent: number
  deposit_amount: number
  condition: string
  image_url: string | null
  is_featured: boolean
}

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  reviewer_name: string
}

export default function SellerProfilePage() {
  const params = useParams()
  const userId = params?.userId as string
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [items, setItems] = useState<SellerItem[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    api.get(`/seller-profile/${userId}`).then(res => {
      setProfile(res.data.profile)
      setItems(res.data.items)
      setReviews(res.data.reviews)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [userId])

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
  if (!profile) return <div className="container py-10 text-center text-gray-500">Seller not found</div>

  const avgRating = profile.stats.avgRating
  const reviewCount = profile.stats.reviewCount
  const completionRate = profile.stats.totalRentals > 0
    ? Math.round((profile.stats.completedRentals / profile.stats.totalRentals) * 100)
    : 0

  return (
    <div className="container py-10">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.displayName} width={96} height={96}
                className="rounded-2xl object-cover w-24 h-24" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {profile.stats.avgRating >= 4.0 && (
              <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1 shadow-lg">
                <Medal className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.storeName || profile.displayName}
              </h1>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none w-fit">
                <CheckCircle className="h-3 w-3 mr-1" /> Verified Seller
              </Badge>
            </div>
            {profile.storeName && (
              <p className="text-gray-500 text-sm mt-1">@{profile.displayName}</p>
            )}
            {profile.bio && (
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">{profile.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
              <ReviewStars rating={avgRating} size="md" showValue count={reviewCount} />
              <span className="text-gray-300">|</span>
              <Clock className="h-4 w-4" />
              <span>Member since {formatDate(profile.memberSince)}</span>
              <span className="text-gray-300">|</span>
              <Package className="h-4 w-4" />
              <span>{profile.stats.completedRentals} rentals completed</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{avgRating.toFixed(1)}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rating</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{reviewCount}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reviews</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{completionRate}%</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Completion</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-gray-900 dark:text-white">{items.length}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Items</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Active Listings ({items.length})
          </h2>
          {items.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active listings right now</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} className="group">
                  <Card className="border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all rounded-2xl overflow-hidden">
                    <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-900">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.title} fill className="object-contain p-4" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {item.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-primary-600 text-white border-none text-[10px]">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-black text-green-600">
                          {formatCurrency(item.monthly_rent)}<span className="text-xs font-normal text-gray-400">/mo</span>
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">{item.condition}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reviews</h2>
          </div>

          {/* Rating Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center shadow-sm">
            <div className="text-4xl font-black text-gray-900 dark:text-white">{avgRating.toFixed(1)}</div>
            <ReviewStars rating={avgRating} size="lg" />
            <p className="text-sm text-gray-500 mt-2">{reviewCount} reviews</p>
          </div>

          {/* Review List */}
          {reviews.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 text-center">
              <p className="text-gray-400 text-sm">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{review.reviewer_name}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                  <ReviewStars rating={review.rating} size="sm" />
                  {review.title && (
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mt-2">{review.title}</h4>
                  )}
                  {review.body && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{review.body}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
