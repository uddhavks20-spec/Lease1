'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Shield, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Clock, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AdminDashboard() {
  const [pendingItems, setPendingItems] = useState([] as any[])
  const [pendingRentals, setPendingRentals] = useState([] as any[])
  const [pendingKycs, setPendingKycs] = useState([] as any[])
  const [pendingVerifications, setPendingVerifications] = useState([] as any[])
  const [summary, setSummary] = useState(null as any)

  const load = () => {
    api.get('/items', { params: { status: 'pending' } }).then((r: any) => setPendingItems(r.data.items || []))
    api.get('/rentals', { params: { status: 'pending' } }).then((r: any) => setPendingRentals(r.data.rentals || []))
    api.get('/admin/kyc/pending').then((r: any) => setPendingKycs(r.data.kycs || []))
    api.get('/admin/verifications/pending').then((r: any) => setPendingVerifications(r.data.verifications || []))
    api.get('/analytics/summary').then((r: any) => setSummary(r.data || null))
  }

  useEffect(() => {
    load()
  }, [])

  const approveItem = async (id: string) => {
    await api.patch(`/admin/items/${id}/approve`)
    toast.success('Item approved')
    load()
  }
  const approveRental = async (id: string) => {
    await api.patch(`/admin/rentals/${id}/approve`)
    toast.success('Rental approved')
    load()
  }
    const approveVerification = async (itemId: string) => {
    await api.patch(`/admin/verifications/${itemId}/approve`)
    toast.success('Product verified')
    load()
  }
  const rejectVerification = async (itemId: string) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    await api.patch(`/admin/verifications/${itemId}/reject`, { reason })
    toast.success('Product verification rejected')
    load()
  }
  const approveKyc = async (userId: string) => {
    await api.patch(`/admin/kyc/${userId}/approve`)
    toast.success('KYC approved')
    load()
  }

  return (
    <div className="container py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
        {summary && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Revenue: ₹{summary.revenue} • Commission: ₹{summary.commission} • Active rentals: {summary.activeRentals}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-black uppercase tracking-tighter">Audit Pending Listings</h2>
          </div>
          <div className="space-y-4">
            {pendingItems.map((i: any) => {
              const conditionMod = i.condition === 'new' ? 1.0 : i.condition === 'mint' ? 0.9 : i.condition === 'good' ? 0.8 : 0.7;
              const bav = Number(i.retail_price) * conditionMod;
              const baseRentAnchor = bav / 12;
              
              // For audit, we assume 12mo anchor as baseline
              const finalMonthlyRent = i.monthly_rent; 
              const renterTotalCost = finalMonthlyRent * 1.05;
              const lenderNetPayout = finalMonthlyRent * 0.95;
              const platformGross = finalMonthlyRent * 0.10;
              const lenderYield = (lenderNetPayout / bav) * 100;
              const paybackVelocity = bav / lenderNetPayout;

              // Category Attribute Matrix Data
              const categoryMap: any = {
                'Appliances & Cooling': { type: 'High-Overhead Appliance', risk: 'High (Summer Spikes)', maintenance: 'High (Install/Clean)', target: '10-12 months' },
                'Electronics & Entertainment': { type: 'High-Velocity Electronics', risk: 'Low (Constant)', maintenance: 'Low (Physical)', target: '8-10 months' },
                'Study & Furniture': { type: 'High-Durability Furniture', risk: 'None', maintenance: 'Minimal', target: '12-14 months' },
                'Clothing & Accessories': { type: 'High-Churn Lifestyle', risk: 'Very High', maintenance: 'High (Wear)', target: '3-4 months' }
              };
              const catInfo = categoryMap[i.category_name] || categoryMap['Study & Furniture'];

              return (
                <div key={i.id} className="bg-white dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black bg-primary-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">v3.1</span>
                          <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">📊 TRANSACTION MONITOR: {i.title}</h3>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Market Retail: {formatCurrency(i.retail_price)} | Condition: {(i.condition || 'good').toUpperCase()}</p>
                      </div>
                      <Badge className="bg-amber-500 text-white border-none font-black uppercase text-[10px] px-4 py-1 rounded-full animate-pulse">Awaiting Audit</Badge>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Baseline Asset Value (BAV)</p>
                          <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(bav)}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">12-Month Anchor Rent</p>
                          <p className="text-xl font-black text-primary-600">{formatCurrency(baseRentAnchor)}</p>
                        </div>
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">💰 UNIT ECONOMICS</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Final Rent (Admin):</span>
                              <span className="text-gray-900 dark:text-white">{formatCurrency(finalMonthlyRent)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Renter Invoice:</span>
                              <span className="text-primary-600">{formatCurrency(renterTotalCost)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Platform Gross:</span>
                              <span className="text-green-600">{formatCurrency(platformGross)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">📈 LENDER METRICS</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Net Payout:</span>
                              <span className="text-gray-900 dark:text-white">{formatCurrency(lenderNetPayout)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Monthly Yield:</span>
                              <span className="text-blue-600">{lenderYield.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-500">Payback Velocity:</span>
                              <span className="text-amber-600">{paybackVelocity.toFixed(1)} mo</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">🛡️ RISK PROFILE</p>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate">{catInfo.type}</p>
                            <p className="text-[9px] font-bold text-gray-500">Risk: {catInfo.risk}</p>
                            <p className="text-[9px] font-bold text-gray-500">Target: {catInfo.target}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <p className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Incident Playbook Reference</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-[9px] font-bold text-blue-700 dark:text-blue-400">
                            <div>Alpha: Liab = {formatCurrency(bav)} - Rent Paid</div>
                            <div>Beta: 72hr Replenishment Window</div>
                            <div>Gamma: Term. Fee = {formatCurrency(platformGross)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-2">
                        <Button 
                          onClick={() => approveItem(i.id)}
                          className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-gray-200 dark:shadow-none transition-transform hover:-translate-y-1"
                        >
                          Approve v3.1 Listing
                        </Button>
                        <Button 
                          variant="outline"
                          className="px-8 h-14 rounded-2xl border-2 border-red-100 text-red-600 font-black uppercase tracking-widest text-[11px] hover:bg-red-50 hover:border-red-200 transition-all"
                        >
                          Flag Listing
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {!pendingItems.length && <div className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-10 rounded-[32px] text-center font-bold uppercase tracking-widest text-xs">No pending items for audit</div>}
          </div>
        </section>

        <section className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-black uppercase tracking-tighter">KYC Verifications</h2>
            </div>
            <div className="space-y-6">
              {pendingKycs.map((k: any) => (
                <div key={k.user_id} className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center font-black text-gray-400 text-sm">
                          {(k.user_id || '?').slice(0,1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">User ID: {(k.user_id || '').slice(0,8)}</p>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pending Verification</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => approveKyc(k.user_id)}
                          className="h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] px-5"
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline"
                          className="h-10 rounded-xl border-2 border-red-100 text-red-500 font-black uppercase text-[10px] px-5 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {k.document_front_url && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Front</p>
                          <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <img src={k.document_front_url} alt="Document Front" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                          </div>
                        </div>
                      )}
                      {k.document_back_url && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document Back</p>
                          <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <img src={k.document_back_url} alt="Document Back" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                          </div>
                        </div>
                      )}
                      {k.selfie_url && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Selfie</p>
                          <div className="aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <img src={k.selfie_url} alt="Selfie" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-bold">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <span className="text-gray-400 uppercase tracking-wider block mb-0.5">Aadhaar</span>
                        <span className="text-gray-900 dark:text-white">{(k.aadhaar_number || '').slice(0,4)}XXXX</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <span className="text-gray-400 uppercase tracking-wider block mb-0.5">PAN</span>
                        <span className="text-gray-900 dark:text-white">{(k.pan_number || '').slice(0,2)}XXXX{(k.pan_number || '').slice(-1)}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <span className="text-gray-400 uppercase tracking-wider block mb-0.5">College ID</span>
                        <span className="text-gray-900 dark:text-white">{(k.college_id || 'N/A')}</span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <span className="text-gray-400 uppercase tracking-wider block mb-0.5">Submitted</span>
                        <span className="text-gray-900 dark:text-white">{k.created_at ? new Date(k.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!pendingKycs.length && <div className="text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl text-center font-bold uppercase tracking-widest text-[10px]">All KYCs processed</div>}
            </div>
          </div>

                    {/* Product Verifications */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <h2 className="text-xl font-black uppercase tracking-tighter">Product Verifications</h2>
            </div>
            <div className="space-y-6">
              {pendingVerifications.map((v: any) => (
                <div key={v.id} className="bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {v.primary_image ? (
                          <img src={v.primary_image} alt={v.item_title} className="w-14 h-14 rounded-2xl object-cover bg-gray-50 border border-gray-100" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xs">NoImg</div>
                        )}
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{v.item_title}</p>
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pending Verification</p>
                          {v.serial_number && <p className="text-[9px] text-gray-400 font-medium">SN: {v.serial_number}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => approveVerification(v.item_id)} className="h-10 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] transition-all">Approve</button>
                        <button onClick={() => rejectVerification(v.item_id)} className="h-10 px-5 rounded-xl border-2 border-red-100 text-red-500 font-black uppercase text-[10px] hover:bg-red-50 transition-all">Reject</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {v.purchase_receipt_url && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Receipt</p>
                          <a href={v.purchase_receipt_url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:opacity-80 transition-opacity">
                            <img src={v.purchase_receipt_url} alt="Receipt" className="w-full h-full object-cover" onError={(e) => { (e.target).style.display = 'none' }} />
                          </a>
                        </div>
                      )}
                      {v.original_box_photo_url && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Box Photo</p>
                          <a href={v.original_box_photo_url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:opacity-80 transition-opacity">
                            <img src={v.original_box_photo_url} alt="Box" className="w-full h-full object-cover" onError={(e) => { (e.target).style.display = 'none' }} />
                          </a>
                        </div>
                      )}
                      {v.damage_photo_url && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Damage</p>
                          <a href={v.damage_photo_url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:opacity-80 transition-opacity">
                            <img src={v.damage_photo_url} alt="Damage" className="w-full h-full object-cover" onError={(e) => { (e.target).style.display = 'none' }} />
                          </a>
                        </div>
                      )}
                      {v.video_url && (
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Video</p>
                          <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-center hover:opacity-80 transition-opacity">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </a>
                        </div>
                      )}
                    </div>
                    {v.notes && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller Notes</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">{v.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!pendingVerifications.length && <div className="text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl text-center font-bold uppercase tracking-widest text-[10px]">No pending product verifications</div>}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Pending Rentals</h2>
            </div>
            <div className="space-y-3">
              {pendingRentals.map((r: any) => (
                <div key={r.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Rental #{r.id.slice(0,8)}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Awaiting Escrow Activation</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => approveRental(r.id)}
                    className="h-10 rounded-xl bg-gray-900 hover:bg-black text-white font-black uppercase text-[10px] px-6"
                  >
                    Activate
                  </Button>
                </div>
              ))}
              {!pendingRentals.length && <div className="text-gray-500 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl text-center font-bold uppercase tracking-widest text-[10px]">No pending rentals</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
