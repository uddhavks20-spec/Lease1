import { Router, type Request, type Response, type NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '../../middleware/auth'
import { calcDepositMultiplier, PLATFORM_TAKE } from './chat'

const router = Router()

interface CheckIn {
  week: number
  dueDate: string
  respondedAt: string | null
  status: 'pending' | 'ok' | 'no_response' | 'issue'
}

interface Guarantor {
  name: string
  email: string
  phone: string
  accepted: boolean
  acceptedAt: string | null
}

interface Booking {
  id: string
  userId: string
  userEmail: string
  itemName: string
  mrv: number
  monthlyRent: number
  deposit: number
  tenureMonths: number
  condition: string
  category: string
  guarantor: Guarantor | null
  status: 'pending_guarantor' | 'active' | 'overdue' | 'completed' | 'disputed'
  startDate: string
  endDate: string
  checkIns: CheckIn[]
  sellerPayout: number
  platformTake: number
  sellerScore: string
  createdAt: string
}

const bookings = new Map<string, Booking>()
const userBookings = new Map<string, string[]>()

function generateCheckIns(tenureMonths: number, startDate: Date): CheckIn[] {
  const checks: CheckIn[] = []
  const totalWeeks = tenureMonths * 4
  for (let w = 1; w <= totalWeeks; w++) {
    const due = new Date(startDate)
    due.setDate(due.getDate() + w * 7)
    checks.push({ week: w, dueDate: due.toISOString(), respondedAt: null, status: 'pending' })
  }
  return checks
}

function calcCareScore(checkIns: CheckIn[], completed: boolean): number {
  if (checkIns.length === 0) return completed ? 80 : 50
  const responded = checkIns.filter(c => c.status === 'ok').length
  const issues = checkIns.filter(c => c.status === 'issue').length
  const missed = checkIns.filter(c => c.status === 'no_response' || (c.status === 'pending' && new Date(c.dueDate) < new Date())).length
  let score = 100
  score -= missed * 5
  score -= issues * 15
  if (completed) score += 10
  return Math.max(0, Math.min(100, score))
}

const CATEGORY_RATES: Record<string, number> = {
  Electronics: 0.060, Appliance: 0.055, Furniture: 0.040, Lifestyle: 0.075, Book: 0.030, Other: 0.050,
}

function estimateCompMonthly(mrv: number, category: string): number {
  return Math.round(mrv * (CATEGORY_RATES[category] || 0.050))
}

// ─── CREATE BOOKING ─────────────────────────────────────────────────
router.post('/create', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub || 'anonymous'
    const userEmail = req.body.userEmail || 'unknown@campus.edu'
    const { itemName, mrv, monthlyRent, deposit, tenureMonths, condition, category, sellerScore } = req.body

    if (!itemName || !tenureMonths || !monthlyRent) {
      return res.status(400).json({ error: 'itemName, tenureMonths, and monthlyRent are required' })
    }

    const estimatedMRV = mrv || 50000
    const effectiveCondition = condition || 'Good'
    const effectiveCategory = category || 'Electronics'

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + tenureMonths)

    const takeRate = sellerScore === 'high' ? 0.18 : sellerScore === 'low' ? 0.22 : PLATFORM_TAKE
    const platformTakeCalc = Math.round(monthlyRent * takeRate)
    const sellerPayoutCalc = monthlyRent - platformTakeCalc

    const booking: Booking = {
      id: uuidv4().slice(0, 12),
      userId,
      userEmail,
      itemName,
      mrv: estimatedMRV,
      monthlyRent,
      deposit: deposit || Math.round(monthlyRent * calcDepositMultiplier(estimatedMRV)),
      tenureMonths,
      condition: effectiveCondition,
      category: effectiveCategory,
      guarantor: null,
      status: 'pending_guarantor',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      checkIns: generateCheckIns(tenureMonths, startDate),
      sellerPayout: sellerPayoutCalc,
      platformTake: platformTakeCalc,
      sellerScore: sellerScore || 'medium',
      createdAt: startDate.toISOString(),
    }

    bookings.set(booking.id, booking)

    if (!userBookings.has(userId)) userBookings.set(userId, [])
    userBookings.get(userId)!.push(booking.id)

    res.status(201).json({
      booking: {
        id: booking.id,
        itemName: booking.itemName,
        monthlyRent: booking.monthlyRent,
        deposit: booking.deposit,
        tenureMonths: booking.tenureMonths,
        status: booking.status,
        guarantorRequired: true,
        startDate: booking.startDate,
        endDate: booking.endDate,
        estimatedCompMonthly: estimateCompMonthly(estimatedMRV, effectiveCategory),
        sellerPayout: booking.sellerPayout,
        platformTake: booking.platformTake,
      },
    })
  } catch (e) {
    next(e)
  }
})

// ─── ADD GUARANTOR ──────────────────────────────────────────────────
router.post('/:id/guarantor', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const booking = bookings.get(id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const { name, email, phone } = req.body
    if (!name || !email) {
      return res.status(400).json({ error: 'Guarantor name and email are required' })
    }

    booking.guarantor = {
      name,
      email,
      phone: phone || '',
      accepted: true,
      acceptedAt: new Date().toISOString(),
    }

    booking.status = 'active'

    res.json({
      message: 'Guarantor added. Booking is now active.',
      booking: {
        id: booking.id,
        status: booking.status,
        guarantor: { name: booking.guarantor.name, email: booking.guarantor.email },
      },
    })
  } catch (e) {
    next(e)
  }
})

// ─── CHECK-IN RESPONSE ──────────────────────────────────────────────
router.post('/:id/checkin', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const booking = bookings.get(id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const { status } = req.body
    if (!['ok', 'issue'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "ok" or "issue"' })
    }

    const pendingCheckin = booking.checkIns.find(c => c.status === 'pending' && new Date(c.dueDate) <= new Date())
    if (!pendingCheckin) {
      return res.status(400).json({ error: 'No pending check-in due' })
    }

    pendingCheckin.respondedAt = new Date().toISOString()
    pendingCheckin.status = status

    if (status === 'issue') {
      booking.status = 'disputed'
    }

    const careScore = calcCareScore(booking.checkIns, booking.status === 'completed')

    res.json({
      message: status === 'ok' ? 'Check-in confirmed. Item is with you.' : 'Issue reported. Team will contact you.',
      checkIn: { week: pendingCheckin.week, status: pendingCheckin.status },
      careScore,
    })
  } catch (e) {
    next(e)
  }
})

// ─── COMPLETE BOOKING (RETURN) ──────────────────────────────────────
router.post('/:id/complete', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const booking = bookings.get(id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.status === 'completed') return res.status(400).json({ error: 'Already completed' })

    const missedChecks = booking.checkIns.filter(c => c.status === 'pending' && new Date(c.dueDate) < new Date())
    for (const c of missedChecks) c.status = 'no_response'

    booking.status = 'completed'
    const careScore = calcCareScore(booking.checkIns, true)

    res.json({
      message: 'Rental completed. Thanks for using Lease!',
      careScore,
      checkInSummary: {
        total: booking.checkIns.length,
        ok: booking.checkIns.filter(c => c.status === 'ok').length,
        missed: booking.checkIns.filter(c => c.status === 'no_response').length,
        issues: booking.checkIns.filter(c => c.status === 'issue').length,
      },
      deposit: booking.deposit,
      depositStatus: 'refund_initiated',
      careScoreTip: careScore < 60
        ? 'Your care score is low — future rentals may need a higher deposit.'
        : careScore < 80
          ? 'Good care score. Keep it up for zero-deposit eligibility.'
          : 'Excellent care score! You may qualify for zero-deposit on your next rental.',
    })
  } catch (e) {
    next(e)
  }
})

// ─── GET ACTIVE BOOKINGS ────────────────────────────────────────────
router.get('/active', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub || 'anonymous'
    const userBookingIds = userBookings.get(userId) || []
    const userBookingsList = userBookingIds
      .map(id => bookings.get(id))
      .filter((b): b is Booking => b !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const activeBookings = userBookingsList.filter(b => b.status === 'active' || b.status === 'pending_guarantor')

    const now = new Date()
    const pendingCheckins = activeBookings.map(b => {
      const nextCheckin = b.checkIns.find(c => c.status === 'pending' && new Date(c.dueDate) <= now)
      return { bookingId: b.id, itemName: b.itemName, nextCheckin }
    }).filter(c => c.nextCheckin)

    res.json({
      active: activeBookings.map(b => ({
        id: b.id,
        itemName: b.itemName,
        monthlyRent: b.monthlyRent,
        deposit: b.deposit,
        tenureMonths: b.tenureMonths,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        guarantor: b.guarantor ? { name: b.guarantor.name, accepted: b.guarantor.accepted } : null,
        careScore: calcCareScore(b.checkIns, b.status === 'completed'),
        checkInProgress: b.checkIns.filter(c => c.status !== 'pending').length,
        checkInTotal: b.checkIns.length,
      })),
      pendingCheckins,
      all: userBookingsList.map(b => ({
        id: b.id,
        itemName: b.itemName,
        monthlyRent: b.monthlyRent,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate,
        careScore: calcCareScore(b.checkIns, b.status === 'completed'),
      })),
    })
  } catch (e) {
    next(e)
  }
})

// ─── GET SINGLE BOOKING ─────────────────────────────────────────────
router.get('/:id', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const booking = bookings.get(id)
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const dueCheckins = booking.checkIns.filter(c => c.status === 'pending' && new Date(c.dueDate) <= new Date())

    res.json({
      booking: {
        ...booking,
        careScore: calcCareScore(booking.checkIns, booking.status === 'completed'),
        dueCheckins: dueCheckins.length,
        nextCheckinDue: dueCheckins.length > 0 ? dueCheckins[0].dueDate : null,
      },
    })
  } catch (e) {
    next(e)
  }
})

export default router
