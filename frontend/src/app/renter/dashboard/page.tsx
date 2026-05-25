"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, AlertCircle, CreditCard, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import { LeaseBot } from "@/components/LeaseBot";

interface Rental {
  id: string;
  item_id: string;
  title: string;
  duration_months: number;
  total_rent: number;
  deposit_amount: number;
  status: string;
  created_at: string;
  item?: {
    title: string;
    image_url: string;
  };
}

export default function RenterDashboard() {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/rentals")
      .then((res) => setRentals(res.data.rentals || []))
      .catch((err) => console.error("Error fetching rentals:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="container py-10 space-y-10 max-w-6xl">
      <LeaseBot role="renter" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Renter Dashboard</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Manage your active rentals & payments</p>
        </div>
        <Link href="/browse">
          <Button className="rounded-2xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-primary-200">
            Explore More Items
          </Button>
        </Link>
      </div>

      {rentals.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent rounded-[40px] p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No Active Rentals</h2>
            <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">You haven't rented anything yet. Start browsing the campus catalog!</p>
          </div>
          <Link href="/browse">
            <Button variant="outline" className="rounded-xl font-bold border-2">
              Browse Catalog
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Main Content: Active Rentals */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Current Rentals</h2>
            </div>
            
            <div className="space-y-4">
              {rentals.map((rental) => (
                <Card key={rental.id} className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-6 p-6">
                      <div className="relative w-full sm:w-32 h-32 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center p-4">
                        <Package className="h-12 w-12 text-gray-300" />
                        <Badge className="absolute top-2 right-2 bg-primary-600 text-white border-none text-[10px] font-black uppercase">
                          {rental.status}
                        </Badge>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Rental #{rental.id.slice(0, 8)}</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{rental.duration_months} Months Duration</p>
                          </div>
                          <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-primary-50 group-hover:text-primary-600">
                            Details <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Monthly Rent</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(rental.total_rent / rental.duration_months)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Next Payment</p>
                            <p className="font-bold text-primary-600 text-sm">Oct 24, 2026</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Security Deposit</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(rental.deposit_amount)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</p>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              <span className="font-bold text-green-600 text-[10px] uppercase">{rental.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar: KYC & Quick Stats */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-none bg-gradient-to-br from-gray-900 to-black text-white rounded-[40px] overflow-hidden shadow-2xl">
              <CardContent className="p-10 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tighter">KYC Status</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-black uppercase text-[10px]">Verified</Badge>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IIT Kanpur Student</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Safety Rating</p>
                      <p className="font-bold text-sm">4.9 / 5.0</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Savings</p>
                      <p className="font-bold text-sm">₹12,400</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full h-14 bg-white text-black hover:bg-primary-500 hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all">
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[32px] border border-amber-100 dark:border-amber-900/20 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="font-black text-amber-900 dark:text-amber-400 uppercase text-sm tracking-tight">Need Help?</h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed font-medium">Contact campus support for any issues with delivery or item condition. We're here 24/7.</p>
              <Link href="/contact">
                <p className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest flex items-center gap-2 hover:underline mt-2">
                  Get Support <ArrowRight className="w-3 h-3" />
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
