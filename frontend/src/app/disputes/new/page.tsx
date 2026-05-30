"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

export default function NewDisputePage() {
  const router = useRouter()
  const [rentals, setRentals] = useState<any[]>([])
  const [form, setForm] = useState({ rentalId: '', type: 'damage', description: '', title: '', amount_involved: '' })

  useEffect(() => {
    api.get('/rentals?status=active,completed').then(res => {
      setRentals(res.data.rentals || [])
    }).catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/disputes', {
        ...form,
        amount_involved: form.amount_involved ? parseFloat(form.amount_involved) : undefined,
      })
      toast.success('Clan war initiated ⚠️')
      router.push(`/disputes`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Dispute rejected ⚠️')
    }
  }

  return (
    <div className="container py-10 max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Raise a Dispute</h1>
          <p className="text-gray-500">Report an issue with a rental</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-bold block mb-1">Rental</label>
              <select className="input-field" required value={form.rentalId} onChange={e => setForm({ ...form, rentalId: e.target.value })}>
                <option value="">Select a rental...</option>
                {rentals.map(r => (
                  <option key={r.id} value={r.id}>{r.item_title || 'Item'} - {new Date(r.created_at).toLocaleDateString()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="damage">Damage</option>
                <option value="non_payment">Non-Payment</option>
                <option value="quality">Quality Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Title</label>
              <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief title" />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Description</label>
              <textarea className="input-field" rows={4} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Amount Involved (₹, optional)</label>
              <input className="input-field" type="number" min="0" value={form.amount_involved} onChange={e => setForm({ ...form, amount_involved: e.target.value })} />
            </div>
            <Button type="submit">Submit Dispute</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
