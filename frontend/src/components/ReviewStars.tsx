"use client"

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewStarsProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
}

const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }
const textMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export function ReviewStars({ rating, max = 5, size = 'md', showValue, count }: ReviewStarsProps) {
  const filled = Math.round(rating)
  const hasHalf = rating - Math.floor(rating) >= 0.3 && rating - Math.floor(rating) < 0.7

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: max }, (_, i) => (
          <Star
            key={i}
            className={cn(
              sizeMap[size],
              i < filled
                ? 'fill-amber-400 text-amber-400'
                : i === filled && hasHalf
                ? 'fill-amber-200 text-amber-400'
                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn('font-bold text-gray-900 dark:text-white ml-1', textMap[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={cn('text-gray-400 ml-1', textMap[size])}>
          ({count})
        </span>
      )}
    </div>
  )
}
