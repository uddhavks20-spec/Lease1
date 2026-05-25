"use client"

import Image from 'next/image' // Import Image
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { useCart } from '@/lib/cart-context'
import { LeaseBot } from '@/components/LeaseBot'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, Clock, MapPin, Info, ArrowRight, ShoppingCart } from 'lucide-react';

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
  sub_attributes?: Record<string, string>
  images?: Array<{ image_url: string }>
  seller?: {
    firstName: string
    lastName: string
  }
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart } = useCart()
  const id = params?.id as string
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(12)

  useEffect(() => {
    api
      .get(`/items/${id}`)
      .then((res) => {
        const itemData = res.data.item;
        // Map images from the separate images array returned by the API
        if (res.data.images && res.data.images.length > 0) {
          itemData.images = res.data.images;
        }
        setItem(itemData);
      })
      .finally(() => setLoading(false))
  }, [id])

  const getTenureMultiplier = (months: number) => {
    if (months <= 3) return 1.50; // Ultra Short-Term
    if (months <= 11) return 1.15; // Mid-Term
    if (months <= 18) return 1.00; // Long-Term (12-Month Anchor)
    return 0.80; // Multi-Year
  };

  const baseRent = item ? Number(item.monthly_rent) : 0;
  const tenureMultiplier = getTenureMultiplier(duration);
  const finalMonthlyRent = Math.round(baseRent * tenureMultiplier);
  
  const renterMonthlyRent = Math.round(finalMonthlyRent * 1.05); // 5% Guest Fee
  const dynamicDeposit = finalMonthlyRent; // 1:1 Security Deposit (v3.1)
  
  const totalFirstPayment = renterMonthlyRent + dynamicDeposit;
  const totalRentalCost = renterMonthlyRent * duration;
  const savings = item && item.retail_price > 0 ? Number(item.retail_price) - totalRentalCost : 0;
  const savingsPercent = item && item.retail_price > 0 ? Math.round((savings / Number(item.retail_price)) * 100) : 0;

  const handleAddToCart = () => {
    if (!item) return;
    addToCart({
      id: item.id,
      title: item.title,
      monthly_rent: renterMonthlyRent,
      deposit_amount: dynamicDeposit,
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
      monthly_rent: renterMonthlyRent,
      deposit_amount: dynamicDeposit,
      image: item.images?.[0]?.image_url || "/images/placeholder.png",
      duration: duration
    });
    router.push("/checkout");
  };

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
  if (!item) return <div className="container py-10">Item not found</div>

  return (
    <div className="container py-10">
      <LeaseBot role="buyer" />
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
            <Badge className="mb-2" variant="secondary">Verified Student Listing</Badge>
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
              {/* Dynamic Breakdown */}
              <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl space-y-3 border border-primary-100 dark:border-primary-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-900 dark:text-primary-300">Monthly Rent</span>
                  <span className="text-xl font-black text-primary-600">{formatCurrency(renterMonthlyRent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-900 dark:text-primary-300">Security Deposit</span>
                  <span className="text-xl font-black text-primary-600">{formatCurrency(dynamicDeposit)}</span>
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
                      <div className="text-[8px] opacity-60">
                        {getTenureMultiplier(m) === 1.5 ? '1.5x' : 
                         getTenureMultiplier(m) === 1.15 ? '1.15x' : 
                         getTenureMultiplier(m) === 1.0 ? 'Base' : '0.8x'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly Rent</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(renterMonthlyRent)}/mo</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Security Deposit (Refundable)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(dynamicDeposit)}</span>
                </div>
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

            <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <Shield className="h-4 w-4 text-green-500" />
                Secure Payment
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <Clock className="h-4 w-4 text-blue-500" />
                72hr Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
