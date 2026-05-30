"use client"

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Building2, FileText, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function WholesalerKYCPage() {
  const [kyc, setKyc] = useState<any>(null)
  const [form, setForm] = useState({
    businessName: '',
    gstNumber: '',
    businessAddress: '',
    businessRegistrationUrl: '',
    gstCertificateUrl: '',
    panCardUrl: '',
    bankAccountNumber: '',
    ifscCode: ''
  })

  useEffect(() => {
    api.get('/wholesaler/kyc').then((res) => {
      setKyc(res.data.kyc)
      if (res.data.kyc) {
        setForm({
          businessName: res.data.kyc.business_name || '',
          gstNumber: res.data.kyc.gst_number || '',
          businessAddress: res.data.kyc.business_address || '',
          businessRegistrationUrl: res.data.kyc.business_registration_url || '',
          gstCertificateUrl: res.data.kyc.gst_certificate_url || '',
          panCardUrl: res.data.kyc.pan_card_url || '',
          bankAccountNumber: res.data.kyc.bank_account_number || '',
          ifscCode: res.data.kyc.ifsc_code || ''
        })
      }
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.businessName || !form.gstNumber) {
      toast.error('Missing paperwork 📄')
      return
    }
    try {
      await api.post('/wholesaler/kyc', form)
      toast.success('Waiting on the NPCs ⏳')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed 📤')
    }
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Wholesaler KYC</h1>
        <p className="text-gray-500 font-medium mt-1">Complete your business verification to start supplying on Lease</p>
      </div>

      {kyc?.status && (
        <div className={`p-4 rounded-2xl mb-6 flex items-center gap-3 ${
          kyc.status === 'approved' ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 border border-green-200' :
          kyc.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border border-red-200' :
          'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 border border-amber-200'
        }`}>
          <ShieldCheck className={`w-5 h-5 ${
            kyc.status === 'approved' ? 'text-green-500' :
            kyc.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
          }`} />
          <div>
            <p className="font-bold text-sm uppercase">Status: {kyc.status}</p>
            {kyc.rejection_reason && <p className="text-xs mt-0.5">Reason: {kyc.rejection_reason}</p>}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
          <h2 className="font-black text-lg uppercase tracking-tighter flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" /> Business Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Business Name *</label>
              <input className="input-field" placeholder="e.g. Kishan Electronics" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">GST Number *</label>
              <input className="input-field" placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Business Address</label>
            <textarea className="input-field min-h-[80px]" placeholder="Full business address" value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
          <h2 className="font-black text-lg uppercase tracking-tighter flex items-center gap-2"><FileText className="w-5 h-5 text-primary-600" /> Document Uploads</h2>
          <p className="text-[10px] text-gray-400 font-medium">Upload document images</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Business Registration</label>
              <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-primary-500 transition-all">
                {form.businessRegistrationUrl ? (
                  <div className="relative">
                    <img src={form.businessRegistrationUrl} alt="Registration" className="max-h-24 mx-auto rounded-lg" />
                    <button type="button" onClick={() => setForm({ ...form, businessRegistrationUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                  </div>
                ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setForm({ ...form, businessRegistrationUrl: ev.target?.result as string }); r.readAsDataURL(f); }} />
              </label>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">GST Certificate</label>
              <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-primary-500 transition-all">
                {form.gstCertificateUrl ? (
                  <div className="relative">
                    <img src={form.gstCertificateUrl} alt="GST" className="max-h-24 mx-auto rounded-lg" />
                    <button type="button" onClick={() => setForm({ ...form, gstCertificateUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                  </div>
                ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setForm({ ...form, gstCertificateUrl: ev.target?.result as string }); r.readAsDataURL(f); }} />
              </label>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">PAN Card</label>
              <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-primary-500 transition-all">
                {form.panCardUrl ? (
                  <div className="relative">
                    <img src={form.panCardUrl} alt="PAN" className="max-h-24 mx-auto rounded-lg" />
                    <button type="button" onClick={() => setForm({ ...form, panCardUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                  </div>
                ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => setForm({ ...form, panCardUrl: ev.target?.result as string }); r.readAsDataURL(f); }} />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
          <h2 className="font-black text-lg uppercase tracking-tighter flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-600" /> Bank Details (for Payouts)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Account Number</label>
              <input className="input-field" placeholder="Bank account number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">IFSC Code</label>
              <input className="input-field" placeholder="SBIN0001234" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
          <div className="text-xs text-primary-800 dark:text-primary-300">
            <p className="font-bold">Need help with your KYC?</p>
            <p className="mt-1">Contact us at <strong>kishanuddhav2004@gmail.com</strong> or call <strong>+91 9336185009</strong> for assistance with your business verification.</p>
          </div>
        </div>

        <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl uppercase tracking-[0.2em]">Submit KYC for Verification</Button>
      </form>
    </div>
  )
}
