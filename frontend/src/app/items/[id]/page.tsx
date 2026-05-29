"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useCart } from '@/lib/cart-context'
import { LeaseGuru } from '@/components/LeaseGuru'
import { ReviewStars } from '@/components/ReviewStars'
import { WishlistButton } from '@/components/WishlistButton'
import { SellerBadge } from '@/components/SellerBadge'
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Shield, Clock, MapPin, Info, ArrowRight, ShoppingCart, AlertTriangle, Star, MessageSquare, ChevronDown, ChevronUp, CheckCircle, Tag, Package, RefreshCw, Truck, Zap, Heart, Percent, HelpCircle, Sparkles } from 'lucide-react'
import { PersonalityBadge, PersonalityRibbon } from '@/components/PersonalityBadge'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface Item {
  id: string
  title: string
  description: string
  monthly_rent: number
  deposit_amount: number
  retail_price: number
  condition: string
  category_id: string
  sub_attributes?: Record<string, string>
  images?: Array<{ image_url: string }>
  seller?: { firstName: string; lastName: string }
  verified_status?: string
  seller_id: string
  seller_name: string
  seller_avatar?: string
  seller_display_name?: string
  seller_personality?: string
  seller_personality_answers?: Record<string, any>
  personality_match?: number
}

interface SellerStats {
  avg_rating: number
  review_count: number
  completed_rentals: number
}

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  created_at: string
  reviewer_name: string
}

interface RelatedItem {
  id: string
  title: string
  monthly_rent: number
  deposit_amount: number
  image_url: string
  condition: string
}

const CONDITION_RENT_FACTOR: Record<string, number> = {
  'new': 1.00, 'mint': 0.95, 'excellent': 0.95,
  'good': 0.88, 'fair': 0.78, 'poor': 0.65,
}
const CONDITION_UNDERCUT: Record<string, number> = {
  'new': 0.02, 'mint': 0.03, 'excellent': 0.03,
  'good': 0, 'fair': 0, 'poor': 0,
}
const EMI_ANNUAL_RATE = 0.15
const TENURE_BANDS = [
  { id: 'flash', min: 1, max: 3, emiHorizon: 12 },
  { id: 'semester', min: 4, max: 11, emiHorizon: 18 },
  { id: 'annual', min: 12, max: 18, emiHorizon: 24 },
  { id: 'extended', min: 19, max: 24, emiHorizon: 36 },
  { id: 'lifecycle', min: 25, max: 48, emiHorizon: 48 },
]

function getTenureBand(months: number) {
  return TENURE_BANDS.find(b => months >= b.min && months <= b.max) || TENURE_BANDS[2]
}
function calcDepositMultiplier(mrv: number): number {
  return 1.0 + Math.max(0, Math.floor((mrv - 1) / 10000)) * 0.065
}
function tenureFactor(n: number): number {
  return 0.6 + 0.4 * Math.pow(12 / Math.max(3, Math.min(48, n)), 0.5)
}
function computePricing(mrv: number, condition: string, categoryName: string, months: number) {
  const COMPETITOR_RATES: Record<string, number> = {
    'Electronics & Entertainment': 0.060, Electronics: 0.060,
    'Appliances & Cooling': 0.055, Appliance: 0.055,
    'Study & Furniture': 0.040, Furniture: 0.040,
    'Clothing & Accessories': 0.075, Lifestyle: 0.075, Clothing: 0.075,
  }
  const compRate = COMPETITOR_RATES[categoryName] || 0.060
  const cond = condition.toLowerCase()
  const condRentFactor = CONDITION_RENT_FACTOR[cond] || 0.88
  const itemUndercut = CONDITION_UNDERCUT[cond] ?? 0
  const depositMultiplier = calcDepositMultiplier(mrv)
  const band = getTenureBand(months)
  const compMonthly = Math.round(mrv * compRate)
  const emiTotal = Math.round(mrv + mrv * EMI_ANNUAL_RATE * band.emiHorizon / 12)
  const emiMonthly = Math.round(emiTotal / band.emiHorizon)
  const baselineNew = Math.round(Math.min(compMonthly, emiMonthly) * (1 - itemUndercut))
  const leaseRent = Math.round(baselineNew * condRentFactor * tenureFactor(months))
  const deposit = Math.round(leaseRent * depositMultiplier)
  return { leaseRent, deposit, compMonthly, emiMonthly, band: band.id, baselineNew, tenureFactor: tenureFactor(months) }
}

let categoryCache: Record<string, string> | null = null
async function getCategoryName(id: string): Promise<string> {
  if (!categoryCache) {
    const res = await api.get('/categories')
    const cats = res.data.categories || []
    categoryCache = Object.fromEntries(cats.map((c: any) => [c.id, c.name]))
  }
  return categoryCache[id] || 'Electronics'
}

const FAQ_ITEMS = [
  { q: 'How does leasing work?', a: 'You pay a small monthly fee instead of buying the product upfront. Choose your tenure (3–48 months), pay the first month\'s rent + refundable security deposit, and the item is delivered to your door.' },
  { q: 'What if the item gets damaged?', a: 'Minor wear and tear is expected and covered. For accidental damage, we offer affordable protection plans. Theft protection is included with every lease.' },
  { q: 'Can I extend or cancel early?', a: 'Yes — extend anytime from your dashboard. Early cancellation is available with a small fee depending on how long you\'ve had the item.' },
  { q: 'Is there a buy option?', a: 'Absolutely. After 6+ months of rental, you can purchase the item at a reduced residual value. The amount you\'ve already paid is deducted from the buy price.' },
  { q: 'What happens at the end of the lease?', a: 'We schedule a free pickup. Just pack the item and accessories, and our delivery partner collects it from your doorstep. Your security deposit is refunded within 7 days.' },
]

const WHY_LEASE = [
  { icon: Zap, title: 'No Upfront Cost', desc: 'Get the latest products without paying the full price upfront' },
  { icon: RefreshCw, title: 'Free Upgrades', desc: 'Swap to newer models anytime — always stay current' },
  { icon: Shield, title: 'Theft Protected', desc: 'Every lease includes theft protection at no extra cost' },
  { icon: Truck, title: 'Free Delivery', desc: 'Free doorstep delivery and pickup when you return' },
  { icon: Clock, title: 'Flexible Tenure', desc: 'Choose 3–48 months — extend or cancel as needed' },
  { icon: Heart, title: 'Try Before Commit', desc: 'Use it for months before deciding to buy or return' },
]

const CONDITION_LABEL: Record<string, string> = {
  'new': 'New', 'mint': 'Mint', 'excellent': 'Mint',
  'good': 'Good', 'fair': 'Fair', 'poor': 'Poor',
}

const SELLER_PERSONALITY_INFO: Record<string, { name: string; motto: string; icon: string }> = {
  declutterer: { name: 'The Declutterer', motto: 'Dusting it off for cash', icon: '🧹' },
  upgrader:    { name: 'The Upgrader',    motto: 'Rent this, fund the next', icon: '⬆️' },
  collector:   { name: 'The Collector',   motto: 'My collection, your experience', icon: '🎨' },
  mogul:       { name: 'The Mogul',       motto: 'Building a rental empire', icon: '💼' },
  hobbyist:    { name: 'The Hobbyist',    motto: 'Share when I don\'t use', icon: '🎸' },
  seasonal:    { name: 'The Seasonal',    motto: 'Ride the wave', icon: '🎪' },
}

const RENTER_PERSONALITY_INFO: Record<string, { name: string; motto: string; icon: string }> = {
  saver:      { name: 'The Saver',      motto: 'Best value over time', icon: '🏦' },
  trialler:   { name: 'The Trialler',   motto: 'Try before I buy', icon: '🧪' },
  flexer:     { name: 'The Flexer',     motto: 'On a budget, need it now', icon: '💪' },
  switcher:   { name: 'The Switcher',   motto: 'Always want the latest', icon: '🔄' },
  missionary: { name: 'The Missionary', motto: 'Need it for a specific purpose', icon: '🎯' },
  aspirer:    { name: 'The Aspirer',    motto: 'Live the luxury life', icon: '✨' },
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const id = params?.id as string
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(12)
  const [categoryName, setCategoryName] = useState('Electronics')
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    api.get(`/items/${id}`).then((res) => {
      if (cancelled) return
      const itemData = res.data.item
      if (res.data.images && res.data.images.length > 0) {
        itemData.images = res.data.images
      }
      setItem(itemData)
      if (res.data.sellerStats) setSellerStats(res.data.sellerStats)
      if (itemData.verified_status || itemData.sub_attributes) {
        if (itemData.sub_attributes && typeof itemData.sub_attributes === 'object' && !Array.isArray(itemData.sub_attributes)) {
          setItem(prev => prev ? { ...prev, sub_attributes: itemData.sub_attributes } : prev)
        }
      }
      if (itemData.category_id) {
        getCategoryName(itemData.category_id).then(name => { if (!cancelled) setCategoryName(name) })
      }
      // Fetch other items from same seller
      api.get(`/items?seller_id=${itemData.seller_id}&exclude=${id}&limit=6`).then(relRes => {
        if (!cancelled) setRelatedItems(relRes.data.items || [])
      }).catch(() => {})
    }).finally(() => { if (!cancelled) setLoading(false) })

    api.get(`/reviews/item/${id}`).then(res => {
      if (!cancelled) setReviews(res.data.reviews || [])
    }).catch(() => {})

    return () => { cancelled = true }
  }, [id])

  const pricing = item && item.retail_price > 0
    ? computePricing(Number(item.retail_price), item.condition || 'good', categoryName, duration)
    : null

  const monthlyRent = pricing?.leaseRent ?? Number(item?.monthly_rent ?? 0)
  const depositAmount = pricing?.deposit ?? Number(item?.deposit_amount ?? 0)
  const totalFirstPayment = monthlyRent + depositAmount
  const totalRentalCost = monthlyRent * duration
  const vsCompetitor = pricing ? Math.round((pricing.compMonthly - monthlyRent) * duration) : 0
  const vsEmi = pricing ? Math.round((pricing.emiMonthly - monthlyRent) * duration) : 0
  const savings = item && item.retail_price > 0 ? Number(item.retail_price) - totalRentalCost : 0
  const savingsPercent = item && item.retail_price > 0 ? Math.round((savings / Number(item.retail_price)) * 100) : 0

  const handleAddToCart = () => {
    if (!item) return
    addToCart({ id: item.id, title: item.title, monthly_rent: monthlyRent, deposit_amount: depositAmount, image: item.images?.[0]?.image_url || '/images/placeholder.png', duration })
    toast.success('Added to cart')
  }

  const startRental = () => {
    if (!item) return
    addToCart({ id: item.id, title: item.title, monthly_rent: monthlyRent, deposit_amount: depositAmount, image: item.images?.[0]?.image_url || "/images/placeholder.png", duration })
    router.push("/checkout")
  }

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
    </div>
  )
  if (!item) return <div className="container py-10">Item not found</div>

  const specs = item.sub_attributes && typeof item.sub_attributes === 'object' && !Array.isArray(item.sub_attributes)
    ? Object.entries(item.sub_attributes as Record<string, string>).filter(([, v]) => v)
    : []

  return (
    <div className="container py-10">
      <LeaseGuru role="buyer" />
      <div className="grid lg:grid-cols-12 gap-8">
        {/* ─── LEFT COLUMN ───────────────────────────────────────────── */}
        <div className="lg:col-span-6 space-y-6">

          {/* Image */}
          <div className="aspect-square bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 flex items-center justify-center p-10 shadow-sm relative group">
            <Image
              src={item.images?.[0]?.image_url || '/images/placeholder.png'}
              alt={item.title}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-500 p-10"
            />
            {savingsPercent > 0 && (
              <Badge className="absolute top-6 left-6 bg-green-500 hover:bg-green-600 text-white border-none px-3 py-1 text-sm font-bold">
                Save {savingsPercent}%
              </Badge>
            )}
            <div className="absolute top-6 right-6 z-10">
              <WishlistButton itemId={id} size="md" />
            </div>
          </div>

          {/* Product Details */}
          <Card className="border-gray-100 dark:border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                {item.condition && (
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">
                    {CONDITION_LABEL[item.condition.toLowerCase()] || item.condition}
                  </Badge>
                )}
                {item.verified_status === 'verified' && (
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                    <CheckCircle className="h-3 w-3 mr-1" />Verified
                  </Badge>
                )}
                {categoryName && (
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none">
                    {categoryName}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-black text-gray-900 dark:text-white">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{item.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Retail Price: <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.retail_price || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  SKU: <span className="font-mono text-[10px]">{item.id.slice(0, 8)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications Stickers */}
          {specs.length > 0 && (
            <Card className="border-gray-100 dark:border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary-500" />
                  <CardTitle className="text-xs font-black uppercase tracking-widest">Specifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {specs.map(([key, val]) => (
                    <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400">{key}</span>
                      <span className="font-bold">{val}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact Availability Calendar */}
          <Card className="border-gray-100 dark:border-gray-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-500" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Availability</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <AvailabilityCalendar itemId={id} compact />
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="border-gray-100 dark:border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary-500" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Frequently Asked Questions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {FAQ_ITEMS.map((faq, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full py-3 text-left"
                  >
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <p className="text-sm text-gray-500 pb-3 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Why Lease */}
          <Card className="border-gray-100 dark:border-gray-800 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary-500" />
                Why Lease with Lease1?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {WHY_LEASE.map((w, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                      <w.icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 dark:text-white">{w.title}</p>
                      <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{w.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Renter Personality */}
          <RenterPersonalitySection />

        </div>

        {/* ─── RIGHT COLUMN ──────────────────────────────────────────── */}
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-24 space-y-6">

            {/* Pricing Card */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 space-y-6 shadow-xl shadow-gray-200/50 dark:shadow-none">
              <div className="space-y-4">
                {pricing && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl space-y-1.5 border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>vs Competitor</span>
                      <span className={vsCompetitor > 0 ? 'text-green-600' : 'text-gray-400'}>{formatCurrency(vsCompetitor)} saved</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>vs EMI (15% APR)</span>
                      <span className={vsEmi > 0 ? 'text-green-600' : 'text-gray-400'}>{formatCurrency(vsEmi)} saved</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Deposit Multiplier</span>
                      <span>{calcDepositMultiplier(item!.retail_price).toFixed(2)}x</span>
                    </div>
                  </div>
                )}

                <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl space-y-3 border border-primary-100 dark:border-primary-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-900 dark:text-primary-300">Monthly Rent</span>
                    <span className="text-xl font-black text-primary-600">{formatCurrency(monthlyRent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-900 dark:text-primary-300">Security Deposit</span>
                    <span className="text-xl font-black text-primary-600">{formatCurrency(depositAmount)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Tenure</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        onClick={() => setDuration(m)}
                        className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${
                          duration === m
                            ? "bg-gray-900 border-gray-900 text-white shadow-xl"
                            : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-900"
                        }`}
                      >
                        {m}mo
                        <div className="text-[8px] opacity-60">{getTenureBand(m).id}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Rent</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(monthlyRent)}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Security Deposit (Refundable)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(depositAmount)}</span>
                  </div>
                  {pricing && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Condition ({CONDITION_LABEL[(item?.condition || 'good').toLowerCase()] || item?.condition})</span>
                      <span className="font-bold text-gray-900 dark:text-white">{Math.round((CONDITION_RENT_FACTOR[(item?.condition || 'good').toLowerCase()] || 0.88) * 100)}% of base</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      One-time Service Fee
                      <Info className="h-3 w-3 cursor-help" />
                    </div>
                    <span className="font-bold text-green-600">FREE</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Initial Payment</div>
                    <div className="text-2xl font-black text-primary-600">{formatCurrency(totalFirstPayment)}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={startRental} className="w-full h-14 text-lg font-black shadow-lg shadow-primary-200 uppercase tracking-widest">
                  Rent Now
                </Button>
                <Button onClick={handleAddToCart} variant="outline" className="w-full h-12 font-bold border-2 border-primary-600 text-primary-600 hover:bg-primary-50">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Shield className="h-4 w-4 text-green-500" />
                  Secure Payment
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <Clock className="h-4 w-4 text-blue-500" />
                  72hr Delivery
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Theft Protected
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sold by</p>
              <div className="flex items-center justify-between">
                <SellerBadge
                  sellerId={item.seller_id}
                  sellerName={item.seller_name}
                  avatarUrl={item.seller_avatar}
                  avgRating={sellerStats?.avg_rating || 0}
                  reviewCount={sellerStats?.review_count || 0}
                  size="md"
                />
                {sellerStats && sellerStats.completed_rentals > 0 && (
                  <Badge variant="secondary" className="text-[9px] font-bold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                    {sellerStats.completed_rentals} rental{sellerStats.completed_rentals > 1 ? 's' : ''} completed
                  </Badge>
                )}
              </div>
              {/* Seller Personality */}
              {item.seller_personality && SELLER_PERSONALITY_INFO[item.seller_personality] && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
                  <PersonalityBadge
                    type={item.seller_personality}
                    info={{ id: item.seller_personality, ...SELLER_PERSONALITY_INFO[item.seller_personality] }}
                    size="sm"
                    showRibbon
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Seller Style</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{SELLER_PERSONALITY_INFO[item.seller_personality].name}</p>
                    <p className="text-[10px] text-gray-400 italic">"{SELLER_PERSONALITY_INFO[item.seller_personality].motto}"</p>
                    {item.personality_match != null && (
                      <div className={`inline-block mt-1 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        item.personality_match >= 3 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        item.personality_match >= 2 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {item.personality_match >= 3 ? '★ Perfect Match for You' :
                         item.personality_match >= 2 ? '→ Good Fit for You' :
                         item.personality_match >= 1 ? '· Fair Match' : '✕ Not Your Style'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Other Items from this Seller */}
            {relatedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">More from this Seller</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {relatedItems.map((rel) => (
                    <Link key={rel.id} href={`/items/${rel.id}`} className="group">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                        <div className="aspect-square relative bg-gray-50 dark:bg-gray-900/50">
                          <Image
                            src={rel.image_url || '/images/placeholder.png'}
                            alt={rel.title}
                            fill
                            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{rel.title}</p>
                          <p className="text-[10px] text-primary-600 font-black mt-1">{formatCurrency(Number(rel.monthly_rent))}/mo</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Reviews</h2>
                {reviews.length > 0 && (
                  <span className="text-gray-400 text-sm font-medium">({reviews.length})</span>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-10 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No reviews yet for this item</p>
                  <p className="text-gray-400 text-sm mt-1">Reviews appear after rental is completed</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{review.reviewer_name}</span>
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
      </div>
    </div>
  )
}

function RenterPersonalitySection() {
  const [renterInfo, setRenterInfo] = useState<{ id: string; name: string; motto: string; icon: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/personality/renter').then(res => {
      if (res.data?.personality && RENTER_PERSONALITY_INFO[res.data.personality]) {
        setRenterInfo({ id: res.data.personality, ...RENTER_PERSONALITY_INFO[res.data.personality] })
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return null

  return renterInfo ? (
    <Card className="border-gray-100 dark:border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <CardTitle className="text-xs font-black uppercase tracking-widest">Your Renter Style</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <PersonalityBadge type={renterInfo.id} info={renterInfo} size="sm" />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{renterInfo.name}</p>
          <p className="text-xs text-gray-400 italic">"{renterInfo.motto}"</p>
          <Link href="/profile/personality" className="text-[9px] font-bold text-primary-600 hover:underline mt-1 inline-block">
            Edit style
          </Link>
        </div>
      </CardContent>
    </Card>
  ) : (
    <Card className="border-gray-100 dark:border-gray-800 border-dashed">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gray-300" />
          <div>
            <p className="text-xs font-bold text-gray-500">Discover your renter style</p>
            <p className="text-[9px] text-gray-400">Get matched with the perfect sellers</p>
          </div>
        </div>
        <Link href="/profile/personality">
          <Button size="sm" variant="outline" className="rounded-xl text-[10px]">Take Quiz</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
