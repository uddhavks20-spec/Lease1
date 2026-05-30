"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { WishlistButton } from '@/components/WishlistButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, ShoppingCart, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface WishlistItem {
  id: string
  item_id: string
  created_at: string
  title: string
  monthly_rent: number
  deposit_amount: number
  condition: string
  status: string
  image_url: string | null
}

export default function WishlistPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    api.get('/wishlist').then(res => {
      setItems(res.data.items || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user, router])

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/wishlist/${itemId}`)
      setItems(items.filter(i => i.item_id !== itemId))
      toast.success('Removed from wishlist')
    } catch {
      toast.error('Failed to remove')
    }
  }

  if (!user) return null
  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )

  const FALLBACK_IMG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text fill="#9ca3af" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>')

  return (
    <div className="container py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-6 w-6 text-red-500" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
        {items.length > 0 && (
          <span className="text-gray-400 text-sm font-medium">({items.length} items)</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Heart className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">YOUR WISHLIST IS EMPTY</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Manifesting is completely free, yet your list is still giving absolute bankruptcy. Tap the heart icon on any listing to start hoarding items you can't currently afford. Let's build that ego back up. 💸📉
          </p>
          <Link href="/browse">
            <Button>Start Manifesting 🔍</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.item_id}`} className="group">
              <Card className="border-none bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-out group-hover:-translate-y-2 transform-gpu">
                <div className="relative aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-10">
                  <Image
                    src={item.image_url?.startsWith('http') ? item.image_url : FALLBACK_IMG}
                    alt={item.title}
                    fill
                    className="object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 z-10">
                    <WishlistButton itemId={item.item_id} size="sm" />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-white/90 dark:bg-black/50 text-gray-900 dark:text-white backdrop-blur-md border-none shadow-sm text-[10px] font-black uppercase px-3 py-1">
                      {formatCurrency(item.deposit_amount)} Deposit
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                        {item.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] capitalize mt-1">
                        {item.condition}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Monthly Rent</p>
                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(item.monthly_rent)}
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-gray-900 dark:bg-primary-600 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
