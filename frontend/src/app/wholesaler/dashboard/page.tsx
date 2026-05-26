"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, IndianRupee, TrendingUp, AlertCircle, Edit2, Trash2, Eye, Building2, Phone, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function WholesalerDashboard() {
  const [stats, setStats] = useState({ totalProducts: 0, totalUnits: 0, pendingOrders: 0, kycStatus: 'not_submitted' });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, prodRes] = await Promise.all([
          api.get('/wholesaler/stats'),
          api.get('/wholesaler/products')
        ]);
        setStats(statsRes.data.stats);
        setProducts(prodRes.data.products);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete('/wholesaler/products/' + id);
      setProducts(products.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (e) { toast.error('Delete failed'); }
  };

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="container py-10 space-y-8">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-[32px] p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Wholesaler Dashboard</h1>
            <p className="text-primary-100 text-sm font-medium mt-1">Supply products in bulk for the Lease B2B2C network</p>
          </div>
          <div className="flex gap-3">
            {stats.kycStatus === 'approved' ? (
              <Badge className="bg-green-400 text-green-900 border-none font-black text-[10px] px-4 py-1.5"><ShieldCheck className="w-3 h-3 mr-1" />KYC Verified</Badge>
            ) : stats.kycStatus === 'pending' ? (
              <Badge className="bg-amber-400 text-amber-900 border-none font-black text-[10px] px-4 py-1.5">KYC Pending</Badge>
            ) : (
              <Link href="/wholesaler/kyc"><Button variant="secondary" size="sm" className="font-black text-xs">Complete KYC</Button></Link>
            )}
            <Link href="/wholesaler/products/new"><Button className="bg-white text-primary-700 hover:bg-gray-100 font-black shadow-lg"><Plus className="h-4 w-4 mr-1" /> New Product</Button></Link>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-[24px] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <Mail className="w-5 h-5" />
          <span className="font-bold text-sm">kishanuddhav2004@gmail.com</span>
        </div>
        <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <Phone className="w-5 h-5" />
          <span className="font-bold text-sm">+91 9336185009</span>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium ml-auto">Contact us for bulk pricing &amp; partnership inquiries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalProducts}</div>
            <p className="text-xs text-blue-500 mt-1">Unique SKUs listed</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-green-50/50 dark:bg-green-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total Units</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalUnits}</div>
            <p className="text-xs text-green-500 mt-1">Available in inventory</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-purple-50/50 dark:bg-purple-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Pending Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.pendingOrders}</div>
            <p className="text-xs text-purple-500 mt-1">Awaiting fulfillment</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50/50 dark:bg-amber-900/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">KYC Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 uppercase text-sm">{stats.kycStatus.replace('_', ' ')}</div>
            <p className="text-xs text-amber-500 mt-1">Required for payouts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader><CardTitle>Your Inventory</CardTitle></CardHeader>
        <CardContent>
          {products.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((p) => (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400"><Package className="h-6 w-6" /></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{p.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">{formatCurrency(p.price_per_unit)}/unit</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm font-bold text-primary-600">{p.quantity_available} units</span>
                        {p.brand && <><span className="text-gray-300">|</span><span className="text-xs text-gray-400">{p.brand}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Badge variant={p.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products listed yet.</p>
              <Link href="/wholesaler/products/new"><Button variant="outline" size="sm" className="mt-4">Add your first product</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
