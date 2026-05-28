"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, IndianRupee, TrendingUp, AlertCircle, Edit2, Trash2, Eye, Tag, Shield, Zap, Percent, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface SellerStats {
  totalEarnings: number;
  activeListings: number;
  totalRentals: number;
  pendingRequests: number;
}

interface Item {
  id: string;
  title: string;
  monthly_rent: number;
  status: 'pending' | 'approved' | 'active' | 'rented' | 'rejected';
  seller_type: string;
  retail_price: number;
  resell_value: number;
  recoveryPct: number;
  recoveryTarget: number;
  condition: string;
  category_name: string;
  views?: number;
}

// ─── v3 Pricing Helpers ───────────────────────────────────────────
const CONDITION_RENT_FACTOR: Record<string, number> = {
  'new': 1.00, 'mint': 0.95, 'excellent': 0.95,
  'good': 0.88, 'fair': 0.78, 'poor': 0.65,
}
const CONDITION_UNDERCUT: Record<string, number> = {
  'new': 0.02, 'mint': 0.03, 'excellent': 0.03,
  'good': 0, 'fair': 0, 'poor': 0,
}
const EMI_ANNUAL_RATE = 0.15
const TENURE_BANDS = [
  { id: 'flash', min: 1, max: 3, emiHorizon: 12 },
  { id: 'semester', min: 4, max: 11, emiHorizon: 18 },
  { id: 'annual', min: 12, max: 18, emiHorizon: 24 },
  { id: 'extended', min: 19, max: 24, emiHorizon: 36 },
  { id: 'lifecycle', min: 25, max: 48, emiHorizon: 48 },
]
const COMPETITOR_RATES: Record<string, number> = {
  'Electronics & Entertainment': 0.060, Electronics: 0.060,
  'Appliances & Cooling': 0.055, Appliance: 0.055,
  'Study & Furniture': 0.040, Furniture: 0.040,
  'Clothing & Accessories': 0.075, Lifestyle: 0.075, Clothing: 0.075,
}

function getTenureBand(months: number) {
  return TENURE_BANDS.find(b => months >= b.min && months <= b.max) || TENURE_BANDS[2]
}

function calcDepositMultiplier(mrv: number): number {
  return 1.0 + Math.max(0, Math.floor((mrv - 1) / 10000)) * 0.065
}

function tenureFactor(n: number): number {
  return 0.6 + 0.4 * Math.pow(12 / Math.max(3, Math.min(48, n)), 0.5)
}

function computePricing(mrv: number, condition: string, categoryName: string, months: number) {
  const compRate = COMPETITOR_RATES[categoryName] || 0.060
  const cond = condition.toLowerCase()
  const condRentFactor = CONDITION_RENT_FACTOR[cond] || 0.88
  const itemUndercut = CONDITION_UNDERCUT[cond] ?? 0
  const depositMultiplier = calcDepositMultiplier(mrv)
  const band = getTenureBand(months)
  const compMonthly = Math.round(mrv * compRate)
  const emiTotal = Math.round(mrv + mrv * EMI_ANNUAL_RATE * band.emiHorizon / 12)
  const emiMonthly = Math.round(emiTotal / band.emiHorizon)
  const baselineNew = Math.round(Math.min(compMonthly, emiMonthly) * (1 - itemUndercut))
  const leaseRent = Math.round(baselineNew * condRentFactor * tenureFactor(months))
  return { leaseRent, deposit: Math.round(leaseRent * depositMultiplier), compMonthly, emiMonthly, tenureFactor: tenureFactor(months) }
}

export default function SellerDashboard() {
  const [stats, setStats] = useState<SellerStats>({
    totalEarnings: 0,
    activeListings: 0,
    totalRentals: 0,
    pendingRequests: 0
  });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, itemsRes] = await Promise.all([
          api.get('/analytics/seller/stats'),
          api.get('/items/seller/my-items')
        ]);
        setStats(statsRes.data.stats);
        setItems(itemsRes.data.items);
      } catch (e) {
        console.error('Error fetching seller data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/items/${id}`);
      setItems(items.filter(item => item.id !== id));
      toast.success('Listing deleted');
    } catch (e) {
      toast.error('Failed to delete listing');
    }
  };

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-gray-500">Manage your campus rentals and track earnings.</p>
        </div>
        <Link href="/seller/items/new">
          <Button className="shadow-lg shadow-primary-200">
            <Plus className="h-4 w-4 mr-2" />
            Add New Listing
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-blue-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-green-50/50 dark:bg-green-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Active Listings</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.activeListings}</div>
            <p className="text-xs text-green-500 mt-1">Ready for rent</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-purple-50/50 dark:bg-purple-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Rentals</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalRentals}</div>
            <p className="text-xs text-purple-500 mt-1">Successful transactions</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-amber-50/50 dark:bg-amber-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingRequests}</div>
            <p className="text-xs text-amber-500 mt-1">Requires your attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/seller/coupons">
          <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-800">
            <CardContent className="py-4 flex flex-col items-center text-center">
              <Percent className="h-6 w-6 text-primary-600 mb-1" />
              <span className="text-sm font-bold">Coupons</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/referrals">
          <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-800">
            <CardContent className="py-4 flex flex-col items-center text-center">
              <Gift className="h-6 w-6 text-yellow-600 mb-1" />
              <span className="text-sm font-bold">Referrals</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/seller/kyc">
          <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-800">
            <CardContent className="py-4 flex flex-col items-center text-center">
              <Shield className="h-6 w-6 text-green-600 mb-1" />
              <span className="text-sm font-bold">KYC</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/disputes">
          <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-800">
            <CardContent className="py-4 flex flex-col items-center text-center">
              <AlertCircle className="h-6 w-6 text-red-600 mb-1" />
              <span className="text-sm font-bold">Disputes</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Listings */}
      <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Listings</CardTitle>
            <Link href="/seller/coupons" className="text-sm text-primary-600 font-bold flex items-center gap-1">
              <Tag className="h-4 w-4" />Coupons
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{formatCurrency(item.monthly_rent)}/mo</span>
                          <span className="text-gray-300">•</span>
                          <Badge variant={
                            item.status === 'active' ? 'default' : 
                            item.status === 'pending' ? 'secondary' : 
                            'outline'
                          } className="capitalize py-0 h-5 text-[10px]">
                            {item.status}
                          </Badge>
                          <span className="text-[9px] text-gray-400 font-bold uppercase">{item.seller_type === 'A' ? 'Type A' : 'Type B'}</span>
                        </div>
                        {/* Payout by tenure */}
                        {item.retail_price > 0 && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-gray-500">
                            {[3, 6, 12, 18, 24, 36, 48].map((n) => {
                              const p = computePricing(Number(item.retail_price), item.condition || 'good', item.category_name || 'Electronics', n)
                              return (
                                <span key={n}>
                                  <span className="text-gray-400">{n}mo</span>
                                  <span className="text-[8px] text-gray-300">×{p.tenureFactor.toFixed(2)}</span>
                                  <span> ₹{p.leaseRent.toLocaleString('en-IN')}</span>
                                  <span className="text-green-600">/₹{Math.floor(p.leaseRent * 0.80).toLocaleString('en-IN')}</span>
                                </span>
                              )
                            })}
                          </div>
                        )}
                        {/* Recovery Bar */}
                        {item.recoveryTarget > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[9px] font-bold text-gray-400 mb-0.5">
                              <span>Recovery</span>
                              <span>{item.recoveryPct}% · ₹{Math.round(item.recoveryTarget * item.recoveryPct / 100).toLocaleString('en-IN')} / ₹{item.recoveryTarget.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${item.recoveryPct >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${item.recoveryPct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  
                  <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                    <Button variant="ghost" size="sm" className={`${(item as any).is_boosted ? 'text-purple-500' : 'text-gray-400'}`} onClick={async () => {
                      try {
                        await api.patch(`/items/${item.id}/boost`);
                        toast.success((item as any).is_boosted ? 'Boost removed' : 'Item boosted!');
                        const res = await api.get('/items/seller/my-items');
                        setItems(res.data.items);
                      } catch { toast.error('Failed to toggle boost'); }
                    }}>
                      <Zap className={`h-4 w-4 ${(item as any).is_boosted ? 'fill-purple-500' : ''}`} />
                    </Button>
                    <Link href={`/items/${item.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/seller/items/edit/${item.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't listed any items yet.</p>
              <Link href="/seller/items/new" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Create your first listing</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
