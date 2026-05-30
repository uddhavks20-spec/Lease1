"use client";

import { useState, useEffect } from "react";
import Image from "next/image"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Search, Shield, TrendingUp, Users, Calendar, ArrowRight, Zap, Sparkles, ShoppingBag, CreditCard, Percent, Smartphone, MapPin } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from "@/lib/utils";
import { useAuth } from '@/lib/auth-context'
import { WishlistButton } from '@/components/WishlistButton'

const FALLBACK_IMG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text fill="#9ca3af" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>')

const advertisement = [
  { title: "iPhone 15 Pro", desc: "Rent at ₹1999/mo", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-black" },
  { title: "Gaming Laptop", desc: "Next-gen Performance", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-blue-900" },
  { title: "Noise Cancel Headphones", desc: "Pure Sound", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-purple-900" },
]

const advertisements = [
  { title: "iPhone 15 Pro", desc: "Rent at ₹1999/mo", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-black" },
  { title: "Gaming Laptop", desc: "Next-gen Performance", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-blue-900" },
  { title: "Noise Cancel Headphones", desc: "Pure Sound", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&bg=fff", color: "bg-purple-900" },
]

export default function HomePage() {
  const [latestItems, setLatestItems] = useState<any[]>([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [creditData, setCreditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [nearbyItems, setNearbyItems] = useState<any[]>([]);
  const { user } = useAuth();

  const referralCode = user?.id
    ? user.id.slice(0, 8).toUpperCase()
    : 'GUEST' + Math.random().toString(36).slice(2, 8).toUpperCase();

  const copyReferralLink = () => {
    const link = window.location.origin + '/signup?ref=' + referralCode;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const imgSrc = (url: string | null | undefined) => url && url.startsWith('http') ? url : FALLBACK_IMG

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/credit/me').then(r => setCreditData(r.data)).catch(() => {});
    }
    Promise.all([
      api.get('/items?limit=10'),
      api.get('/items?limit=8&sortBy=popular'),
      api.get('/categories'),
    ]).then(([itemsRes, popularRes, catRes]) => {
      const allItems = itemsRes.data.items || [];
      setLatestItems(allItems);
      setPopularItems(popularRes.data.items || []);
      setCategories(catRes.data.categories || []);

      // Filter nearby items based on detected city
      const detected = localStorage.getItem('detectedCity')
      if (detected) {
        setNearbyItems(allItems.filter((i: any) => String(i.city_id) === detected).slice(0, 4))
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 space-y-16">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-gray-900 to-black p-6 md:p-20 text-white shadow-2xl">
              <div className="relative z-10 max-w-2xl">
                <Badge className="bg-primary-600 text-white border-none mb-6 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block">
                  🚀 Campus Exclusive
                </Badge>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tighter">
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {categories.map((cat) => {
                  const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  return (
                    <Link key={cat.id} href={`/browse?category=${slug}`}>
                      <div className="group cursor-pointer flex flex-col items-center">
                        <div className="w-full aspect-square mb-4 relative overflow-hidden rounded-[32px] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-8 transition-all duration-300 ease-out group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary-100 dark:group-hover:shadow-none transform-gpu">
                          <span className="text-5xl opacity-30 group-hover:opacity-50 transition-opacity">{cat.icon || '📦'}</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-widest text-center line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {cat.name}
                        </h3>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Near You Section */}
            <section>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    Available in Your City
                  </h2>
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Items near you, ready to rent</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {nearbyItems.length > 0 ? nearbyItems.map((item: any) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl transform-gpu">
                      <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-10">
                        <Image
                          src={imgSrc(item.image_url)}
                          alt={item.title}
                          width={250}
                          height={250}
                          className="object-contain transition-transform duration-300 ease-out group-hover:scale-110 transform-gpu"
                        />
                        <Badge className="absolute top-4 left-4 bg-primary-600/90 text-white backdrop-blur-md border-none text-[10px] font-black uppercase px-3 py-1">
                          Near You
                        </Badge>
                      </div>
                      <div className="p-6">
                        <h3 className="text-gray-900 dark:text-white font-black text-lg mb-1 leading-tight group-hover:text-primary-600 transition-colors">{item.title}</h3>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-primary-600 font-black text-xl">{formatCurrency(item.monthly_rent)}/mo</p>
                          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="col-span-full text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-[32px]">
                    <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Select your city to see items available near you</p>
                  </div>
                )}
              </div>
            </section>

            {/* Popular Items Section */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Most Popular</h2>
                  <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">Rent a new personality. Cuz we both know this one's not helping. 😪💔</p>
                </div>
                <Link href="/browse" className="text-primary-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 group">
                  View Catalog <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {popularItems.length > 0 ? popularItems.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`}>
                    <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl transform-gpu">
                      <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-10">
                        <Image
                          src={imgSrc(item.image_url)}
                          alt={item.title}
                          width={250}
                          height={250}
                          className="object-contain transition-transform duration-300 ease-out group-hover:scale-110 transform-gpu"
                        />
                        <Badge className="absolute top-4 left-4 bg-white/90 dark:bg-black/50 text-gray-900 dark:text-white backdrop-blur-md border-none text-[10px] font-black uppercase tracking-tighter px-3 py-1">
                          Popular
                        </Badge>
                        <div className="absolute top-4 right-4 z-10">
                          <WishlistButton itemId={item.id} size="sm" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-gray-900 dark:text-white font-black text-lg mb-1 leading-tight group-hover:text-primary-600 transition-colors">{item.title}</h3>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-primary-600 font-black text-xl">{formatCurrency(item.monthly_rent)}/mo</p>
                          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : [1,2,3,4].map(i => <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[32px]" />)}
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
                  <p className="text-gray-500 mt-1">Brand new gear. Maybe this one will actually fix your life (it won't). 🤧💔</p>
                </div>
                <Link href="/browse" className="text-primary-600 font-semibold flex items-center gap-1 hover:underline">
                  Browse All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)
                ) : (
                  latestItems.map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`}>
                      <Card className="group hover:scale-105 hover:shadow-2xl transition-all duration-300 ease-out border-none bg-white dark:bg-gray-800 overflow-hidden rounded-[32px] transform-gpu">
                        <CardContent className="p-0">
                          <div className="relative h-48 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 overflow-hidden">
                            <Image
                              src={imgSrc(item.image_url)}
                              alt={item.title}
                              width={200}
                              height={150}
                              className="object-contain group-hover:scale-110 transition-transform duration-300 ease-out transform-gpu"
                            />
                            <div className="absolute top-4 right-4 z-10">
                              <WishlistButton itemId={item.id} size="sm" />
                            </div>
                            <Badge className="absolute top-4 left-4 bg-white/90 text-primary-600 hover:bg-white backdrop-blur-sm border-none shadow-sm">
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

            {/* Lease Money - Coming Soon */}
<section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-gray-800 to-gray-900 p-8 md:p-16 text-white shadow-2xl opacity-80">
  <div className="relative z-10 text-center">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-6">
      <Zap className="w-3 h-3" />
      Coming Soon
    </div>
    <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-4">
      Lease <span className="text-yellow-400">Money</span>
    </h2>
    <p className="text-lg text-gray-400 font-medium max-w-lg mx-auto">
      Your campus credit line is cooking. Zero interest. Instant approval. Launching soon.
    </p>
    <div className="flex justify-center gap-2 mt-8">
      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0s" }} />
      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
      <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
    </div>
  </div>
</section>{/* Why Choose Lease? */}
            <section className="py-12 border-y border-gray-100 dark:border-gray-800">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Why Choose Lease?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Built by students, for students. We understand your needs and budget constraints.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🪞</span>
                    </div>
                    <CardTitle className="text-lg">The Flex Culture</CardTitle>
                    <CardDescription className="text-sm">
                      So you can take mirror selfies with premium gear, and return it before anyone realizes you're actually broke. 
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💸</span>
                    </div>
                    <CardTitle className="text-lg">The Financial Delusion</CardTitle>
                    <CardDescription className="text-sm">
                      Buying things fully is for adults with actual responsibilities. Renting lets us spend on expensive iced coffee instead. 
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔄</span>
                    </div>
                    <CardTitle className="text-lg">Identity Crisis</CardTitle>
                    <CardDescription className="text-sm">
                      We change our entire personality every two weeks anyway. Your gear should also change with your current delusion. 
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔒</span>
                    </div>
                    <CardTitle className="text-lg">Trust Issues? Same.</CardTitle>
                    <CardDescription className="text-sm">
                      We use Razorpay escrow. Your money stays locked up safely until you actually get your stuff.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🤧</span>
                    </div>
                    <CardTitle className="text-lg">Commitment Issues Friendly</CardTitle>
                    <CardDescription className="text-sm">
                      Rent gear anywhere from 1 to 24 months. Because committing feels way too much like a long-term relationship, and we know you're not ready for that.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="text-center border-none bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎒</span>
                    </div>
                    <CardTitle className="text-lg">The Closet Hoarder</CardTitle>
                    <CardDescription className="text-sm">
                      Your room is already overflowing with unwashed hoodies and random hyperfixation junk. Let us handle that clutter. 🎒📦
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

          </div>

          {/* Sidebar Advertisements */}
          <aside className="w-full lg:w-96 space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Featured Gadgets
                </h3>
                <p className="text-xs text-gray-400 mb-4 ml-8">Staring at it won't put it in your cart, pick a vibe or step aside. 🛑</p>
                
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
                <Button onClick={copyReferralLink} className="w-full bg-yellow-900 text-yellow-400 hover:bg-yellow-800 font-bold rounded-xl">
                  {copied ? "Copied!" : "Invite Now"}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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
