"use client"

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface WishlistButtonProps {
  itemId: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
const buttonSizeMap = { sm: 'p-1.5', md: 'p-2', lg: 'p-2.5' }

export function WishlistButton({ itemId, size = 'md', className }: WishlistButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    api.get(`/wishlist/check/${itemId}`).then(res => {
      setInWishlist(res.data.inWishlist)
    }).catch(() => {})
  }, [itemId, user])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error('Please login to save items')
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${itemId}`)
        setInWishlist(false)
        toast.success('Removed from wishlist')
      } else {
        await api.post(`/wishlist/${itemId}`)
        setInWishlist(true)
        toast.success('Added to wishlist')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all',
        buttonSizeMap[size],
        inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-400',
        className
      )}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          sizeMap[size],
          'transition-all',
          inWishlist ? 'fill-red-500' : 'fill-transparent'
        )}
      />
    </button>
  )
}
