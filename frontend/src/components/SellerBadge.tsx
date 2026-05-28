"use client"

import Link from 'next/link'
import { ReviewStars } from './ReviewStars'
import { cn } from '@/lib/utils'

interface SellerBadgeProps {
  sellerId: string
  sellerName: string
  avgRating?: number
  reviewCount?: number
  avatarUrl?: string
  size?: 'sm' | 'md'
  className?: string
}

export function SellerBadge({
  sellerId,
  sellerName,
  avgRating = 0,
  reviewCount = 0,
  avatarUrl,
  size = 'sm',
  className,
}: SellerBadgeProps) {
  return (
    <Link
      href={`/seller/profile/${sellerId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 px-3 py-1.5 border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all shadow-sm hover:shadow-md',
        className
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={sellerName}
          className={cn(
            'rounded-full object-cover',
            size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'
          )}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold',
          size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs'
        )}>
          {sellerName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className={cn(
        'font-bold text-gray-900 dark:text-white',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        {sellerName}
      </span>
      {avgRating > 0 && (
        <ReviewStars rating={avgRating} size="sm" count={reviewCount} />
      )}
    </Link>
  )
}
