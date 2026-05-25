"use client";

import { useState, useEffect } from "react";
import Image from "next/image"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Search, Shield, TrendingUp, Users, Calendar, ArrowRight, Zap, Sparkles, ShoppingBag, CreditCard, Percent, Smartphone } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from "@/lib/utils";

const popularItemsMock = [
  { name: "Split AC 1.5 Ton", slug: "air-conditioners", img: "https://images.unsplash.com/photo-1604636559893-a748bfecfa0e?auto=format&fit=crop&q=80&w=800", price: "₹1200/mo", badge: "5-Star Inverter" },
  { name: "Smart TV 43\"", slug: "televisions", img: "https://images.unsplash.com/photo-1536494126589-29fadf0d7e3c?auto=format&fit=crop&q=80&w=800", price: "₹800/mo", badge: "4K UHD" },
  { name: "3-Seater Sofa", slug: "study-furniture", img: "https://images.unsplash.com/photo-1763565909003-46e9dfb68a00?auto=format&fit=crop&q=80&w=800", price: "₹600/mo", badge: "Solid Wood" },
  { name: "MacBook Pro M2", slug: "laptops-electronics", img: "https://images.unsplash.com/photo-1591900256859-f96fc8097a7e?auto=format&fit=crop&q=80&w=800", price: "₹2500/mo", badge: "Mint Condition" },
]

const categoryTiles = [
  { name: "Air Conditioners", slug: "air-conditioners", img: "https://images.unsplash.com/photo-1604636559893-a748bfecfa0e?auto=format&fit=crop&q=80&w=800" },
  { name: "Televisions", slug: "televisions", img: "https://images.unsplash.com/photo-1536494126589-29fadf0d7e3c?auto=format&fit=crop&q=80&w=800" },
  { name: "Laptops & Electronics", slug: "laptops-electronics", img: "https://images.unsplash.com/photo-1591900256859-f96fc8097a7e?auto=format&fit=crop&q=80&w=800" },
  { name: "Study & Furniture", slug: "study-furniture", img: "https://images.unsplash.com/photo-1763565909003-46e9dfb68a00?auto=format&fit=crop&q=80&w=800" },
  { name: "Clothing", slug: "clothing-accessories", img: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=800" },
]

const advertisements = [
  { title: "iPhone 15 Pro", desc: "Rent at ₹1999/mo", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-black" },
  { title: "Gaming Laptop", desc: "Next-gen Performance", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-blue-900" },
  { title: "Noise Cancel Headphones", desc: "Pure Sound", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-purple-900" },
]

export default function HomePage() {
  const [latestItems, setLatestItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/items?limit=4').then(res => {
      setLatestItems(res.data.items || []);
      setLoading(false);
    }).catch((err) => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 space-y-16">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-gray-900 to-black p-8 md:p-20 text-white shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <Badge className="bg-primary-600 text-white border-none mb-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  🚀 Campus Exclusive
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
                  Rent Smart, <br />
                  <span className="text-primary-500 italic">Live Premium</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-medium">
                  Skip the upfront cost. Rent high-quality ACs, Laptops, and Furniture from your peers with zero hassle.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/browse">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-primary-500 hover:text-white font-black h-16 px-10 rounded-2xl transition-all duration-300">
                      Explore Catalog
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Decorative background image */}
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none">
                <Image src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800" alt="Hero" fill className="object-contain translate-x-1/4 translate-y-1/4 scale-150" />
              </div>
            </section>

            {/* Category Grid - RentoMojo Style */}
            <section>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Shop by Category</h2>
                <div className="w-20 h-1.5 bg-primary-600 mx-auto rounded-full" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {categoryTiles.map((cat) => (
                  <Link key={cat.slug} href={`/browse?category=${cat.slug}`}>
                    <div className="group cursor-pointer flex flex-col items-center">
                      <div className="w-full aspect-square mb-4 relative overflow-hidden rounded-[32px] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-8 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary-100 dark:group-hover:shadow-none transform-gpu">
                        <Image
                          src={cat.img}
                          alt={cat.name}
                          width={200}
                          height={200}
                          className="object-contain transition-transform duration-300 ease-out group-hover:scale-110 transform-gpu"
                        />
                      </div>
                      <h3 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-widest text-center group-hover:text-primary-600 transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Items Section */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Most Popular</h2>
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Handpicked for students</p>
                </div>
                <Link href="/browse" className="text-primary-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 group">
                  View Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {popularItemsMock.map((item) => (
                  <Link key={item.name} href={`/browse?q=${item.name}`}>
                    <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl transform-gpu">
                      <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-10">
                        <Image
                          src={item.img}
                          alt={item.name}
                          width={250}
                          height={250}
                          className="object-contain transition-transform duration-300 ease-out group-hover:scale-110 transform-gpu"
                        />
                        <Badge className="absolute top-4 left-4 bg-white/90 dark:bg-black/50 text-gray-900 dark:text-white backdrop-blur-md border-none text-[10px] font-black uppercase tracking-tighter px-3 py-1">
                          {item.badge}
                        </Badge>
                      </div>
                      <div className="p-6">
                        <h3 className="text-gray-900 dark:text-white font-black text-lg mb-1 leading-tight group-hover:text-primary-600 transition-colors">{item.name}</h3>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-primary-600 font-black text-xl">{item.price}</p>
                          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Latest Listings */}
            <section>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-8 h-8 text-primary-600 fill-primary-600" />
                    Latest Listings
                  </h2>
                  <p className="text-gray-500 mt-1">Freshly added to the marketplace</p>
                </div>
                <Link href="/browse" className="text-primary-600 font-semibold flex items-center gap-1 hover:underline">
                  Browse All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {loading ? (
                  [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)
                ) : (
                  latestItems.map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <Card className="group hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-out border-none bg-white dark:bg-gray-800 overflow-hidden rounded-[32px] transform-gpu">
                        <CardContent className="p-0">
                          <div className="relative h-48 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 overflow-hidden">
                            <Image
                              src={item.image_url || "/images/placeholder.png"}
                              alt={item.title}
                              width={200}
                              height={150}
                              className="object-contain group-hover:scale-110 transition-transform duration-300 ease-out transform-gpu"
                            />
                            <Badge className="absolute top-4 right-4 bg-white/90 text-primary-600 hover:bg-white backdrop-blur-sm border-none shadow-sm">
                              New
                            </Badge>
                          </div>
                          <div className="p-5">
                            <h3 className="font-black text-gray-900 dark:text-white mb-1 line-clamp-1 uppercase text-sm tracking-tight">{item.title}</h3>
                            <p className="text-primary-600 font-black text-lg">
                              {formatCurrency(item.monthly_rent)}/mo
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
                {!loading && latestItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    No listings found yet.
                  </div>
                )}
              </div>
            </section>

            {/* Lease Credit (Slice-style) */}
            <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-indigo-600 to-purple-700 p-8 md:p-16 text-white shadow-2xl">
              <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    New: Lease Credit
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                    Don't have the cash? <br />
                    <span className="text-yellow-300 italic">Slice it into 3.</span>
                  </h2>
                  <p className="text-lg text-indigo-100 font-medium max-w-md">
                    The simplest way to pay for your rentals. 0% interest, 3 easy payments, no hidden fees. Just like your favorite card, but for campus rentals.
                  </p>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Percent className="w-5 h-5 text-yellow-300" />
                      </div>
                      <span className="text-sm font-bold">0% Interest</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-yellow-300" />
                      </div>
                      <span className="text-sm font-bold">Instant Approval</span>
                    </div>
                  </div>
                  <Button className="h-14 px-10 bg-white text-indigo-600 hover:bg-yellow-300 hover:text-indigo-700 font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs">
                    Get Your Credit Limit <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative hidden md:block">
                  <div className="absolute -inset-10 bg-white/20 blur-3xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-gray-900 to-black p-8 rounded-[32px] border border-white/10 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-700">
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <Badge className="bg-yellow-300 text-indigo-900 border-none font-black uppercase text-[10px]">Active</Badge>
                    </div>
                    <div className="space-y-1 mb-8">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Credit Limit</p>
                      <p className="text-4xl font-black tracking-tighter">₹25,000</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Lease Holder</p>
                        <p className="text-xs font-bold uppercase">Rahul Sharma</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Valid Thru</p>
                        <p className="text-xs font-bold">05/28</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Why Choose Lease? */}
            <section className="py-12 border-y border-gray-100 dark:border-gray-800">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Why Choose Lease?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Built by students, for students. We understand your needs and budget constraints.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <CardTitle className="text-lg">Secure Transactions</CardTitle>
                    <CardDescription className="text-sm">
                      All payments protected with Razorpay escrow. Your money is safe.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-success-600 dark:text-success-400" />
                    </div>
                    <CardTitle className="text-lg">Student-Only</CardTitle>
                    <CardDescription className="text-sm">
                      Verified student IDs ensure you're dealing with genuine peers.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                    </div>
                    <CardTitle className="text-lg">Earn Extra Income</CardTitle>
                    <CardDescription className="text-sm">
                      Monetize your unused items within your campus.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                    </div>
                    <CardTitle className="text-lg">Flexible Durations</CardTitle>
                    <CardDescription className="text-sm">
                      Rent for exactly how long you need - from 1 to 24 months.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

          </div>

          {/* Sidebar Advertisements */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="p-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Sponsored Gadgets
                </h3>
                
                <div className="space-y-4">
                  {advertisements.map((ad, i) => (
                    <div key={i} className={`relative overflow-hidden rounded-2xl ${ad.color} p-6 text-white group cursor-pointer`}>
                      <div className="relative z-10">
                        <Badge className="bg-white/20 text-white border-none mb-2 backdrop-blur-sm text-[10px]">AD</Badge>
                        <h4 className="font-bold text-lg mb-1">{ad.title}</h4>
                        <p className="text-sm opacity-80 mb-4">{ad.desc}</p>
                        <Button size="sm" variant="secondary" className="bg-white text-black hover:bg-gray-100 font-bold rounded-full">
                          Rent Now
                        </Button>
                      </div>
                      <Image
                        src={ad.img}
                        alt={ad.title}
                        width={150}
                        height={150}
                        className="absolute -right-4 -bottom-4 w-32 h-32 object-contain opacity-40 group-hover:scale-125 group-hover:opacity-60 transition-all duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Card */}
              <div className="bg-yellow-400 rounded-2xl p-6 text-yellow-900 shadow-lg shadow-yellow-100">
                <h4 className="font-black text-xl mb-2">Refer a Friend!</h4>
                <p className="text-sm font-medium mb-4">Get ₹100 credit for every successful referral.</p>
                <Button className="w-full bg-yellow-900 text-yellow-400 hover:bg-yellow-800 font-bold rounded-xl">
                  Invite Now
                </Button>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* CTA Section */}
      <section className="bg-primary-600 dark:bg-primary-700 py-20 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the Lease Community?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Thousands of students in Kanpur are already renting smarter. Join them today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?type=renter">
              <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100 font-bold h-14 px-10">
                Start Renting
              </Button>
            </Link>
            <Link href="/signup?type=seller">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 font-bold h-14 px-10">
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Lease</span>
              </div>
              <p className="text-sm">
                India's trusted student rental marketplace. Starting in Kanpur, expanding nationwide.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/browse" className="hover:text-white transition-colors">Browse Items</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: support@lease.in</li>    
                <li>Phone: +91 XXXXXXXXXX</li>
                <li>Kanpur, Uttar Pradesh</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm font-medium">
              © 2024 Lease. All rights reserved. Built with ❤️ for Indian students.   
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
