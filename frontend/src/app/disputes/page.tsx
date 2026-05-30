"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { AlertTriangle, MessageSquare, Plus, ChevronRight, Clock, Shield, CheckCircle2, XCircle, Search } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  escalated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes')
      setDisputes(res.data.disputes)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchDisputes() }, [])

  const openDispute = async (dispute: any) => {
    setSelected(dispute)
    const res = await api.get(`/disputes/${dispute.id}`)
    setMessages(res.data.messages)
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await api.post(`/disputes/${selected.id}/messages`, { message: newMessage })
    setNewMessage('')
    const res = await api.get(`/disputes/${selected.id}`)
    setMessages(res.data.messages)
    toast.success('Chat updated 💬')
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disputes</h1>
            <p className="text-gray-500">Manage your disputes and raise concerns</p>
          </div>
        </div>
        <Link href="/disputes/new">
          <Button variant="outline" className="border-red-600 text-red-600">
            <Plus className="h-4 w-4 mr-2" />Raise Dispute
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* List */}
        <div className="lg:col-span-5 space-y-3">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No disputes yet</p>
              </CardContent>
            </Card>
          ) : disputes.map(d => (
            <Card key={d.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selected?.id === d.id ? 'ring-2 ring-primary-500' : ''}`} onClick={() => openDispute(d)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{d.item_title || 'Item'}</span>
                      <Badge className={(STATUS_STYLES[d.status] || '') + ' text-[10px] capitalize'}>{d.status?.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Type: {d.type} · {new Date(d.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">{d.title || d.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-7">
          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selected.title || selected.type}</CardTitle>
                  <Badge className={(STATUS_STYLES[selected.status] || '') + ' capitalize'}>{selected.status?.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-gray-500">{selected.item_title} · {new Date(selected.created_at).toLocaleDateString()}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                  <p className="text-sm font-bold mb-1">Description</p>
                  <p className="text-sm text-gray-600">{selected.description}</p>
                  {selected.amount_involved > 0 && (
                    <p className="text-sm font-bold mt-2">Amount involved: ₹{selected.amount_involved}</p>
                  )}
                  {selected.resolution && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <p className="text-sm font-bold text-green-700">Resolution</p>
                      <p className="text-sm text-green-600">{selected.resolution}</p>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages ({messages.length})
                  </h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No messages yet</p>
                    ) : messages.map((m: any) => (
                      <div key={m.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {m.display_name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{m.display_name || 'User'}</span>
                            <span className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-sm">{m.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                {selected.status !== 'resolved' && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 input-field"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a dispute to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
