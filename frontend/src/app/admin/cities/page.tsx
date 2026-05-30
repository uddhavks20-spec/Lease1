"use client"
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { Plus, MapPin, Building2, Users, Power } from 'lucide-react'

interface City {
  id: string
  name: string
  state: string
  is_active: boolean
  coverage_area: string
  colleges: string[]
  estimated_users: number
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', state: '', coverage_area: '', colleges: '', estimated_users: '0' })

  const fetchCities = async () => {
    try {
      const res = await api.get('/admin/cities')
      setCities(res.data.cities)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchCities() }, [])

  const createCity = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/cities', {
        name: form.name,
        state: form.state,
        coverage_area: form.coverage_area,
        colleges: form.colleges.split(',').map((s: string) => s.trim()).filter(Boolean),
        estimated_users: parseInt(form.estimated_users) || 0,
      })
      toast.success('City unlocked 🏙️')
      setShowCreate(false)
      setForm({ name: '', state: '', coverage_area: '', colleges: '', estimated_users: '0' })
      fetchCities()
    } catch { toast.error('Expansion failed 🏙️') }
  }

  const toggleCity = async (id: string, active: boolean) => {
    await api.patch(`/admin/cities/${id}`, { is_active: !active })
    fetchCities()
  }

  if (loading) return <div className="container py-20 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>

  return (
    <div className="container py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">City Management</h1>
          <p className="text-gray-500">Manage expansion cities and coverage areas</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}><Plus className="h-4 w-4 mr-2" />Add City</Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={createCity} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold block mb-1">City Name</label>
                <input className="input-field" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Lucknow" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">State</label>
                <input className="input-field" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Uttar Pradesh" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Coverage Area</label>
                <input className="input-field" value={form.coverage_area} onChange={e => setForm({ ...form, coverage_area: e.target.value })} placeholder="IIT Kanpur, HBTU" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Colleges (comma separated)</label>
                <input className="input-field" value={form.colleges} onChange={e => setForm({ ...form, colleges: e.target.value })} placeholder="IIT Kanpur, HBTU" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Estimated Users</label>
                <input className="input-field" type="number" value={form.estimated_users} onChange={e => setForm({ ...form, estimated_users: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="submit">Add City</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map(city => (
          <Card key={city.id} className={city.is_active ? '' : 'opacity-50'}>
            <CardContent className="py-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{city.name}</h3>
                    <p className="text-sm text-gray-500">{city.state}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleCity(city.id, city.is_active)}>
                  <Power className={`h-4 w-4 ${city.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                {city.coverage_area && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />{city.coverage_area}
                  </p>
                )}
                <p className="text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />{city.estimated_users} estimated users
                </p>
                {city.colleges?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {city.colleges.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
