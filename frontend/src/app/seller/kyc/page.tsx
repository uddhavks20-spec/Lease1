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
                <label className="text-sm font-bold block mb-1">Document Image URL</label>
                <input className="input-field" value={form.document_url} onChange={e => setForm({ ...form, document_url: e.target.value })} placeholder="https://..." />
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
                  <label className="text-sm font-bold block mb-1">Document Front URL</label>
                  <input className="input-field" value={form.documentFrontUrl} onChange={e => setForm({ ...form, documentFrontUrl: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Document Back URL</label>
                  <input className="input-field" value={form.documentBackUrl} onChange={e => setForm({ ...form, documentBackUrl: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-bold block mb-1">Selfie URL</label>
                  <input className="input-field" value={form.selfieUrl} onChange={e => setForm({ ...form, selfieUrl: e.target.value })} />
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
