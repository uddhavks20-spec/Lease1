"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, Clock, CheckCircle2, AlertCircle, Shield,
  UserCheck, Calendar, ArrowRight, Send, X,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Booking {
  id: string;
  itemName: string;
  monthlyRent: number;
  deposit: number;
  tenureMonths: number;
  status: string;
  startDate: string;
  endDate: string;
  guarantor: { name: string; accepted: boolean } | null;
  careScore: number;
  checkInProgress: number;
  checkInTotal: number;
}

interface BookingDetail {
  id: string;
  itemName: string;
  monthlyRent: number;
  deposit: number;
  tenureMonths: number;
  condition: string;
  category: string;
  guarantor: { name: string; email: string; phone: string; accepted: boolean } | null;
  status: string;
  startDate: string;
  endDate: string;
  checkIns: { week: number; dueDate: string; respondedAt: string | null; status: string }[];
  careScore: number;
  dueCheckins: number;
  nextCheckinDue: string | null;
  sellerPayout: number;
  platformTake: number;
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending_guarantor': return 'bg-amber-500'
    case 'active': return 'bg-green-500'
    case 'overdue': return 'bg-red-500'
    case 'completed': return 'bg-blue-500'
    case 'disputed': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_guarantor': return 'Awaiting Guarantor'
    case 'active': return 'Active'
    case 'overdue': return 'Overdue'
    case 'completed': return 'Completed'
    case 'disputed': return 'Disputed'
    default: return status
  }
}

function careScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingsPage() {
  const router = useRouter();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorEmail, setGuarantorEmail] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [showGuarantorForm, setShowGuarantorForm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/active`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActiveBookings(data.active || []);
      setAllBookings(data.all || []);
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings() }, [fetchBookings]);

  const fetchBookingDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedBooking(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedBooking(data.booking);
    } catch (e) {
      console.error('Failed to fetch booking detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddGuarantor = async (bookingId: string) => {
    if (!guarantorName.trim() || !guarantorEmail.trim()) {
      setMessage({ type: 'error', text: 'Guarantor name and email are required' });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/guarantor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: guarantorName, email: guarantorEmail, phone: guarantorPhone }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessage({ type: 'success', text: data.message || 'Guarantor added!' });
      setShowGuarantorForm(null);
      setGuarantorName('');
      setGuarantorEmail('');
      setGuarantorPhone('');
      fetchBookings();
      if (selectedBooking?.id === bookingId) fetchBookingDetail(bookingId);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to add guarantor' });
    }
  };

  const handleCheckin = async (bookingId: string, status: 'ok' | 'issue') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessage({ type: 'success', text: data.message });
      fetchBookings();
      if (selectedBooking?.id === bookingId) fetchBookingDetail(bookingId);
    } catch (e) {
      setMessage({ type: 'error', text: 'Check-in failed' });
    }
  };

  const handleComplete = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessage({ type: 'success', text: `Rental completed! Care score: ${data.careScore}/100` });
      fetchBookings();
      if (selectedBooking?.id === bookingId) fetchBookingDetail(bookingId);
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to complete rental' });
    }
  };

  if (loading) return (
    <div className="container py-20 flex justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  return (
    <div className="container py-10 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">My Bookings</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Manage rentals, guarantors & check-ins</p>
        </div>
        <div className="flex gap-3">
          <Link href="/browse">
            <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest">
              Browse Items
            </Button>
          </Link>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main: Active bookings list */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Active Rentals
              {activeBookings.length > 0 && (
                <span className="ml-2 text-sm font-bold text-gray-400">({activeBookings.length})</span>
              )}
            </h2>
          </div>

          {activeBookings.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent rounded-[40px] p-16 text-center space-y-6">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-10 w-10 text-gray-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">No Active Rentals</h2>
                <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">
                  Start a booking through Lease Guru — just ask to rent something and select "Start booking process".
                </p>
              </div>
              <Link href="/">
                <Button className="rounded-xl font-bold">
                  Chat with Lease Guru
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className={`border-none bg-white dark:bg-gray-800 shadow-sm rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg ${
                    selectedBooking?.id === booking.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => fetchBookingDetail(booking.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">
                            {booking.itemName}
                          </h3>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            ID: {booking.id}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusColor(booking.status)} text-white border-none text-[9px] font-black uppercase`}>
                        {statusLabel(booking.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Rent</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">₹{booking.monthlyRent.toLocaleString('en-IN')}/mo</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deposit</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">₹{booking.deposit.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tenure</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{booking.tenureMonths}mo</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Care Score</p>
                        <p className={`font-bold text-sm ${careScoreColor(booking.careScore)}`}>{booking.careScore}/100</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                        <Calendar className="w-3 h-3" />
                        {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <UserCheck className="w-3 h-3" />
                        {booking.guarantor ? 'Guarantor set' : 'No guarantor'}
                      </div>
                    </div>

                    {booking.checkInTotal > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all"
                              style={{ width: `${(booking.checkInProgress / booking.checkInTotal) * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-gray-400">
                            {booking.checkInProgress}/{booking.checkInTotal} check-ins
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Past bookings */}
          {allBookings.filter(b => b.status === 'completed').length > 0 && (
            <div className="pt-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-tighter text-gray-400">Past Rentals</h3>
              {allBookings.filter(b => b.status === 'completed').map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{booking.itemName}</p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                        {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${careScoreColor(booking.careScore)}`}>{booking.careScore}/100</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Care Score</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Booking detail */}
        <div className="lg:col-span-5 space-y-6">
          {selectedBooking ? (
            <div className="space-y-6">
              <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase text-sm tracking-tight">{selectedBooking.itemName}</h3>
                    <Badge className={`${statusColor(selectedBooking.status)} text-white border-none text-[9px] font-black uppercase`}>
                      {statusLabel(selectedBooking.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monthly</p>
                      <p className="font-black text-lg text-gray-900 dark:text-white">₹{selectedBooking.monthlyRent.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Deposit</p>
                      <p className="font-black text-lg text-gray-900 dark:text-white">₹{selectedBooking.deposit.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold text-xs">Tenure</span>
                      <span className="font-bold">{selectedBooking.tenureMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold text-xs">Condition</span>
                      <span className="font-bold">{selectedBooking.condition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold text-xs">Period</span>
                      <span className="font-bold text-xs">{formatDate(selectedBooking.startDate)} — {formatDate(selectedBooking.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold text-xs">Care Score</span>
                      <span className={`font-bold ${careScoreColor(selectedBooking.careScore)}`}>{selectedBooking.careScore}/100</span>
                    </div>
                  </div>

                  {/* Guarantor section */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary-600" />
                      <h4 className="font-black text-xs uppercase tracking-widest">Peer Guarantor</h4>
                    </div>

                    {selectedBooking.guarantor ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-bold text-sm text-green-700 dark:text-green-400">{selectedBooking.guarantor.name}</p>
                            <p className="text-[10px] font-bold text-green-600/70">{selectedBooking.guarantor.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : selectedBooking.status === 'pending_guarantor' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Add a guarantor to activate this booking
                        </p>
                        {showGuarantorForm === selectedBooking.id ? (
                          <div className="space-y-2">
                            <input
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Friend's name"
                              value={guarantorName}
                              onChange={(e) => setGuarantorName(e.target.value)}
                            />
                            <input
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Friend's email"
                              value={guarantorEmail}
                              onChange={(e) => setGuarantorEmail(e.target.value)}
                            />
                            <input
                              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Phone (optional)"
                              value={guarantorPhone}
                              onChange={(e) => setGuarantorPhone(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="rounded-xl font-bold text-xs"
                                onClick={() => handleAddGuarantor(selectedBooking.id)}
                              >
                                <UserCheck className="w-3 h-3 mr-1" /> Confirm Guarantor
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl font-bold text-xs"
                                onClick={() => setShowGuarantorForm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => setShowGuarantorForm(selectedBooking.id)}
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Add Guarantor
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium">Not required for completed bookings</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Check-ins */}
              <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-primary-600" />
                    <h4 className="font-black text-xs uppercase tracking-widest">Check-ins</h4>
                    {selectedBooking.dueCheckins > 0 && (
                      <Badge className="bg-red-500 text-white border-none text-[8px] font-black px-1.5">
                        {selectedBooking.dueCheckins} due
                      </Badge>
                    )}
                  </div>

                  {selectedBooking.checkIns.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">No check-ins scheduled yet.</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {selectedBooking.checkIns.slice(-10).map((ci, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                          <div className="flex items-center gap-2">
                            {ci.status === 'ok' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : ci.status === 'issue' ? (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            ) : ci.status === 'no_response' ? (
                              <X className="w-3 h-3 text-gray-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-400" />
                            )}
                            <span className="font-bold text-gray-500">Week {ci.week}</span>
                          </div>
                          <span className="text-gray-400">{formatDate(ci.dueDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedBooking.status === 'active' && selectedBooking.dueCheckins > 0) && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="rounded-xl font-bold text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
                        onClick={() => handleCheckin(selectedBooking.id, 'ok')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Item is with me
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl font-bold text-xs border-red-200 text-red-600 hover:bg-red-50 flex-1"
                        onClick={() => handleCheckin(selectedBooking.id, 'issue')}
                      >
                        <AlertCircle className="w-3 h-3 mr-1" /> Report issue
                      </Button>
                    </div>
                  )}

                  {selectedBooking.status === 'active' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl font-bold text-xs text-blue-600 w-full"
                        onClick={() => handleComplete(selectedBooking.id)}
                      >
                        <Package className="w-3 h-3 mr-1" /> Return & Complete Rental
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 bg-transparent rounded-[40px] p-16 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-gray-500 uppercase text-sm tracking-tight">Select a Booking</h3>
                <p className="text-xs text-gray-400 font-medium">Click on a booking to see details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Past bookings full list */}
      {allBookings.length > 3 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-black uppercase tracking-tighter text-gray-400 mb-4">Booking History</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => fetchBookingDetail(booking.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{booking.itemName}</span>
                  <Badge className={`${statusColor(booking.status)} text-white border-none text-[8px] font-black uppercase`}>
                    {statusLabel(booking.status)}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`font-bold text-xs ${careScoreColor(booking.careScore)}`}>{booking.careScore}/100</span>
                  <ArrowRight className="w-3 h-3 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
