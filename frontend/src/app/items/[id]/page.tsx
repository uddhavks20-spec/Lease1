"use client"

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useCart } from '@/lib/cart-context'
import { LeaseGuru } from '@/components/LeaseGuru'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, Clock, MapPin, Info, ArrowRight, ShoppingCart, AlertTriangle } from 'lucide-react';

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
  seller?: {
    firstName: string
    lastName: string
  }
  verified_status?: string
}

// ─── v3 Pricing Engine Constants ─────────────────────────────────
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

function computePricing(mrv: number, condition: string, categoryName: string, months: number) {
  const COMPETITOR_RATES: Record<string, number> = {
    'Electronics & Entertainment': 0.060, Electronics: 0.060,
    'Appliances & Cooling': 0.055, Appliance: 0.055,
    'Study & Furniture': 0.040, Furniture: 0.040,
    'Clothing & Accessories': 0.075, Lifestyle: 0.075,
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
  const leaseRent = Math.round(baselineNew * condRentFactor)
  const deposit = Math.round(leaseRent * depositMultiplier)

  return { leaseRent, deposit, compMonthly, emiMonthly, band: band.id, baselineNew }
}

// ─── Category name cache ─────────────────────────────────────────
let categoryCache: Record<string, string> | null = null

async function getCategoryName(id: string): Promise<string> {
  if (!categoryCache) {
    const res = await api.get('/categories')
    const cats = res.data.categories || []
    categoryCache = Object.fromEntries(cats.map((c: any) => [c.id, c.name]))
  }
  return categoryCache[id] || 'Electronics'
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

  useEffect(() => {
    let cancelled = false
    api.get(`/items/${id}`).then((res) => {
      if (cancelled) return
      const itemData = res.data.item;
      if (res.data.images && res.data.images.length > 0) {
        itemData.images = res.data.images;
      }
      setItem(itemData);
      if (itemData.category_id) {
        getCategoryName(itemData.category_id).then((name) => {
          if (!cancelled) setCategoryName(name)
        })
      }
    }).finally(() => { if (!cancelled) setLoading(false) })
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
    if (!item) return;
    addToCart({
      id: item.id,
      title: item.title,
      monthly_rent: monthlyRent,
      deposit_amount: depositAmount,
      image: item.images?.[0]?.image_url || '/images/placeholder.png',
      duration: duration
    });
    toast.success('Added to cart');
  };

  const startRental = () => {
    if (!item) return;
    addToCart({
      id: item.id,
      title: item.title,
      monthly_rent: monthlyRent,
      deposit_amount: depositAmount,
      image: item.images?.[0]?.image_url || "/images/placeholder.png",
      duration: duration
    });
    router.push("/checkout");
  };

  const conditionLabel: Record<string, string> = {
    'new': 'New', 'mint': 'Mint', 'excellent': 'Mint',
    'good': 'Good', 'fair': 'Fair', 'poor': 'Poor',
  }

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
  if (!item) return <div className="container py-10">Item not found</div>

  return (
    <div className="container py-10">
      <LeaseGuru role="buyer" />
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left: Images */}
        <div className="lg:col-span-7 space-y-4">
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
          </div>
          
          {/* Rent vs Buy Analysis */}
          <Card className="border-none bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/20 dark:to-secondary-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-primary-600" />
                Rent vs. Buy Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Retail Price</span>
                  <span className="font-semibold line-through text-gray-400">{formatCurrency(item.retail_price)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Rent ({duration} mo)</span>
                  <span className="font-semibold text-primary-600">{formatCurrency(totalRentalCost)}</span>
                </div>
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">You Save</span>
                  <span className="text-xl font-black text-green-600">{formatCurrency(savings)}</span>
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Renting this item for {duration} months saves you <span className="font-bold text-green-600">{savingsPercent}%</span> of the retail cost. Plus, you don't have to worry about maintenance or resale!
                </p>
                <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider">
                  Smart Student Choice <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Info & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <Badge className={`mb-2 ${item.verified_status === 'verified' ? 'bg-green-500 hover:bg-green-600 text-white border-none' : item.verified_status === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-none'}`}>
              {item.verified_status === 'verified' ? '✓ Product Verified' : item.verified_status === 'pending' ? '⏳ Verification Pending' : '○ Unverified'}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>IIT Kanpur Campus</span>
              </div>
              {item.sub_attributes && Object.entries(item.sub_attributes).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-gray-600 dark:text-gray-400">
                  <span className="text-gray-400">{key}:</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {item.description}
          </p>

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
                    <span className="text-gray-500">Condition ({conditionLabel[(item?.condition || 'good').toLowerCase()] || item?.condition})</span>
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
        </div>
      </div>
    </div>
  )
}
