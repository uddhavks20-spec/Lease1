"use client"

import { cn, formatDate } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, Package, Truck, Home, RotateCcw, Ban, AlertTriangle } from 'lucide-react'

interface TimelineStep {
  status: string
  label: string
  date: string | null
  icon: React.ReactNode
  isActive: boolean
  isCurrent: boolean
}

const STATUS_FLOW = [
  'pending', 'approved', 'rejected',
  'scheduled', 'active',
  'completed', 'cancelled', 'disputed',
]

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending:    { label: 'Payment Pending',  icon: <Clock className="h-4 w-4" />,       color: 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20' },
  approved:   { label: 'Order Confirmed',  icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20' },
  rejected:   { label: 'Rejected',         icon: <Ban className="h-4 w-4" />,          color: 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20' },
  scheduled:  { label: 'Delivery Scheduled', icon: <Truck className="h-4 w-4" />,      color: 'text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-900/20' },
  active:     { label: 'In Your Hands',    icon: <Home className="h-4 w-4" />,         color: 'text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20' },
  completed:  { label: 'Returned',         icon: <RotateCcw className="h-4 w-4" />,    color: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800' },
  cancelled:  { label: 'Cancelled',        icon: <Ban className="h-4 w-4" />,          color: 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20' },
  disputed:   { label: 'Dispute Raised',   icon: <AlertTriangle className="h-4 w-4" />, color: 'text-orange-500 border-orange-200 bg-orange-50 dark:bg-orange-900/20' },
}

function getTimelineSteps(currentStatus: string, history: Array<{ from_status: string | null; to_status: string; created_at: string }>): TimelineStep[] {
  const completedStatuses = new Set(history.map(h => h.to_status))
  const stepDates = new Map<string, string>()
  for (const h of history) {
    stepDates.set(h.to_status, h.created_at)
  }

  // Define the linear path based on current status
  const isTerminal = ['completed', 'cancelled', 'rejected', 'disputed'].includes(currentStatus)

  // Build the steps to show
  const relevantStatuses: string[] = []

  if (currentStatus === 'rejected') {
    relevantStatuses.push('pending', 'rejected')
  } else if (currentStatus === 'cancelled') {
    // Show up to cancellation point
    for (const s of STATUS_FLOW) {
      relevantStatuses.push(s)
      if (s === currentStatus) break
    }
  } else {
    // Normal flow: show all statuses up to current
    for (const s of STATUS_FLOW) {
      if (s === 'rejected') continue
      relevantStatuses.push(s)
      if (s === currentStatus) break
    }
  }

  return relevantStatuses.map((status) => {
    const meta = STATUS_META[status]
    const date = stepDates.get(status)
    const isActive = completedStatuses.has(status)
    const isCurrent = status === currentStatus

    return {
      status,
      label: meta?.label || status,
      date: date || null,
      icon: meta?.icon || <Circle className="h-4 w-4" />,
      isActive: isActive || isCurrent,
      isCurrent,
    }
  })
}

interface StatusTimelineProps {
  currentStatus: string
  history: Array<{ from_status: string | null; to_status: string; created_at: string }>
  className?: string
}

export function StatusTimeline({ currentStatus, history, className }: StatusTimelineProps) {
  const steps = getTimelineSteps(currentStatus, history)

  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, i) => (
        <div key={step.status} className="flex gap-4">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0',
              step.isActive
                ? STATUS_META[step.status]?.color || 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-300'
            )}>
              {step.icon}
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-0.5 h-8',
                step.isActive ? 'bg-primary-200 dark:bg-primary-800' : 'bg-gray-100 dark:bg-gray-800'
              )} />
            )}
          </div>

          {/* Content */}
          <div className={cn('pb-8', i === steps.length - 1 && 'pb-0')}>
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-bold text-sm',
                step.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
              )}>
                {step.label}
              </span>
              {step.isCurrent && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-primary-600 text-white px-2 py-0.5 rounded-full">
                  Current
                </span>
              )}
            </div>
            {step.date && (
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(step.date)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
