"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PersonalityBadge, RENTER_DESCRIPTIONS, SELLER_RECOMMENDATIONS, type PersonalityInfo } from '@/components/PersonalityBadge'
import { PersonalityQuiz } from '@/components/PersonalityQuiz'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  User, Sparkles, LayoutDashboard, Bell, ShieldCheck, CreditCard,
  Store, Package, LogOut, Trash2, ChevronRight, ArrowRight,
  ChevronLeft, Wallet, Pencil
} from 'lucide-react'

const SIDEBAR_ITEMS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'personality', label: 'Renter Personality', icon: Sparkles },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'subscriptions', label: 'Subscriptions', icon: Bell },
  { key: 'kyc', label: 'KYC', icon: ShieldCheck },
  { key: 'lease-money', label: 'Lease Money', icon: Wallet },
  { key: 'seller', label: 'Seller Account', icon: Store },
  { key: 'wholesaler', label: 'Wholesaler Account', icon: Package },
  { key: 'logout', label: 'Log Out', icon: LogOut },
  { key: 'delete', label: 'Delete Account', icon: Trash2 },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, refreshUser } = useAuth()
  const [activeSection, setActiveSection] = useState('profile')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [renterPersonality, setRenterPersonality] = useState<string | null>(null)
  const [renterInfo, setRenterInfo] = useState<PersonalityInfo | null>(null)
  const [personalityLoading, setPersonalityLoading] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '' })
  const [saving, setSaving] = useState(false)

  const [kyc, setKyc] = useState<any>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycForm, setKycForm] = useState({
    aadhaarNumber: '', panNumber: '', collegeId: '',
    documentFrontUrl: '', documentBackUrl: '', selfieUrl: '',
  })

  const [sellerRole, setSellerRole] = useState<string | null>(null)
  const [sellerForm, setSellerForm] = useState({ phone: '', businessName: '' })
  const [sellerLoading, setSellerLoading] = useState(false)

  const [wholesalerForm, setWholesalerForm] = useState({ businessName: '', gstNumber: '', phone: '' })
  const [wholesalerLoading, setWholesalerLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  useEffect(() => {
    api.get('/personality/renter').then((res) => {
      if (res.data.personality) {
        setRenterPersonality(res.data.personality)
        setRenterInfo(res.data.info)
      }
    }).catch(() => {}).finally(() => setPersonalityLoading(false))
  }, [])

  useEffect(() => {
    if (activeSection === 'kyc') {
      setKycLoading(true)
      api.get('/kyc/me').then((res) => {
        setKyc(res.data.kyc)
        if (res.data.kyc) {
          setKycForm({
            aadhaarNumber: res.data.kyc.aadhaar_number || '',
            panNumber: res.data.kyc.pan_number || '',
            collegeId: res.data.kyc.college_id || '',
            documentFrontUrl: res.data.kyc.document_front_url || '',
            documentBackUrl: res.data.kyc.document_back_url || '',
            selfieUrl: res.data.kyc.selfie_url || '',
          })
        }
      }).finally(() => setKycLoading(false))
    }
  }, [activeSection])

  useEffect(() => {
    if (activeSection === 'seller' && user) {
      api.get('/users/me/roles').then((res) => {
        setSellerRole(res.data.roles?.includes('seller') ? 'seller' : null)
      }).catch(() => {})
    }
  }, [activeSection, user])

  const updateProfile = async () => {
    setSaving(true)
    try {
      await api.patch('/users/me', editForm)
      toast.success('Profile updated')
      setEditMode(false)
      refreshUser()
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const submitKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/kyc/me', kycForm)
      toast.success('KYC submitted for review')
      setKyc((prev: any) => ({ ...prev, status: 'pending' }))
    } catch { toast.error('Failed to submit KYC') }
  }

  const handleSellerRegister = async () => {
    setSellerLoading(true)
    try {
      const res = await api.post('/users/me/add-role', { role: 'seller' })
      localStorage.setItem('token', res.data.token)
      toast.success('Seller account created!')
      setSellerRole('seller')
      refreshUser()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create seller account')
    } finally { setSellerLoading(false) }
  }

  const handleWholesalerRegister = async () => {
    setWholesalerLoading(true)
    try {
      const res = await api.post('/users/me/add-role', { role: 'wholesaler' })
      localStorage.setItem('token', res.data.token)
      toast.success('Wholesaler account created!')
      refreshUser()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create wholesaler account')
    } finally { setWholesalerLoading(false) }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return
    try {
      await api.delete('/users/me')
      toast.success('Account deleted')
      logout()
      router.push('/')
    } catch { toast.error('Failed to delete account') }
  }

  const renderSidebar = () => (
    <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 shrink-0`}>
      <div className="sticky top-24 space-y-1">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          const isDanger = item.key === 'logout' || item.key === 'delete'
          return (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all text-sm font-bold ${
                activeSection === item.key
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 shadow-sm'
                  : isDanger
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          )
        })}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-gray-600 text-xs"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${!sidebarOpen && 'rotate-180'}`} />
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Profile</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Your account details</p>
            </div>

            <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px]">
              <CardContent className="p-8">
                {editMode ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">First Name</label>
                        <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Name</label>
                        <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Email</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent opacity-60" value={user?.email || ''} disabled />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={updateProfile} disabled={saving} className="rounded-xl">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)} className="rounded-xl">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                        <User className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">{user?.role}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: '' })
                        setEditMode(true)
                      }} className="rounded-xl">
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">XP Points</p>
                        <p className="font-bold text-gray-900 dark:text-white">{user?.xpPoints || 0}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Level</p>
                        <p className="font-bold text-gray-900 dark:text-white">{user?.level || 'Beginner'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Renter Personality</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Your rental style & preferences</p>
            </div>

            {showQuiz ? (
              <PersonalityQuiz
                mode="renter"
                onComplete={(personality) => {
                  setShowQuiz(false)
                  setRenterPersonality(personality)
                  api.get('/personality/renter').then((res) => {
                    if (res.data.personality) {
                      setRenterPersonality(res.data.personality)
                      setRenterInfo(res.data.info)
                    }
                  }).catch(() => {})
                }}
                onSkip={() => setShowQuiz(false)}
              />
            ) : personalityLoading ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
              </Card>
            ) : renterPersonality && renterInfo ? (
              <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px]">
                <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
                  <PersonalityBadge type={renterPersonality} info={renterInfo} size="xl" showRibbon />
                  <div className="space-y-3 max-w-lg">
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">You are a</p>
                    <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{renterInfo.name}</h3>
                    <p className="text-gray-400 italic text-sm sm:text-base">"{renterInfo.motto}"</p>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {RENTER_DESCRIPTIONS[renterPersonality]}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowQuiz(true)} className="rounded-xl">
                    <Pencil className="h-4 w-4 mr-2" /> Retake Quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-12 text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">No personality set yet</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">Take a quick quiz to define your renter style.</p>
                </div>
                <Button onClick={() => setShowQuiz(true)} className="rounded-xl">
                  <Sparkles className="h-4 w-4 mr-2" /> Take the Quiz
                </Button>
              </Card>
            )}
            {renterPersonality && SELLER_RECOMMENDATIONS[renterPersonality] && (
              <div className="mt-8 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-tighter text-gray-900 dark:text-white">
                    Recommended Sellers For You
                  </h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    Seller personalities that match your renter style
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {SELLER_RECOMMENDATIONS[renterPersonality].map((reco) => (
                    <Card key={reco.id} className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/50 rounded-2xl">
                      <CardContent className="p-5 space-y-2 text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
                          {reco.id}
                        </span>
                        <h4 className="font-black text-gray-900 dark:text-white text-sm">{reco.name}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{reco.reason}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Dashboard</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Quick access to your panels</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {['renter', 'seller', 'wholesaler', ...(user?.role === 'admin' ? ['admin'] : [])].map((role) => (
                  <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px] hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="p-8 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{role} Dashboard</p>
                        <h3 className="text-lg font-black text-gray-900 dark:text-white capitalize mt-1">{role} Panel</h3>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-primary-600 transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )

      case 'subscriptions':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Subscriptions</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Manage your subscriptions</p>
            </div>
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-16 text-center space-y-4">
              <Bell className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Subscription management will be available soon. Stay tuned!</p>
            </Card>
          </div>
        )

      case 'kyc':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">KYC Verification</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Verify your identity</p>
            </div>

            {kycLoading ? (
              <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
              </Card>
            ) : (
              <>
                {kyc?.status && (
                  <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
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
                      <p className="text-xs font-black uppercase tracking-widest">Status</p>
                      <p className="font-bold text-sm uppercase">{kyc.status}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={submitKyc} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Aadhaar Number</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.aadhaarNumber} onChange={(e) => setKycForm({ ...kycForm, aadhaarNumber: e.target.value })} placeholder="12-digit number" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">PAN Number</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.panNumber} onChange={(e) => setKycForm({ ...kycForm, panNumber: e.target.value })} placeholder="ABCDE1234F" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">College ID</label>
                    <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.collegeId} onChange={(e) => setKycForm({ ...kycForm, collegeId: e.target.value })} placeholder="e.g. 210543" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Document Front URL</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.documentFrontUrl} onChange={(e) => setKycForm({ ...kycForm, documentFrontUrl: e.target.value })} placeholder="Image URL" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Document Back URL</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.documentBackUrl} onChange={(e) => setKycForm({ ...kycForm, documentBackUrl: e.target.value })} placeholder="Image URL" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Selfie URL</label>
                    <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" value={kycForm.selfieUrl} onChange={(e) => setKycForm({ ...kycForm, selfieUrl: e.target.value })} placeholder="Image URL" />
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-black rounded-2xl shadow-xl uppercase tracking-[0.2em]" disabled={kyc?.status === 'approved'}>
                    {kyc?.status === 'approved' ? 'Verification Complete' : 'Submit KYC for Review'}
                  </Button>
                </form>
              </>
            )}
          </div>
        )

      case 'lease-money':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Lease Money</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Your credit & payment plans</p>
            </div>
            <Card className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[32px] p-16 text-center space-y-4">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Coming Soon</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">Lease Money — our built-in credit system with BNPL installments — is coming soon. Stay tuned!</p>
            </Card>
          </div>
        )

      case 'seller':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Seller Account</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Start selling on Lease1</p>
            </div>

            {sellerRole ? (
              <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px]">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                    <Store className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Seller Account Active</h3>
                  <p className="text-sm text-gray-500">You already have a seller account.</p>
                  <Link href="/seller/dashboard">
                    <Button className="rounded-xl">Go to Seller Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px]">
                <CardContent className="p-8 space-y-6">
                  <p className="text-sm text-gray-500">Create a seller account with your current email ({user?.email}) to start listing items for rent.</p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phone Number</label>
                      <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={sellerForm.phone} onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })} placeholder="+91" />
                    </div>
                    <Button onClick={handleSellerRegister} disabled={sellerLoading} className="w-full h-14 text-lg font-black rounded-2xl uppercase tracking-[0.2em]">
                      {sellerLoading ? 'Creating...' : 'Register as Seller'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 'wholesaler':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Wholesaler Account</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Bulk supply & wholesale</p>
            </div>

            <Card className="border-none bg-white dark:bg-gray-800 shadow-sm rounded-[32px]">
              <CardContent className="p-8 space-y-6">
                <p className="text-sm text-gray-500">Register as a wholesaler with your current email ({user?.email}).</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Business Name</label>
                    <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={wholesalerForm.businessName} onChange={(e) => setWholesalerForm({ ...wholesalerForm, businessName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">GST Number</label>
                    <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={wholesalerForm.gstNumber} onChange={(e) => setWholesalerForm({ ...wholesalerForm, gstNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phone Number</label>
                    <input className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500" value={wholesalerForm.phone} onChange={(e) => setWholesalerForm({ ...wholesalerForm, phone: e.target.value })} placeholder="+91" />
                  </div>
                  <Button onClick={handleWholesalerRegister} disabled={wholesalerLoading} className="w-full h-14 text-lg font-black rounded-2xl uppercase tracking-[0.2em]">
                    {wholesalerLoading ? 'Creating...' : 'Register as Wholesaler'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'logout':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Log Out</h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sign out of your account</p>
            </div>
            <Card className="border-2 border-red-100 dark:border-red-900/20 rounded-[32px] p-12 text-center space-y-6">
              <LogOut className="h-12 w-12 text-red-400 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Ready to leave?</h3>
                <p className="text-sm text-gray-500">You'll be signed out of your account.</p>
              </div>
              <Button onClick={handleLogout} className="rounded-xl bg-red-600 hover:bg-red-700 text-white h-14 px-12 font-black uppercase tracking-widest">
                Log Out
              </Button>
            </Card>
          </div>
        )

      case 'delete':
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tighter">Delete Account</h2>
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest">This action is irreversible</p>
            </div>
            <Card className="border-2 border-red-200 dark:border-red-900/20 rounded-[32px] p-12 text-center space-y-6">
              <Trash2 className="h-12 w-12 text-red-400 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Permanently delete your account?</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">All your data, listings, and rental history will be permanently removed.</p>
              </div>
              {!deleteConfirm ? (
                <Button onClick={() => setDeleteConfirm(true)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white h-14 px-12 font-black uppercase tracking-widest">
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-4 max-w-sm mx-auto">
                  <p className="text-xs text-red-600 font-bold">Type DELETE to confirm</p>
                  <input className="w-full bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 text-center" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Type DELETE" />
                  <div className="flex gap-3">
                    <Button onClick={() => { setDeleteConfirm(false); setDeleteText('') }} variant="outline" className="rounded-xl flex-1">Cancel</Button>
                    <Button onClick={handleDeleteAccount} disabled={deleteText !== 'DELETE'} className="rounded-xl bg-red-600 hover:bg-red-700 text-white flex-1 font-black uppercase tracking-widest">
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container py-10">
        <div className="flex gap-8">
          {renderSidebar()}
          <div className="flex-1 min-w-0 max-w-3xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
