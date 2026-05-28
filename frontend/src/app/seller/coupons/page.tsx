"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Plus, Tag, Copy, Power, Trash2, Percent, IndianRupee } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_rental_amount: number
  max_discount_amount: number
  usage_limit: number
  used_count: number
  is_active: boolean
  valid_from: string
  valid_until: string
  created_at: string
}

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: '',
    min_rental_amount: '0', max_discount_amount: '', usage_limit: '', valid_until: '',
  })

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons/my')
      setCoupons(res.data.coupons)
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchCoupons() }, [])

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/coupons', {
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_rental_amount: parseFloat(form.min_rental_amount),
        max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : undefined,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : undefined,
        valid_until: form.valid_until || undefined,
      })
      toast.success('Coupon created!')
      setShowCreate(false)
      setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', min_rental_amount: '0', max_discount_amount: '', usage_limit: '', valid_until: '' })
      fetchCoupons()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create coupon')
    }
  }

  const toggleCoupon = async (id: string) => {
    await api.patch(`/coupons/${id}/toggle`)
    fetchCoupons()
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    await api.delete(`/coupons/${id}`)
    toast.success('Coupon deleted')
    fetchCoupons()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Copied!')
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-gray-500">Create discount codes for your listings</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}><Plus className="h-4 w-4 mr-2" />New Coupon</Button>
      </div>

      {showCreate && (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={createCoupon} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1">Coupon Code</label>
                  <input className="input-field" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="STUDENT20" />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Discount Type</label>
                  <select className="input-field" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Discount Value</label>
                  <input className="input-field" type="number" required min="1" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'percentage' ? '20' : '500'} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Description</label>
                  <input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Summer sale 20% off" />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Min Rental Amount (₹)</label>
                  <input className="input-field" type="number" min="0" value={form.min_rental_amount} onChange={e => setForm({ ...form, min_rental_amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Max Discount (₹, optional)</label>
                  <input className="input-field" type="number" min="0" value={form.max_discount_amount} onChange={e => setForm({ ...form, max_discount_amount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Usage Limit (optional)</label>
                  <input className="input-field" type="number" min="1" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Valid Until (optional)</label>
                  <input className="input-field" type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                </div>
              </div>
              <Button type="submit">Create Coupon</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No coupons yet. Create your first discount code!</p>
            </CardContent>
          </Card>
        ) : coupons.map(coupon => (
          <Card key={coupon.id} className={`${!coupon.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                    {coupon.discount_type === 'percentage' ? <Percent className="h-6 w-6 text-primary-600" /> : <IndianRupee className="h-6 w-6 text-primary-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg font-mono">{coupon.code}</span>
                      <Badge variant={coupon.is_active ? 'default' : 'secondary'} className="text-[10px]">{coupon.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      {coupon.description && ` · ${coupon.description}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Used {coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''} times
                      {coupon.valid_until && ` · Expires ${new Date(coupon.valid_until).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleCoupon(coupon.id)}>
                    <Power className={`h-4 w-4 ${coupon.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteCoupon(coupon.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
