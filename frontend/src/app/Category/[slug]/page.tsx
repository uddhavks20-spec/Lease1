"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const FALLBACK_IMG = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text fill="#9ca3af" font-family="Arial" font-size="14" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>')

export default function CategoryPage() {
  const { slug } = useParams()
  const [items, setItems] = useState<any[]>([])
  const [category, setCategory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const s = (slug as string).toLowerCase()
    api.get('/categories').then(async (catRes) => {
      const cats = catRes.data.categories || []
      const cat = cats.find((c: any) => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === s)
      if (cat) {
        setCategory(cat)
        const itemRes = await api.get('/items', { params: { categoryId: cat.id, limit: 50 } })
        setItems(itemRes.data.items || [])
      } else {
        const itemRes = await api.get('/items', { params: { q: s, limit: 50 } })
        setItems(itemRes.data.items || [])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  return (
    <div className="container py-10 max-w-6xl space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {category?.name || (slug as string)?.replace(/-/g, ' ')} Rentals
          </h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <p className="text-xl font-black text-gray-500 uppercase tracking-tight">No items found</p>
          <p className="text-sm text-gray-400">No listings available in this category yet.</p>
          <Link href="/browse"><Button className="rounded-xl font-black">Browse All Items</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="group bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="aspect-square relative bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-8">
                  <Image
                    src={item.image_url?.startsWith('http') ? item.image_url : FALLBACK_IMG}
                    alt={item.title}
                    width={200}
                    height={200}
                    className="object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-900 dark:text-white mb-1 line-clamp-1 uppercase text-sm">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-black text-lg">{formatCurrency(item.monthly_rent)}/mo</span>
                    <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-none text-[9px] font-black">
                      ₹{formatCurrency(item.deposit_amount)} deposit
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
