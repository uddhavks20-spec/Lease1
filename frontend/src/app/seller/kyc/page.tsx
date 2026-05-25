"use client"

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function SellerKYCPage() {
  const [kyc, setKyc] = useState<any>(null)
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
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/kyc/me', form)
    toast.success('KYC submitted for review')
  }

  return (
    <div className="container py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Seller KYC</h1>
      {kyc?.status && <div className="mb-4 text-sm">Current status: {kyc.status}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Aadhaar Number</label>
          <input className="input-field" value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} />
        </div>
        <div>
          <label className="label">PAN Number</label>
          <input className="input-field" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
        </div>
        <div>
          <label className="label">College ID</label>
          <input className="input-field" value={form.collegeId} onChange={(e) => setForm({ ...form, collegeId: e.target.value })} />
        </div>
        <div>
          <label className="label">Document Front URL</label>
          <input className="input-field" value={form.documentFrontUrl} onChange={(e) => setForm({ ...form, documentFrontUrl: e.target.value })} />
        </div>
        <div>
          <label className="label">Document Back URL</label>
          <input className="input-field" value={form.documentBackUrl} onChange={(e) => setForm({ ...form, documentBackUrl: e.target.value })} />
        </div>
        <div>
          <label className="label">Selfie URL</label>
          <input className="input-field" value={form.selfieUrl} onChange={(e) => setForm({ ...form, selfieUrl: e.target.value })} />
        </div>
        <Button type="submit">Submit KYC</Button>
      </form>
    </div>
  )
}
