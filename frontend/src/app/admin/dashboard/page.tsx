'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Clock,
  Package, Users, MapPin, Percent, Gift, Star, ShoppingCart, Eye, ExternalLink
} from 'lucide-react'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [pendingKycs, setPendingKycs] = useState<any[]>([])
  const [pendingRentals, setPendingRentals] = useState<any[]>([])

  const load = async () => {
    try {
      const [dashRes, itemsRes, kycsRes, rentalsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/items', { params: { status: 'pending', limit: 5 } }),
        api.get('/admin/kyc/pending'),
        api.get('/rentals', { params: { status: 'pending', limit: 5 } }),
      ])
      setData(dashRes.data)
      setPendingItems(itemsRes.data.items || [])
      setPendingKycs(kycsRes.data.kycs || [])
      setPendingRentals(rentalsRes.data.rentals || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const approveItem = async (id: string) => { await api.patch(`/admin/items/${id}/approve`); toast.success('Approved'); load() }
  const approveKyc = async (userId: string) => { await api.patch(`/admin/kyc/${userId}/approve`); toast.success('KYC approved'); load() }
  const approveRental = async (id: string) => { await api.patch(`/admin/rentals/${id}/approve`); toast.success('Rental approved'); load() }

  const metrics = data ? [
    { label: 'Revenue', value: formatCurrency(Number(data.revenue)), icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
    { label: 'Commission', value: formatCurrency(Number(data.commission)), icon: TrendingUp, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
    { label: 'Active Rentals', value: data.activeRentals, icon: ShoppingCart, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    { label: 'Active Items', value: data.activeItems, icon: Package, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' },
    { label: 'Cities', value: data.totalCities, icon: MapPin, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20' },
    { label: 'Reviews', value: data.totalReviews, icon: Star, color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20' },
    { label: 'Coupons', value: data.totalCoupons, icon: Percent, color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20' },
  ] : []

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Admin Panel</h1>
          <p className="text-gray-500">Manage your marketplace</p>
        </div>
        <div className="flex gap-2 text-xs font-bold text-gray-400">
          <Badge variant="secondary">{data?.totalUsers || 0} users</Badge>
          <Badge variant="secondary">{data?.activeRentals || 0} active rentals</Badge>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { href: '/admin/cities', label: 'Cities', icon: MapPin, color: 'text-cyan-600 bg-cyan-50' },
          { href: '/seller/coupons', label: 'Coupons', icon: Percent, color: 'text-pink-600 bg-pink-50' },
          { href: '/referrals', label: 'Referrals', icon: Gift, color: 'text-yellow-600 bg-yellow-50' },
          { href: '/disputes', label: 'Disputes', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { href: '/seller/kyc', label: 'KYC', icon: Shield, color: 'text-green-600 bg-green-50' },
          { href: '/browse', label: 'Catalog', icon: Eye, color: 'text-blue-600 bg-blue-50' },
        ].map(l => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-800 h-full">
              <CardContent className="py-4 flex flex-col items-center text-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${l.color} mb-2`}>
                  <l.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">{l.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {metrics.map((m, i) => (
          <Card key={i} className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white truncate">{m.value}</div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Pending Actions + Chart */}
        <div className="lg:col-span-7 space-y-8">
          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                Monthly Revenue (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.monthlyRevenue?.length > 0 ? (
                <div className="space-y-2">
                  {data.monthlyRevenue.map((m: any, i: number) => {
                    const max = Math.max(...data.monthlyRevenue.map((r: any) => Number(r.revenue)), 1)
                    const pct = (Number(m.revenue) / max) * 100
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 w-20 flex-shrink-0">
                          {new Date(m.month).toLocaleString('default', { month: 'short', year: '2-digit' })}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 w-16 text-right flex-shrink-0">
                          {formatCurrency(Number(m.revenue))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">No revenue data yet</div>
              )}
            </CardContent>
          </Card>

          {/* Pending Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" />
                Pending Items
                <Badge className="ml-1">{data?.pendingItems || 0}</Badge>
              </h2>
              <Link href="/browse?status=pending" className="text-xs text-primary-600 font-bold flex items-center gap-1">
                View All <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {pendingItems.slice(0, 5).map((i: any) => (
                <Card key={i.id} className="border-gray-100 dark:border-gray-800">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{i.title}</p>
                      <p className="text-[10px] text-gray-400">{i.category_name} · {formatCurrency(i.monthly_rent)}/mo</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 text-[10px] font-bold px-4 rounded-xl" onClick={() => approveItem(i.id)}>Approve</Button>
                      <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold px-4 rounded-xl">Reject</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingItems.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No pending items</p>}
            </div>
          </div>

          {/* Pending Rentals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Pending Rentals
              </h2>
            </div>
            <div className="space-y-3">
              {pendingRentals.slice(0, 5).map((r: any) => (
                <Card key={r.id} className="border-gray-100 dark:border-gray-800">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Rental #{r.id?.slice(0, 8)}</p>
                      <p className="text-[10px] text-gray-400">{r.item_title || ''} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" className="h-8 text-[10px] font-bold px-4 rounded-xl" onClick={() => approveRental(r.id)}>Activate</Button>
                  </CardContent>
                </Card>
              ))}
              {pendingRentals.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No pending rentals</p>}
            </div>
          </div>
        </div>

        {/* Right: Side Panels */}
        <div className="lg:col-span-5 space-y-8">
          {/* Pending KYC */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Pending KYC
                <Badge className="ml-1">{data?.pendingKycs || 0}</Badge>
              </h2>
            </div>
            <div className="space-y-3">
              {pendingKycs.slice(0, 5).map((k: any) => (
                <Card key={k.user_id} className="border-gray-100 dark:border-gray-800">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-xs font-bold">
                          {k.user_id?.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold">ID: {k.user_id?.slice(0, 8)}...</p>
                          <p className="text-[9px] text-gray-400">{new Date(k.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 text-[9px] font-bold px-3 rounded-xl bg-green-600" onClick={() => approveKyc(k.user_id)}>✓</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[9px] font-bold px-3 rounded-xl text-red-500">✗</Button>
                      </div>
                    </div>
                    <div className="flex gap-2 text-[9px] text-gray-400">
                      {k.aadhaar_number && <span>Aadhaar: {k.aadhaar_number.slice(0, 4)}XXXX</span>}
                      {k.pan_number && <span>PAN: {k.pan_number.slice(0, 2)}XXXX</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingKycs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">All KYCs processed</p>}
            </div>
          </div>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-600" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentUsers?.length > 0 ? (
                <div className="space-y-3">
                  {data.recentUsers.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center text-[9px] font-bold">
                          {(u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[140px]">{u.email}</p>
                          <p className="text-[9px] text-gray-400 capitalize">{u.role} · {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[8px] capitalize">{u.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">No users yet</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-yellow-50/50 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30">
              <CardContent className="py-4">
                <div className="text-2xl font-black text-yellow-700">{data?.totalReferrals || 0}</div>
                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Total Referrals</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
              <CardContent className="py-4">
                <div className="text-2xl font-black text-red-700">{data?.openDisputes || 0}</div>
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Open Disputes</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30">
              <CardContent className="py-4">
                <div className="text-2xl font-black text-blue-700">{data?.totalSellers || 0}</div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Sellers</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30">
              <CardContent className="py-4">
                <div className="text-2xl font-black text-purple-700">{data?.totalRenters || 0}</div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Renters</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
