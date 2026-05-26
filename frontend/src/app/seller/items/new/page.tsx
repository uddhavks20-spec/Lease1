"use client"

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Calculator, ChevronDown, PackageCheck, Shield } from 'lucide-react'
import { LeaseBot } from '@/components/LeaseBot'
import { mockProductsData, MockProduct } from '@/data/mockProductsData'

// Constants for Pricing Logic
const CONDITION_MULTIPLIERS: Record<string, number> = {
  'Brand New': 1.0,
  'Like New': 0.85,
  'Good': 0.70,
  'Fair': 0.55,
}

const CONDITION_OPTIONS = ['Brand New', 'Like New', 'Good', 'Fair']

export default function NewItemPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  
  const [selectedProductId, setSelectedProductId] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    cityId: '',
    originalPrice: 0,
    condition: 'Like New',
    monthlyRent: 0,
    depositAmount: 0,
    minRentDuration: 3,
    maxRentDuration: 12,
    subAttributes: {} as Record<string, string>,
    imageUrl: ''
  })

  const [manualRentOverride, setManualRentOverride] = useState(false)
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({})

  // Image & video state
  const [imageViews, setImageViews] = useState<Record<string, string>>({
    Front: '',
    Rear: '',
    Left: '',
    Right: ''
  })
  const [videoUrl, setVideoUrl] = useState('')

  // Product verification state
  const [verification, setVerification] = useState({
    purchaseReceiptUrl: '',
    serialNumber: '',
    originalBoxPhotoUrl: '',
    damagePhotoUrl: '',
    notes: ''
  })

  const handleImageUpload = (view: string, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageViews(prev => ({ ...prev, [view]: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleVerificationImage = (field: string, file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setVerification(prev => ({ ...prev, [field]: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories))
    api.get('/cities').then((res) => setCities(res.data.cities))
  }, [])

  const selectedProduct = useMemo(() => 
    mockProductsData.find(p => p.id === selectedProductId),
    [selectedProductId]
  )

  // Sync category and image when product changes
  useEffect(() => {
    if (selectedProduct) {
      const cat = categories.find(c => c.name.includes(selectedProduct.category.split(' ')[0]))
      setForm(prev => ({
        ...prev,
        title: selectedProduct.title,
        categoryId: cat?.id || prev.categoryId,
        imageUrl: selectedProduct.imageUrl,
        subAttributes: {}
      }))
      setManualRentOverride(false)
    }
  }, [selectedProduct, categories])

  // Background Pricing Logic (RentoMojo Model)
  useEffect(() => {
    if (!form.originalPrice || !selectedProduct) return

    // 1. Base Value = Original Price * Condition Modifier
    const conditionMult = CONDITION_MULTIPLIERS[form.condition] || 0.85
    const baseValue = form.originalPrice * conditionMult

    // 2. True Market Value (V_true) = Base Value * Product of weights
    let attrWeight = 1.0
    let dynamicImage = selectedProduct.imageUrl

    selectedProduct.attributes.forEach(attr => {
      const selectedLabel = form.subAttributes[attr.name]
      const option = attr.options.find(o => o.label === selectedLabel)
      if (option) {
        attrWeight *= option.weight
        if (option.imageUrl) dynamicImage = option.imageUrl
      } else if (selectedLabel === 'Other') {
        // Behavioral analysis of custom input
        const customVal = (customAttributes[attr.name] || '').toLowerCase()
        if (customVal.includes('pro') || customVal.includes('premium') || customVal.includes('ultra') || customVal.includes('max')) {
          attrWeight *= 1.25 // Premium tier bonus
        } else if (customVal.includes('lite') || customVal.includes('basic') || customVal.includes('mini') || customVal.includes('standard')) {
          attrWeight *= 0.85 // Economy tier reduction
        } else {
          attrWeight *= 1.0 // Neutral weight for unknown custom values
        }
      }
    })
    const vTrue = baseValue * attrWeight

    // 3. Base Rent (12-Month Anchor) = V_true / 12
    const suggestedRent = Math.round(vTrue / 12)

    // 4. Dynamic Security Deposit = Exactly 100% of 1 Month's Rent
    const currentRent = manualRentOverride ? form.monthlyRent : suggestedRent
    const dynamicDeposit = currentRent

    setForm(prev => ({
      ...prev,
      depositAmount: dynamicDeposit,
      monthlyRent: manualRentOverride ? prev.monthlyRent : suggestedRent,
      imageUrl: dynamicImage
    }))
  }, [form.originalPrice, form.condition, form.monthlyRent, form.subAttributes, selectedProduct, manualRentOverride, customAttributes])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId || !form.cityId) {
      toast.error('Please select category and city')
      return
    }

    // Build images array from uploaded views
    const images: any[] = []
    let hasPrimary = false
    Object.entries(imageViews).forEach(([view, dataUrl]) => {
      if (dataUrl) {
        if (!hasPrimary) {
          images.push({ dataUrl, is_primary: true, view })
          hasPrimary = true
        } else {
          images.push({ dataUrl, is_primary: false, view })
        }
      }
    })

    if (images.length === 0) {
      toast.error('Please upload at least one product image')
      return
    }

    try {
      const finalizedSubAttributes = { ...form.subAttributes }
      Object.keys(finalizedSubAttributes).forEach(key => {
        if (finalizedSubAttributes[key] === 'Other') {
          finalizedSubAttributes[key] = customAttributes[key] || 'Custom'
        }
      })

      const res = await api.post('/items', {
        ...form,
        subAttributes: finalizedSubAttributes,
        images,
        videoUrl: videoUrl || undefined,
        purchaseReceiptUrl: verification.purchaseReceiptUrl || undefined,
        serialNumber: verification.serialNumber || undefined,
        originalBoxPhotoUrl: verification.originalBoxPhotoUrl || undefined,
        damagePhotoUrl: verification.damagePhotoUrl || undefined,
        verificationNotes: verification.notes || undefined,
      })
      toast.success('Item created successfully!')
      router.push(`/items/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create item')
    }
  }

  return (
    <div className="container py-10 max-w-5xl">
      <LeaseBot role="seller" />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
          <PackageCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Lender Portal</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Turn assets into cashflow</p>
        </div>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-12 gap-10">
        {/* Left Column: Selection & Specs */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-sm bg-white dark:bg-gray-800 rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Product Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">What are you listing?</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 appearance-none cursor-pointer transition-all"
                    value={selectedProductId} 
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    <option value="">Choose a product template...</option>
                    {mockProductsData.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] block">Preview</label>
                    <div className="aspect-square relative rounded-[24px] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 group">
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] block">Technical Specs</label>
                    <div className="space-y-4">
                      {selectedProduct.attributes.map((attr) => (
                        <div key={attr.name}>
                          <label className="text-[10px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wider">{attr.name}</label>
                          <div className="flex flex-wrap gap-2">
                            {attr.options.map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => setForm(prev => ({
                                  ...prev,
                                  subAttributes: { ...prev.subAttributes, [attr.name]: opt.label }
                                }))}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                                  form.subAttributes[attr.name] === opt.label
                                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100'
                                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-primary-500'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({
                                ...prev,
                                subAttributes: { ...prev.subAttributes, [attr.name]: 'Other' }
                              }))}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border-2 ${
                                form.subAttributes[attr.name] === 'Other'
                                ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-100'
                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-400 hover:border-amber-500'
                              }`}
                            >
                              Other
                            </button>
                          </div>
                          
                          {form.subAttributes[attr.name] === 'Other' && (
                            <div className="mt-3 animate-in zoom-in-95 duration-200">
                              <input 
                                type="text"
                                placeholder={`Enter custom ${attr.name.toLowerCase()}...`}
                                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-2 ring-primary-500/20 focus:ring-primary-500 transition-all"
                                value={customAttributes[attr.name] || ''}
                                onChange={(e) => setCustomAttributes(prev => ({
                                  ...prev,
                                  [attr.name]: e.target.value
                                }))}
                                required
                              />
                              <p className="text-[9px] text-amber-600 font-bold mt-1 uppercase tracking-tighter italic">
                                * Pricing engine will analyze this value
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Location</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 appearance-none cursor-pointer"
                      value={form.cityId} 
                      onChange={(e) => setForm({ ...form, cityId: e.target.value })}
                      required
                    >
                      <option value="">Select City</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Duration Policy</label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl">
                    <input 
                      type="number" 
                      className="w-12 bg-white dark:bg-gray-800 border-none rounded-xl py-1.5 text-center text-xs font-black" 
                      value={form.minRentDuration} 
                      onChange={(e) => setForm({ ...form, minRentDuration: Number(e.target.value) })}
                    />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Min Months</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing Engine */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-2xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-800 rounded-[40px] overflow-hidden sticky top-24">
            <CardHeader className="bg-gray-900 text-white p-10">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary-500" />
                Pricing Engine
              </CardTitle>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Asset Valuation Model v2.0</p>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Original Purchase Price (₹)</label>
                <input 
                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-6 py-4 text-2xl font-black text-primary-600 outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all" 
                  type="number" 
                  placeholder="0.00"
                  value={form.originalPrice || ''} 
                  onChange={(e) => {
                    setForm({ ...form, originalPrice: Number(e.target.value) });
                    setManualRentOverride(false);
                  }} 
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Condition Modifier</label>
                <div className="grid grid-cols-2 gap-3">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, condition: opt });
                        setManualRentOverride(false);
                      }}
                      className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        form.condition === opt 
                        ? 'bg-primary-50 border-primary-600 text-primary-600 shadow-sm' 
                        : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-gray-700 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Monthly Rent (₹)</label>
                    <p className="text-[10px] font-bold text-primary-600 uppercase mt-0.5">Lender Listed Price</p>
                  </div>
                  <input 
                    className={`w-36 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl px-5 py-3 text-right font-black text-2xl outline-none ring-2 ${manualRentOverride ? 'ring-amber-500 text-amber-600' : 'ring-transparent text-gray-900 dark:text-white'} focus:ring-primary-500 transition-all`}
                    type="number" 
                    value={form.monthlyRent || ''} 
                    onChange={(e) => {
                      setForm({ ...form, monthlyRent: Number(e.target.value) });
                      setManualRentOverride(true);
                    }} 
                  />
                </div>

                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                  <div>
                    <label className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-[0.2em] block">Security Deposit (₹)</label>
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400/70 uppercase mt-0.5 italic">1:1 Rental Match</p>
                  </div>
                  <input 
                    className="w-36 bg-white/50 dark:bg-black/20 border-none rounded-2xl px-5 py-3 text-right font-black text-2xl text-blue-900 dark:text-blue-200 outline-none cursor-not-allowed"
                    type="number"
                    value={form.depositAmount || ''}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl space-y-3 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Your Monthly Payout (95%)</span>
                  <span className="text-green-600">₹{Math.floor(form.monthlyRent * 0.95)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Platform Fee (5%)</span>
                  <span>₹{Math.ceil(form.monthlyRent * 0.05)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
                  <span>Renter Pays (Rent + 5%)</span>
                  <span className="text-primary-600">₹{Math.ceil(form.monthlyRent * 1.05)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button type="submit" className="w-full h-20 text-xl font-black rounded-[24px] shadow-2xl shadow-primary-200 uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Publish Listing
                </Button>
                <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
                  <Shield className="w-3 h-3 text-green-500" />
                  Secured by Escrow & 10% Spread Policy
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

