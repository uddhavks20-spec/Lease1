"use client";

import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Info, CheckCircle2, CreditCard, Truck, RefreshCw, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const { cart, removeFromCart, totalMonthlyRent, totalDeposit } = useCart();
  
  // Platform fee (guest side) is already included in totalMonthlyRent via the 5% markup
  const totalPayableNow = totalMonthlyRent + totalDeposit;

  if (cart.length === 0) {
    return (
      <div className="container py-32 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="h-10 w-10 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Your cart is empty</h1>
          <p className="text-gray-500 max-w-xs mx-auto">Looks like you haven't added any rentals to your cart yet.</p>
        </div>
        <Link href="/browse">
          <Button className="h-12 px-8 font-bold rounded-xl shadow-lg shadow-primary-200">
            Start Browsing
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Your Cart</h1>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <span className="text-primary-600">Cart</span>
          <ArrowRight className="h-4 w-4" />
          <span>Delivery & Address</span>
          <ArrowRight className="h-4 w-4" />
          <span>Payment</span>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Cart Items */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="border-none bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-3xl group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                    <div className="relative w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center p-4">
                      <Image 
                        src={item.image} 
                        alt={item.title}
                        fill
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white">{item.title}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs font-bold px-2 py-1 bg-primary-50 text-primary-600 rounded-md">{item.duration}m Tenure</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rent / mo</p>
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.monthly_rent)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refundable Deposit</p>
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.deposit_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Coupon Section */}
          <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Have a Coupon/Referral?</h4>
                  <p className="text-sm text-gray-500">Apply it to get extra discounts</p>
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto font-bold border-primary-600 text-primary-600 rounded-xl">
                Apply Coupon
              </Button>
            </div>
          </Card>

          {/* What Happens Next Section */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-primary-600" />
              What Happens Next?
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: CreditCard, title: "Pay Initial Amount", desc: "Pay deposit and first month's rent to confirm your order." },
                { icon: ShieldCheck, title: "KYC Verification", desc: "Quickly verify your student ID and document details." },
                { icon: Truck, title: "Scheduled Delivery", desc: "Our team will deliver and install the items at your campus." }
              ].map((step, i) => (
                <div key={i} className="space-y-3 p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-primary-600">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">{step.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-4">
          <Card className="border-none bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[40px] overflow-hidden sticky top-24">
            <div className="p-10 space-y-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Payment Details</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Order Summary</p>
              </div>
              
              <div className="space-y-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Total Monthly Rent</span>
                  <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalMonthlyRent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold">Security Deposit (Refundable)</span>
                  <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalDeposit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-500 font-bold">
                    Platform Service Fee
                    <Info className="h-3 w-3 cursor-help" />
                  </div>
                  <span className="font-black text-green-600 uppercase">Included</span>
                </div>
                
                <div className="pt-8 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Payable Now</div>
                    <div className="text-4xl font-black text-primary-600">{formatCurrency(totalPayableNow)}</div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold">GST inclusive where applicable</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <Link href="/checkout">
                  <Button className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Confirm Order <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Safe & Secure Checkout
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
