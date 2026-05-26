"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Info, Phone, Mail } from 'lucide-react'

export default function NewWholesaleProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    brand: '',
    categoryId: '',
    quantityAvailable: 10,
    minOrderQuantity: 1,
    pricePerUnit: 0,
    suggestedRetailPrice: 0,
    deliveryTimeline: '',
    images: [] as string[]
  })

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.pricePerUnit || !form.quantityAvailable) {
      toast.error('Title, price per unit, and quantity are required')
      return
    }
    if (form.quantityAvailable < 1) {
      toast.error('Quantity must be at least 1')
      return
    }
    try {
      const res = await api.post('/wholesaler/products', form)
      toast.success('Product listed successfully!')
      router.push('/wholesaler/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create product')
    }
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">List Wholesale Product</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Supply to the Lease B2B2C network</p>
        </div>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Product Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Product Title *</label>
                  <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" placeholder="e.g. Apple MacBook Pro M2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Brand</label>
                  <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" placeholder="e.g. Apple" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Category</label>
                  <select className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 appearance-none cursor-pointer" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Description</label>
                <textarea className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 resize-none min-h-[100px]" placeholder="Describe the product, its condition, and what's included..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Delivery Timeline</label>
                <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3.5 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" placeholder="e.g. 5-7 business days after order" value={form.deliveryTimeline} onChange={e => setForm({...form, deliveryTimeline: e.target.value})} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-2xl shadow-gray-200/50 bg-white dark:bg-gray-800 rounded-[40px] overflow-hidden sticky top-24">
            <CardHeader className="bg-gray-900 text-white p-8">
              <CardTitle className="text-xl font-black uppercase tracking-tighter">Pricing & Inventory</CardTitle>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">B2B2C Supply Pricing</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Price Per Unit (₹) *</label>
                <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-6 py-4 text-2xl font-black text-primary-600 outline-none ring-2 ring-transparent focus:ring-primary-500" type="number" placeholder="0" value={form.pricePerUnit || ''} onChange={e => setForm({...form, pricePerUnit: Number(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Suggested Retail Price (₹)</label>
                <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-6 py-4 text-2xl font-black text-gray-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500" type="number" placeholder="Optional" value={form.suggestedRetailPrice || ''} onChange={e => setForm({...form, suggestedRetailPrice: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Units Available *</label>
                  <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-xl font-black text-gray-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500" type="number" min="1" value={form.quantityAvailable} onChange={e => setForm({...form, quantityAvailable: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Min Order Qty</label>
                  <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-xl font-black text-gray-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500" type="number" min="1" value={form.minOrderQuantity} onChange={e => setForm({...form, minOrderQuantity: Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-3xl border border-green-100 dark:border-green-900/30 space-y-2">
                <p className="text-[10px] font-black text-green-800 dark:text-green-300 uppercase tracking-wider">Total Inventory Value</p>
                <p className="text-3xl font-black text-green-700 dark:text-green-200">{form.pricePerUnit > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(form.pricePerUnit * form.quantityAvailable) : '₹0'}</p>
                <p className="text-[9px] text-green-600 dark:text-green-400 font-medium">{form.quantityAvailable} units at ₹{form.pricePerUnit.toLocaleString('en-IN')}/unit</p>
              </div>

              <Button type="submit" className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 uppercase tracking-[0.3em] transition-all hover:scale-[1.02]">List Product</Button>
            </CardContent>
          </Card>

          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/30 space-y-3">
            <h3 className="font-black text-sm text-amber-800 dark:text-amber-300 uppercase tracking-tight flex items-center gap-2"><Info className="w-4 h-4" /> Need Help?</h3>
            <div className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> kishanuddhav2004@gmail.com</p>
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 9336185009</p>
            </div>
            <p className="text-[9px] text-amber-600 dark:text-amber-500 font-medium">Contact us for bulk pricing, partnerships, or any questions</p>
          </div>
        </div>
      </form>
    </div>
  )
}
