"use client"

import { useRef, useState } from 'react'
import Lottie from 'lottie-react'

// Simple inline Lottie animation data — pulsing circle per personality
function getLottieData(primary: string, secondary: string) {
  return {
    v: '5.5.7',
    fr: 30,
    ip: 0,
    op: 60,
    layers: [{
      ddd: 0,
      ind: 1,
      ty: 4,
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [80, 80, 100], e: [110, 110, 100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
            { t: 30, s: [110, 110, 100], e: [80, 80, 100], i: { x: [0.42], y: [1] }, o: { x: [0.58], y: [0] } },
          ],
        },
      },
      shapes: [{
        ty: 'el',
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [60, 60] },
        it: [{
          ty: 'fl',
          c: { a: 0, k: hexToRgb(primary) },
          o: { a: 0, k: 30 },
        }, {
          ty: 'st',
          c: { a: 0, k: hexToRgb(secondary) },
          w: { a: 0, k: 3 },
          o: { a: 0, k: 60 },
        }],
      }],
    }],
  }
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export interface PersonalityInfo {
  id: string
  name: string
  motto: string
  icon: string
}

const PERSONALITY_COLORS: Record<string, { primary: string; secondary: string; ribbon: string }> = {
  // Renter
  saver:      { primary: '#059669', secondary: '#34d399', ribbon: 'bg-emerald-500' },
  trialler:   { primary: '#7c3aed', secondary: '#a78bfa', ribbon: 'bg-violet-500' },
  flexer:     { primary: '#d97706', secondary: '#fbbf24', ribbon: 'bg-amber-500' },
  switcher:   { primary: '#0284c7', secondary: '#38bdf8', ribbon: 'bg-sky-500' },
  missionary: { primary: '#dc2626', secondary: '#f87171', ribbon: 'bg-red-500' },
  aspirer:    { primary: '#e11d48', secondary: '#fb7185', ribbon: 'bg-rose-500' },
  // Seller
  declutterer: { primary: '#65a30d', secondary: '#a3e635', ribbon: 'bg-lime-500' },
  upgrader:    { primary: '#7c3aed', secondary: '#a78bfa', ribbon: 'bg-violet-500' },
  collector:   { primary: '#c026d3', secondary: '#e879f9', ribbon: 'bg-fuchsia-500' },
  mogul:       { primary: '#1d4ed8', secondary: '#60a5fa', ribbon: 'bg-blue-500' },
  hobbyist:    { primary: '#0891b2', secondary: '#22d3ee', ribbon: 'bg-cyan-500' },
  seasonal:    { primary: '#ca8a04', secondary: '#facc15', ribbon: 'bg-yellow-500' },
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
  showAnimation = false,
  className = '',
}: PersonalityBadgeProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const colors = PERSONALITY_COLORS[type] || PERSONALITY_COLORS.saver
  const lottieData = getLottieData(colors.primary, colors.secondary)

  const sizeMap = {
    sm: { card: 'w-24 h-28', icon: 'text-lg', name: 'text-[9px]', motto: 'text-[7px]' },
    md: { card: 'w-28 h-32', icon: 'text-xl', name: 'text-[10px]', motto: 'text-[8px]' },
    lg: { card: 'w-32 h-36', icon: 'text-2xl', name: 'text-xs', motto: 'text-[9px]' },
    xl: { card: 'w-40 h-44', icon: 'text-3xl', name: 'text-sm', motto: 'text-[10px]' },
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
      }}
      className={`relative ${s.card} rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      {showRibbon && (
        <div className={`absolute top-0 right-0 ${colors.ribbon} text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg z-10`}>
          {info.id}
        </div>
      )}

      {showAnimation ? (
        <div className="w-12 h-12 mb-1">
          <Lottie animationData={lottieData} loop autoplay />
        </div>
      ) : (
        <span className={s.icon + ' mb-1'}>{info.icon}</span>
      )}

      <span className={`${s.name} font-black text-gray-900 dark:text-white text-center leading-tight px-1`}>
        {info.name}
      </span>
      <span className={`${s.motto} text-gray-400 text-center leading-tight px-1`}>
        {info.motto}
      </span>
    </div>
  )
}

// Ribbon-only version for item cards (compact)
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

export { PERSONALITY_COLORS }
