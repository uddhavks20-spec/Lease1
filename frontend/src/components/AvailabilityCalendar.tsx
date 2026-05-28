"use client"

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface UnavailableRange {
  id: string
  start_date: string
  end_date: string
  source: 'rental' | 'block'
  reason?: string
}

interface AvailabilityCalendarProps {
  itemId: string
  onSelect?: (start: Date, end: Date) => void
  className?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isDateInRange(date: Date, ranges: UnavailableRange[]): boolean {
  const d = date.toISOString().split('T')[0]
  return ranges.some(r => d >= r.start_date && d <= r.end_date)
}

function isPastDate(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function AvailabilityCalendar({ itemId, onSelect, className }: AvailabilityCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date())
  const [ranges, setRanges] = useState<UnavailableRange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/availability/${itemId}`).then(res => {
      setRanges(res.data.unavailable || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [itemId])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const cells: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <span className="font-bold text-sm text-gray-900 dark:text-white">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-wider py-1">{d.slice(0, 2)}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const date = new Date(year, month, day)
          const past = isPastDate(date)
          const unavailable = isDateInRange(date, ranges)

          return (
            <button
              key={day}
              disabled={past}
              onClick={() => {
                if (!past && onSelect) {
                  const end = new Date(date)
                  end.setMonth(end.getMonth() + 1)
                  onSelect(date, end)
                }
              }}
              className={cn(
                'w-full aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center',
                past && 'text-gray-200 dark:text-gray-700 cursor-not-allowed',
                !past && unavailable && 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 cursor-not-allowed',
                !past && !unavailable && 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
          Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
          Past
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
          Available
        </div>
      </div>
    </div>
  )
}
