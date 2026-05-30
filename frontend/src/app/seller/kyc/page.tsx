"use client"
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Shield, Upload, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

const DOCUMENT_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'driving_license', label: "Driver's License" },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'student_id', label: 'Student ID' },
]

function handleFileUpload(file: File | null, callback: (dataUrl: string) => void) {
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => callback(e.target?.result as string)
  reader.readAsDataURL(file)
}

export default function SellerKYCPage() {
  const [kyc, setKyc] = useState<any>(null)
  const [form, setForm] = useState({
    document_type: 'aadhaar',
    document_number: '',
    document_url: '',
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
          document_type: res.data.kyc.document_type || 'aadhaar',
          document_number: res.data.kyc.document_number || '',
          document_url: res.data.kyc.document_url || '',
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

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Clock className="h-5 w-5 text-amber-500" />
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
    return <Badge className={map[status] || ''}>{status}</Badge>
  }

  return (
    <div className="container py-10 max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
          <Shield className="h-7 w-7 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller KYC Verification</h1>
          <p className="text-gray-500">Verify your identity to start renting on Lease</p>
        </div>
      </div>

      {kyc?.status && (
        <Card className={kyc.status === 'approved' ? 'border-green-200 bg-green-50/50' : kyc.status === 'rejected' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'}>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusIcon(kyc.status)}
              <div>
                <p className="font-bold">
                  {kyc.status === 'approved' ? 'KYC Verified' : kyc.status === 'rejected' ? 'KYC Rejected' : 'KYC Pending Review'}
                </p>
                {kyc.rejection_reason && <p className="text-sm text-red-600">Reason: {kyc.rejection_reason}</p>}
              </div>
            </div>
            {statusBadge(kyc.status)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identity Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-1">Document Type</label>
                <select className="input-field" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })}>
                  {DOCUMENT_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Document Number</label>
                <input className="input-field" value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} placeholder="Enter document number" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Document Image</label>
                <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:border-primary-500 transition-all">
                  {form.document_url ? (
                    <div className="relative">
                      <img src={form.document_url} alt="Document" className="max-h-32 mx-auto rounded-lg" />
                      <button type="button" onClick={() => setForm({ ...form, document_url: '' })} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">✕</button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Click to Upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0] || null, (url) => setForm({ ...form, document_url: url }))} />
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-bold mb-4 text-sm text-gray-500 uppercase tracking-widest">Legacy Fields (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold block mb-1">Aadhaar Number</label>
                  <input className="input-field" value={form.aadhaarNumber} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">PAN Number</label>
                  <input className="input-field" value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">College ID</label>
                  <input className="input-field" value={form.collegeId} onChange={e => setForm({ ...form, collegeId: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Document Front</label>
                  <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary-500 transition-all">
                    {form.documentFrontUrl ? (
                      <div className="relative">
                        <img src={form.documentFrontUrl} alt="Front" className="max-h-24 mx-auto rounded-lg" />
                        <button type="button" onClick={() => setForm({ ...form, documentFrontUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                      </div>
                    ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0] || null, (url) => setForm({ ...form, documentFrontUrl: url }))} />
                  </label>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Document Back</label>
                  <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary-500 transition-all">
                    {form.documentBackUrl ? (
                      <div className="relative">
                        <img src={form.documentBackUrl} alt="Back" className="max-h-24 mx-auto rounded-lg" />
                        <button type="button" onClick={() => setForm({ ...form, documentBackUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                      </div>
                    ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0] || null, (url) => setForm({ ...form, documentBackUrl: url }))} />
                  </label>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Selfie</label>
                  <label className="block w-full cursor-pointer bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary-500 transition-all">
                    {form.selfieUrl ? (
                      <div className="relative">
                        <img src={form.selfieUrl} alt="Selfie" className="max-h-24 mx-auto rounded-lg" />
                        <button type="button" onClick={() => setForm({ ...form, selfieUrl: '' })} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold">✕</button>
                      </div>
                    ) : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Upload</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0] || null, (url) => setForm({ ...form, selfieUrl: url }))} />
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              {kyc?.status === 'approved' ? 'Update KYC' : 'Submit for Verification'}
            </Button>

            {kyc?.status === 'rejected' && (
              <p className="text-sm text-amber-600 flex items-center gap-1 mt-2">
                <AlertCircle className="h-4 w-4" />
                Your previous submission was rejected. Please submit corrected documents.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
