"use client";

import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, MapPin, Truck, ShieldCheck, CreditCard, ChevronLeft, Smartphone, Wallet, Banknote, Percent, Zap, Shield, Lock, Sparkles, AlertTriangle, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { cart, totalMonthlyRent, totalDeposit, totalDamageWaiver, updateDamageWaiver, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    altPhoneNumber: "",
    pincode: "",
    flatHouseNo: "",
    areaStreet: "",
    landmark: "",
    city: "Kanpur",
    state: "Uttar Pradesh",
    hostelName: "",
    roomNumber: "",
    addressType: "hostel", // hostel, home, office
  });

  const [paymentMethod, setPaymentMethod] = useState("upi"); // upi, card, netbanking, paylater, lease_credit
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [agreedToKYC, setAgreedToKYC] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTheftPolicy, setAgreedToTheftPolicy] = useState(false);

  const DAMAGE_WAIVER_FEE = 200
  const totalPayableNow = totalMonthlyRent + totalDeposit + totalDamageWaiver;

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/cart");
    }
  }, [cart, router]);

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setIsVerifying(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    setIsVerifying(false);
    setShowOTP(false);
    proceedToPayment();
  };

  const handleCheckout = async () => {
    if (!address.fullName || !address.phoneNumber || !address.pincode || !address.flatHouseNo || !address.areaStreet) {
      toast.error("Please fill in all mandatory delivery details");
      return;
    }

    if (address.addressType === 'hostel' && (!address.hostelName || !address.roomNumber)) {
      toast.error("Please provide Hostel and Room details for campus delivery");
      return;
    }

    if (!agreedToKYC || !agreedToTerms) {
      toast.error("Please agree to KYC policy and Terms of Service");
      return;
    }

    if (!agreedToTheftPolicy) {
      toast.error("Please acknowledge the theft & non-return policy");
      return;
    }

    // Trigger OTP first for security
    setShowOTP(true);
    toast.success("OTP sent to your mobile number");
  };

  const proceedToPayment = async () => {
    setLoading(true);
    try {
      const item = cart[0];
      const deliveryAddress = `
        ${address.fullName}, 
        ${address.flatHouseNo}, ${address.areaStreet}, 
        ${address.addressType === 'hostel' ? `${address.hostelName}, Room ${address.roomNumber}, ` : ''}
        ${address.landmark ? `Landmark: ${address.landmark}, ` : ''}
        ${address.city}, ${address.state} - ${address.pincode}
      `.replace(/\s+/g, ' ').trim();

      const deliveryNotes = `Phone: ${address.phoneNumber}${address.altPhoneNumber ? `, Alt: ${address.altPhoneNumber}` : ''} | Method: ${paymentMethod}`;

      const damageWaiver = item.damageWaiver || false
      const res = await api.post("/rentals", {
        itemId: item.id,
        durationMonths: item.duration,
        deliveryAddress,
        deliveryNotes,
        damageWaiver,
        theftAcknowledged: agreedToTheftPolicy,
      });

      const { order } = res.data;
      
      // If Lease Credit or Pay Later, we simulate success immediately
      if (paymentMethod === 'lease_credit' || paymentMethod === 'paylater') {
        await new Promise(r => setTimeout(r, 2000));
        toast.success(`Order placed using ${paymentMethod === 'lease_credit' ? 'Lease Credit' : 'Pay Later'}!`);
        clearCart();
        router.push("/renter/dashboard");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock",
        amount: order.amount,
        currency: order.currency,
        name: "Lease",
        description: "Initial Rental Payment",
        order_id: order.id,
        handler: function (response: any) {
          toast.success("Payment successful! Order confirmed.");
          clearCart();
          router.push("/renter/dashboard");
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phoneNumber,
        },
        theme: { color: "#2563eb" },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error("Razorpay SDK not loaded. Please try again.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Unable to process order");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="container py-12 max-w-7xl">
      <Link href="/cart" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary-600 mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Column: Delivery & Details */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Checkout</h1>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Complete your order details</p>
          </div>

          {/* Contact Information */}
          <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Email Address</label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mobile Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-4 rounded-l-2xl bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 text-gray-500 font-bold text-sm">+91</span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-r-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                      value={address.phoneNumber}
                      onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Alternate Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="Secondary mobile number"
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.altPhoneNumber}
                    onChange={(e) => setAddress({ ...address, altPhoneNumber: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pincode *</label>
                  <input
                    type="text"
                    placeholder="208016"
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">City</label>
                  <input
                    disabled
                    value={address.city}
                    className="w-full bg-gray-100 dark:bg-gray-900/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">State</label>
                  <input
                    disabled
                    value={address.state}
                    className="w-full bg-gray-100 dark:bg-gray-900/50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flat, House no., Building, Apartment *</label>
                <input
                  type="text"
                  placeholder="e.g. House No. 123, Block B"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.flatHouseNo}
                    onChange={(e) => setAddress({ ...address, flatHouseNo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Area, Colony, Street, Sector *</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Kanpur Campus"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.areaStreet}
                    onChange={(e) => setAddress({ ...address, areaStreet: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Health Centre"
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Save Address As</label>
                <div className="flex gap-4">
                  {[
                    { id: 'hostel', label: 'Hostel' },
                    { id: 'home', label: 'Home' },
                    { id: 'office', label: 'Office' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAddress({ ...address, addressType: type.id })}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        address.addressType === type.id 
                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                        : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-primary-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {address.addressType === 'hostel' && (
                <div className="grid sm:grid-cols-2 gap-6 p-6 bg-primary-50 dark:bg-primary-900/10 rounded-3xl animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Hostel / Hall *</label>
                    <select
                      className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all appearance-none"
                      value={address.hostelName}
                      onChange={(e) => setAddress({ ...address, hostelName: e.target.value })}
                    >
                      <option value="">Select Hostel</option>
                      <option value="Hall 1">Hall 1</option>
                      <option value="Hall 2">Hall 2</option>
                      <option value="Hall 3">Hall 3</option>
                      <option value="Hall 4">Hall 4</option>
                      <option value="Hall 5">Hall 5</option>
                      <option value="Hall 6">Hall 6</option>
                      <option value="Hall 7">Hall 7</option>
                      <option value="Hall 8">Hall 8</option>
                      <option value="Hall 9">Hall 9</option>
                      <option value="Hall 10">Hall 10</option>
                      <option value="Hall 11">Hall 11</option>
                      <option value="Hall 12">Hall 12</option>
                      <option value="Hall 13">Hall 13</option>
                      <option value="Girls Hostel 1">Girls Hostel 1</option>
                      <option value="Girls Hostel 2">Girls Hostel 2</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Room Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 204"
                      className="w-full bg-white dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                      value={address.roomNumber}
                      onChange={(e) => setAddress({ ...address, roomNumber: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary-600" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'upi', label: 'UPI (PhonePe, Google Pay)', icon: Smartphone, desc: 'Instant & Secure' },
                  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'All major banks supported' },
                  { id: 'netbanking', label: 'Net Banking', icon: Banknote, desc: 'Safe & Direct' },
                  { id: 'paylater', label: 'Pay Later', icon: Zap, desc: 'Simple Pay in 15 days' }
                ].map((method) => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      paymentMethod === method.id 
                      ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/20 shadow-lg' 
                      : 'border-gray-50 dark:border-gray-900 hover:border-primary-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      paymentMethod === method.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-900 text-gray-500'
                    }`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-black text-sm uppercase tracking-tight ${paymentMethod === method.id ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
                        {method.label}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lease Credit (Slice-style) Option */}
              <div
                onClick={() => setPaymentMethod('lease_credit')}
                className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all relative overflow-hidden group ${
                  paymentMethod === 'lease_credit' 
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xl' 
                  : 'border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-600'
                }`}
              >
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-yellow-300 text-indigo-900 border-none font-black uppercase text-[8px] animate-bounce">Best for Students</Badge>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    paymentMethod === 'lease_credit' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
                  }`}>
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-xl font-black uppercase tracking-tighter ${paymentMethod === 'lease_credit' ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>
                        Lease Credit
                      </h4>
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">SLICE IN 3</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500">Pay 1/3rd now, and the rest in 2 easy installments at 0% interest. Instant approval for campus students.</p>
                  </div>
                </div>
                {/* Decorative background for credit option */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-colors" />
              </div>
            </CardContent>
          </Card>

          {/* Damage Waiver & Theft Protection */}
          <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-600" />
                Protection & Insurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Covers accidental damage up to 50% of MRV. Theft & non-return: full MRV charged.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateDamageWaiver(item.id, !item.damageWaiver)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.damageWaiver ? 'bg-primary-600' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${item.damageWaiver ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Damage Waiver — <span className="text-primary-600">₹{DAMAGE_WAIVER_FEE}/mo</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Theft & Non-Return Policy</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Items not returned within 30 days past the due date are considered stolen. 
                    Full MRV (retail price) will be charged to the renter. Deposit may be deducted 
                    and the seller is compensated. Always return items on time to avoid penalties.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all" onClick={() => setAgreedToTheftPolicy(!agreedToTheftPolicy)}>
                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreedToTheftPolicy ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                  {agreedToTheftPolicy && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">I understand the theft & non-return policy.</p>
                  <p className="text-[10px] text-gray-500">I agree that non-return beyond 30 days will result in full MRV charge.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Policies */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all" onClick={() => setAgreedToKYC(!agreedToKYC)}>
              <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreedToKYC ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                {agreedToKYC && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">I agree to complete the KYC process within 24 hours of placing the order.</p>
                <p className="text-[10px] text-gray-500">KYC is mandatory for all high-value rentals at IIT Kanpur.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-all" onClick={() => setAgreedToTerms(!agreedToTerms)}>
              <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${agreedToTerms ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                {agreedToTerms && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">I agree to the Terms of Service and Rental Agreement.</p>
                <p className="text-[10px] text-gray-500">Including damage policy, late payment fees, and return conditions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Pay */}
        <div className="lg:col-span-4">
          <Card className="border-none bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[40px] overflow-hidden sticky top-24">
            <div className="p-8 space-y-8">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Payment Details</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Initial Amount</p>
              </div>

              <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 py-2 border-b border-gray-50 dark:border-gray-700 last:border-none">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                      <Image 
                        src={item.image || '/images/placeholder.png'} 
                        alt={item.title} 
                        fill
                        className="object-contain" 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-gray-900 dark:text-white text-xs line-clamp-1">{item.title}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.duration}m Tenure</span>
                        <span className="font-black text-gray-900 dark:text-white text-xs">
                          {formatCurrency(Number(item.monthly_rent) + Number(item.deposit_amount))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold">Total Monthly Rent</span>
                  <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalMonthlyRent)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold">Refundable Deposit</span>
                  <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalDeposit)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 font-bold">Delivery & Setup</span>
                  <span className="font-black text-green-600 uppercase">Free</span>
                </div>
                {totalDamageWaiver > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Damage Waiver</span>
                    <span className="font-black text-gray-900 dark:text-white">{formatCurrency(totalDamageWaiver)}/mo</span>
                  </div>
                )}
                
                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Payable Now</div>
                    <div className="text-2xl md:text-3xl font-black text-primary-600">{formatCurrency(totalPayableNow)}</div>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold italic">* Security deposit is 100% refundable at the end of tenure.</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <Button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Processing..." : <>Pay & Confirm <ArrowRight className="ml-3 h-6 w-6" /></>}
                </Button>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span className="text-[10px] font-black text-green-900 dark:text-green-400 uppercase tracking-widest">Student Protection</span>
                  </div>
                  <p className="text-[9px] text-green-700 dark:text-green-500/80 font-medium">Your money is held in escrow until delivery is confirmed.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTP && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-none bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">
            <div className="p-10 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-3xl flex items-center justify-center mx-auto">
                  <Lock className="w-10 h-10 text-primary-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Security Check</h3>
                  <p className="text-sm text-gray-500 font-medium">Enter the 6-digit code sent to <span className="font-bold text-gray-900 dark:text-white">+91 {address.phoneNumber}</span></p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-6 text-3xl font-black tracking-[0.5em] text-center outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                
                <div className="space-y-4">
                  <Button 
                    onClick={verifyOTP}
                    disabled={isVerifying || otp.length !== 6}
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isVerifying ? "Verifying..." : "Verify & Pay"}
                  </Button>
                  <button 
                    onClick={() => { setShowOTP(false); setOTP(""); }}
                    className="w-full text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary-600 transition-colors"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End-to-End Encrypted</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
