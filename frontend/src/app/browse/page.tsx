"use client";
import * as React from "react"
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal, ArrowUpDown, ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import api from '@/lib/api'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SellerBadge } from '@/components/SellerBadge';
import { WishlistButton } from '@/components/WishlistButton';
import { ReviewStars } from '@/components/ReviewStars';
import { PersonalityRibbon, PERSONALITY_COLORS } from '@/components/PersonalityBadge';

const FALLBACK_IMG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text fill="#9ca3af" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>')

const CONDITIONS = ['New', 'Mint', 'Good', 'Fair', 'Poor']

type Item = {
  id: string
  title: string
  description: string
  monthly_rent: number
  deposit_amount: number
  status: string
  category_id: string
  image_url?: string
  retail_price?: number
  seller_id: string
  seller_name: string
  seller_avatar?: string
  condition: string
  is_featured?: boolean
  seller_avg_rating?: number
  seller_review_count?: number
  seller_personality?: string
  personality_match?: number
}

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState([] as Item[]);
  const [cities, setCities] = useState([] as { id: string; name: string }[]);
  const [categories, setCategories] = useState([] as Array<{ id: string; name: string; slug: string; items?: string[] }>);
  const [renterType, setRenterType] = useState<string | null>(null);
  
  const q = searchParams?.get('q') || '';
  const cityId = searchParams?.get('city') || '';
  const categorySlug = searchParams?.get('category') || '';

  const [filters, setFilters] = useState({ 
    q, 
    cityId, 
    categoryId: '',
    subCategory: '',
    sortBy: 'newest',
    minRent: '',
    maxRent: '',
    condition: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  const activeCategory = categories.find(c => c.id === filters.categoryId);
  const subCategories = activeCategory?.items || [];

  const selectedConditions = filters.condition ? filters.condition.split(',') : [];

  const toggleCondition = (cond: string) => {
    const current = new Set(selectedConditions)
    if (current.has(cond)) current.delete(cond)
    else current.add(cond)
    setFilters({ ...filters, condition: Array.from(current).join(',') })
  }

  useEffect(() => {
    api.get('/cities').then((r) => setCities(r.data.cities || []))
    api.get('/categories').then((r) => {
      const cats = r.data.categories || [];
      setCategories(cats);
      if (categorySlug) {
        const cat = cats.find((c: any) => c.slug === categorySlug);
        if (cat) setFilters(f => ({ ...f, categoryId: cat.id }));
      }
    })
    // Fetch renter personality for match scoring
    api.get('/personality/renter').then(r => {
      if (r.data?.personality) setRenterType(r.data.personality)
    }).catch(() => {})
  }, [categorySlug])

  useEffect(() => {
    setFilters(f => ({ ...f, q, cityId }));
  }, [q, cityId])

  const load = () => {
    api
      .get('/items', { params: { ...filters, renterType: renterType || undefined } })
      .then((res) => setItems(res.data.items))
      .catch(() => setItems([]))
  }

  useEffect(() => {
    load()
  }, [filters])

  return (
    <div className="container py-10">
      <div className="flex flex-col mb-8 gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Browse Items</h1>
            <p className="text-gray-500 font-medium">Find the best rentals in your campus community</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <select
                className="appearance-none bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-xl pl-10 pr-10 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 focus:border-primary-500 outline-none transition-all cursor-pointer shadow-sm"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
              </select>
              <ArrowUpDown className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                showFilters 
                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-500'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {selectedConditions.length > 0 && (
                <span className="bg-primary-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ml-1">
                  {selectedConditions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex flex-wrap gap-2 pb-2">
          <button
            onClick={() => setFilters({ ...filters, categoryId: '', subCategory: '' })}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              filters.categoryId === ''
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilters({ ...filters, categoryId: cat.id, subCategory: '' })}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                filters.categoryId === cat.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sub-categories row */}
        {subCategories.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide border-b border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-black text-gray-400 whitespace-nowrap uppercase tracking-[0.2em]">Refine:</span>
            {subCategories.map((sub: string) => (
              <button
                key={sub}
                onClick={() => setFilters({ ...filters, subCategory: filters.subCategory === sub ? '' : sub })}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filters.subCategory === sub
                    ? 'bg-secondary-100 text-secondary-700 border-secondary-200 shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-100'
                } border`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="border-none bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Range (Monthly)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500"
                    value={filters.minRent}
                    onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                  />
                  <span className="text-gray-300">—</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500"
                    value={filters.maxRent}
                    onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => toggleCondition(cond)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedConditions.includes(cond)
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">City</label>
                <select 
                  className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 appearance-none"
                  value={filters.cityId}
                  onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
                >
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-end md:col-span-3">
                <Button 
                  variant="ghost" 
                  className="text-gray-500 font-bold hover:text-primary-600"
                  onClick={() => setFilters({ ...filters, minRent: '', maxRent: '', cityId: '', categoryId: '', subCategory: '', sortBy: 'newest', condition: '' })}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
        {items.map((it: Item) => (
          <Link key={it.id} href={`/items/${it.id}`} className="group">
            <Card className="border-none bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 ease-out group-hover:-translate-y-2 transform-gpu">
              <div className="relative aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-10 overflow-hidden">
                {it.seller_personality && (
                  <PersonalityRibbon
                    type={it.seller_personality}
                    info={{
                      id: it.seller_personality,
                      name: '',
                      motto: '',
                      icon: PERSONALITY_COLORS[it.seller_personality] ? '' : '🏷️',
                    }}
                    matchScore={it.personality_match}
                  />
                )}
                <Image 
                  src={it.image_url?.startsWith('http') ? it.image_url : FALLBACK_IMG} 
                  alt={it.title}
                  fill
                  className="object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-110 transform-gpu"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 dark:bg-black/50 text-gray-900 dark:text-white backdrop-blur-md border-none shadow-sm text-[10px] font-black uppercase tracking-tighter px-3 py-1">
                    {formatCurrency(it.deposit_amount)} Deposit
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <WishlistButton itemId={it.id} size="sm" />
                </div>
                {it.is_featured && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary-600/90 text-white backdrop-blur-md border-none shadow-lg text-[9px] font-black uppercase tracking-widest px-3 py-1">
                      Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-4 right-4">
                  <Badge className={`backdrop-blur-md border-none text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 ${
                    it.condition === 'New' || it.condition === 'Mint'
                      ? 'bg-green-500/90 text-white'
                      : it.condition === 'Good'
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    {it.condition}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                  {it.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <SellerBadge
                    sellerId={it.seller_id}
                    sellerName={it.seller_name}
                    avatarUrl={it.seller_avatar}
                    size="sm"
                  />
                  {it.seller_avg_rating != null && it.seller_avg_rating > 0 && (
                    <ReviewStars rating={it.seller_avg_rating} size="sm" count={it.seller_review_count} />
                  )}
                </div>
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Monthly Rent</p>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {formatCurrency(Math.round(it.monthly_rent * 1.05))}
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-gray-900 dark:bg-primary-600 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {!items.length && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Search className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No items found</h3>
          <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
        </div>
      )}
    </div>
  )
}
