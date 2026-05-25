"use client"

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function RenterKYCPage() {
  const [kyc, setKyc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    aadhaarNumber: '',
    panNumber: '',
    collegeId: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    selfieUrl: '',
  })

  useEffect(() => {
    api.get('/kyc/me').then((res) => {
      setKyc(res.data.kyc)
      if (res.data.kyc) {
        setForm({
          aadhaarNumber: res.data.kyc.aadhaar_number || '',
          panNumber: res.data.kyc.pan_number || '',
          collegeId: res.data.kyc.college_id || '',
          documentFrontUrl: res.data.kyc.document_front_url || '',
          documentBackUrl: res.data.kyc.document_back_url || '',
          selfieUrl: res.data.kyc.selfie_url || '',
        })
      }
    }).finally(() => setLoading(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/kyc/me', form)
      toast.success('KYC submitted for review')
    } catch (err) {
      toast.error('Failed to submit KYC')
    }
  }

  if (loading) return <div className="container py-20 text-center">Loading KYC status...</div>

  return (
    <div className="container py-12 max-w-2xl">
      <div className="space-y-1 mb-10">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">KYC Verification</h1>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Verify your identity to start renting</p>
      </div>

      {kyc?.status && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${
          kyc.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : 
          kyc.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-700' : 
          'bg-amber-50 border-amber-100 text-amber-700'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            kyc.status === 'approved' ? 'bg-green-500 text-white' : 
            kyc.status === 'rejected' ? 'bg-red-500 text-white' : 
            'bg-amber-500 text-white'
          }`}>
            {kyc.status === 'approved' ? '✓' : kyc.status === 'rejected' ? '!' : '...'}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest">Current Status</p>
            <p className="font-bold text-sm uppercase">{kyc.status}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aadhaar Number</label>
            <input 
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
              value={form.aadhaarNumber} 
              onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} 
              placeholder="12-digit number"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">PAN Number</label>
            <input 
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
              value={form.panNumber} 
              onChange={(e) => setForm({ ...form, panNumber: e.target.value })} 
              placeholder="ABCDE1234F"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">College ID</label>
          <input 
            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
            value={form.collegeId} 
            onChange={(e) => setForm({ ...form, collegeId: e.target.value })} 
            placeholder="e.g. 210543"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Document Front URL</label>
            <input 
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
              value={form.documentFrontUrl} 
              onChange={(e) => setForm({ ...form, documentFrontUrl: e.target.value })} 
              placeholder="Image URL"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Document Back URL</label>
            <input 
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
              value={form.documentBackUrl} 
              onChange={(e) => setForm({ ...form, documentBackUrl: e.target.value })} 
              placeholder="Image URL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Selfie URL</label>
          <input 
            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
            value={form.selfieUrl} 
            onChange={(e) => setForm({ ...form, selfieUrl: e.target.value })} 
            placeholder="Image URL"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-200 uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98]"
          disabled={kyc?.status === 'approved'}
        >
          {kyc?.status === 'approved' ? 'Verification Complete' : 'Submit KYC for Review'}
        </Button>
      </form>
    </div>
  )
}
