"use client"

import { useRef, useState } from 'react'

const FLOAT_STYLES = `
@keyframes badgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes badgeGlow { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.15)} }
`

const PERSONALITY_SCALE: Record<string, number> = {
  trialler: 0.7,
}

const FILENAME_MAP: Record<string, string> = {
  saver: 'saver',
  trialler: 'trialer',
  flexer: 'flexer',
  switcher: 'switcher',
  missionary: 'missionary',
  aspirer: 'aspirer',
  declutterer: 'declutter',
  upgrader: 'upgrader',
  collector: 'collector',
  mogul: 'mogul',
  hobbyist: 'hobbyist',
  seasonal: 'seasonal',
}

export interface PersonalityInfo {
  id: string
  name: string
  motto: string
  icon: string
}

const PERSONALITY_COLORS: Record<string, { primary: string; secondary: string; ribbon: string }> = {
  saver:      { primary: '#059669', secondary: '#34d399', ribbon: 'bg-emerald-500' },
  trialler:   { primary: '#7c3aed', secondary: '#a78bfa', ribbon: 'bg-violet-500' },
  flexer:     { primary: '#d97706', secondary: '#fbbf24', ribbon: 'bg-amber-500' },
  switcher:   { primary: '#0284c7', secondary: '#38bdf8', ribbon: 'bg-sky-500' },
  missionary: { primary: '#dc2626', secondary: '#f87171', ribbon: 'bg-red-500' },
  aspirer:    { primary: '#e11d48', secondary: '#fb7185', ribbon: 'bg-rose-500' },
  declutterer: { primary: '#65a30d', secondary: '#a3e635', ribbon: 'bg-lime-500' },
  upgrader:    { primary: '#7c3aed', secondary: '#a78bfa', ribbon: 'bg-violet-500' },
  collector:   { primary: '#c026d3', secondary: '#e879f9', ribbon: 'bg-fuchsia-500' },
  mogul:       { primary: '#1d4ed8', secondary: '#60a5fa', ribbon: 'bg-blue-500' },
  hobbyist:    { primary: '#0891b2', secondary: '#22d3ee', ribbon: 'bg-cyan-500' },
  seasonal:    { primary: '#ca8a04', secondary: '#facc15', ribbon: 'bg-yellow-500' },
}

interface SellerReco {
  id: string
  name: string
  reason: string
}

const RENTER_DESCRIPTIONS: Record<string, string> = {
  saver: 'You are a strategic renter who thinks long-term. You evaluate every rental carefully, comparing costs and benefits before committing. You prefer quality items that serve you well over extended periods, and you rarely make impulse rental decisions. Your practical mindset makes you a low-risk, high-value customer for any seller.',
  trialler: 'You are an experimental renter who loves exploring new products before making purchase decisions. You see renting as a try-before-you-buy service that helps you make smarter choices. You are always on the lookout for the latest gear and premium experiences, making you an engaged and curious renter.',
  flexer: 'You are a practical, no-nonsense renter who needs things done quickly and affordably. You value convenience and efficiency over luxury, and you appreciate straightforward rental processes with minimal hassle. You know exactly what you need and go for it without overthinking.',
  switcher: 'You are a variety-seeker who loves keeping things fresh. You get excited about trying new items and regularly rotating your rentals. Boredom is your biggest enemy, and renting gives you the freedom to constantly evolve your environment without the commitment of ownership.',
  missionary: 'You are a purpose-driven renter who knows exactly what you need and when you need it. You rent for specific projects, events, or fixed periods, and you are meticulous about returning items on time. Your reliability and clarity make you a seller\'s ideal customer.',
  aspirer: 'You are an aspirational renter who loves luxury and premium experiences but prefers renting over paying full price. You believe in living well today and paying smartly for it. You are drawn to high-end items and exclusive products that elevate your lifestyle.',
}

const SELLER_RECOMMENDATIONS: Record<string, SellerReco[]> = {
  saver: [
    { id: 'declutter', name: 'The Declutterer', reason: 'Rent long-term from declutterers who want steady passive income from items just sitting around.' },
    { id: 'mogul', name: 'The Mogul', reason: 'Moguls offer reliable, well-maintained inventory perfect for extended rental periods.' },
    { id: 'hobbyist', name: 'The Hobbyist', reason: 'Hobbyists rent gear during downtime, giving you access to quality items at lower rates.' },
  ],
  trialler: [
    { id: 'collector', name: 'The Collector', reason: 'Collectors maintain curated, premium catalogs perfect for exploration and discovery.' },
    { id: 'upgrader', name: 'The Upgrader', reason: 'Upgraders constantly refresh their inventory, giving you access to the latest models.' },
    { id: 'seasonal', name: 'The Seasonal', reason: 'Seasonal sellers list unique items during peak times, great for trying something new.' },
  ],
  flexer: [
    { id: 'declutter', name: 'The Declutterer', reason: 'Declutterers offer affordable items with flexible terms — perfect for budget-conscious renters.' },
    { id: 'hobbyist', name: 'The Hobbyist', reason: 'Hobbyists are casual renters who offer competitive rates and straightforward transactions.' },
    { id: 'seasonal', name: 'The Seasonal', reason: 'Seasonal sellers often discount items to clear inventory, great for quick deals.' },
  ],
  switcher: [
    { id: 'collector', name: 'The Collector', reason: 'Collectors offer diverse, curated catalogs that satisfy your craving for variety.' },
    { id: 'seasonal', name: 'The Seasonal', reason: 'Seasonal sellers bring fresh inventory each cycle, keeping your options ever-changing.' },
    { id: 'upgrader', name: 'The Upgrader', reason: 'Upgraders cycle through new gear frequently, ensuring a constantly rotating selection.' },
  ],
  missionary: [
    { id: 'upgrader', name: 'The Upgrader', reason: 'Upgraders maintain quality gear in excellent condition, perfect for your specific needs.' },
    { id: 'mogul', name: 'The Mogul', reason: 'Moguls run professional operations with reliable availability and clear terms.' },
    { id: 'declutter', name: 'The Declutterer', reason: 'Declutterers offer straightforward rentals without complicated policies.' },
  ],
  aspirer: [
    { id: 'collector', name: 'The Collector', reason: 'Collectors curate premium, high-end items that match your luxury tastes.' },
    { id: 'mogul', name: 'The Mogul', reason: 'Moguls often carry premium inventory and offer white-glove service.' },
    { id: 'upgrader', name: 'The Upgrader', reason: 'Upgraders list top-condition gear that feels almost new.' },
  ],
}

interface PersonalityBadgeProps {
  type: string
  info: PersonalityInfo
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showRibbon?: boolean
  showAnimation?: boolean
  className?: string
}

export function PersonalityBadge({
  type,
  info,
  size = 'md',
  showRibbon = true,
  showAnimation = true,
  className = '',
}: PersonalityBadgeProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const colors = PERSONALITY_COLORS[type] || PERSONALITY_COLORS.saver
  const filename = FILENAME_MAP[type] || 'saver'
  const imgSrc = `/images/personalities/${filename}.png`

  const sizeMap = {
    sm: { card: 'w-32 h-36', imgSize: 'w-24 h-24', icon: 'text-2xl', name: 'text-xs', motto: 'text-[10px]' },
    md: { card: 'w-44 h-48', imgSize: 'w-32 h-32', icon: 'text-3xl', name: 'text-sm', motto: 'text-xs' },
    lg: { card: 'w-56 h-60', imgSize: 'w-40 h-40', icon: 'text-4xl', name: 'text-base', motto: 'text-sm' },
    xl: { card: 'w-72 h-80', imgSize: 'w-48 h-48', icon: 'text-5xl', name: 'text-xl', motto: 'text-base' },
  }

  const s = sizeMap[size]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -30
    setTilt({ x, y })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(500px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease' : 'none',
        backgroundColor: 'transparent',
      }}
      className={`relative ${s.card} rounded-2xl border border-white/10 flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <style>{FLOAT_STYLES}</style>

      {showRibbon && (
        <div className={`absolute top-0 right-0 ${colors.ribbon} text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg z-10`}>
          {info.id}
        </div>
      )}

      {showAnimation ? (
        <div className={`relative ${s.imgSize} mb-1 flex items-center justify-center`}>
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{ background: colors.primary, opacity: 0.3, animation: 'badgeGlow 2.5s ease-in-out infinite' }}
          />
          <img
            src={imgSrc}
            alt={info.name}
            className="relative w-full h-full object-contain drop-shadow-xl"
            style={{ transform: `scale(${PERSONALITY_SCALE[type] || 1.2})`, animation: 'badgeFloat 3s ease-in-out infinite' }}
          />
        </div>
      ) : (
        <span className={s.icon + ' mb-1'}>{info.icon}</span>
      )}

      <span className={`${s.name} font-black text-white/90 text-center leading-tight px-1`}>
        {info.name}
      </span>
      <span className={`${s.motto} text-white/40 text-center leading-tight px-1`}>
        {info.motto}
      </span>
    </div>
  )
}

export function PersonalityRibbon({ type, info, matchScore }: { type: string; info: PersonalityInfo; matchScore?: number | null }) {
  const colors = PERSONALITY_COLORS[type] || PERSONALITY_COLORS.saver

  const matchLabel = matchScore != null
    ? matchScore >= 3 ? 'Perfect Match' : matchScore >= 2 ? 'Good Fit' : matchScore >= 1 ? 'Fair' : 'Not Your Style'
    : null

  const matchColors = matchScore != null
    ? matchScore >= 3 ? 'bg-green-500' : matchScore >= 2 ? 'bg-blue-500' : matchScore >= 1 ? 'bg-amber-500' : 'bg-gray-400'
    : ''

  return (
    <div className="relative">
      <div className={`absolute top-0 left-0 ${colors.ribbon} text-white text-[7px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-br-lg z-10 flex items-center gap-1 shadow-lg`}>
        <span>{info.icon}</span>
        <span>{info.id}</span>
      </div>
      {matchLabel && (
        <div className={`absolute top-0 right-0 ${matchColors} text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg z-10 shadow-lg`}>
          {matchLabel}
        </div>
      )}
    </div>
  )
}

export { PERSONALITY_COLORS, RENTER_DESCRIPTIONS, SELLER_RECOMMENDATIONS }