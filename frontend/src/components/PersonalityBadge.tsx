"use client"

import { useRef, useState } from 'react'

const CHAR_STYLES = `
@keyframes charBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes charSway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes charPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
@keyframes charSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes charNod { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(4deg)} 75%{transform:rotate(-4deg)} }
@keyframes charFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes charSweep { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }
@keyframes charBounceUp { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} 50%{transform:translateY(-3px)} }
@keyframes charRock { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-4deg)} 75%{transform:rotate(4deg)} }
@keyframes charConfident { 0%,100%{transform:translateY(0)} 25%{transform:translateY(-3px)} 75%{transform:translateY(-1px)} }
@keyframes charHeadNod { 0%,100%{transform:rotate(0deg)} 15%{transform:rotate(3deg)} 30%{transform:rotate(0deg)} 45%{transform:rotate(3deg)} 60%{transform:rotate(0deg)} }
@keyframes charBounce { 0%,100%{transform:translateY(0) scale(1,1)} 30%{transform:translateY(-6px) scale(1,0.95)} 50%{transform:translateY(-2px)} }
`

interface CharConfig {
  anim: string
  body: (c: string) => React.ReactNode
}

function BaseFace({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle cx={cx - 8} cy={cy - 4} r="4" fill="white" />
      <circle cx={cx + 8} cy={cy - 4} r="4" fill="white" />
      <circle cx={cx - 7} cy={cy - 5} r="2" fill="#1a1a2e" />
      <circle cx={cx + 9} cy={cy - 5} r="2" fill="#1a1a2e" />
      <ellipse cx={cx - 16} cy={cy + 2} rx="5" ry="2.5" fill="currentColor" opacity="0.3" />
      <ellipse cx={cx + 16} cy={cy + 2} rx="5" ry="2.5" fill="currentColor" opacity="0.3" />
      <path d={`M ${cx - 4} ${cy + 3} Q ${cx} ${cy + 7} ${cx + 4} ${cy + 3}`} fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

function BodyBlob({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <ellipse cx={cx} cy={cy} rx="18" ry="22" fill={color} opacity="0.88" />
}

function Coin({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <ellipse cx="0" cy="0" rx="8" ry="5" fill="#FFD700" />
      <ellipse cx="0" cy="0" rx="5" ry="3" fill="#FFED4A" />
      <circle cx="0" cy="0" r="2" fill="#DAA520" />
    </g>
  )
}

function TestTube({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <rect x="-2" y="-10" width="4" height="12" rx="1" fill="rgba(255,255,255,0.5)" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="0" cy="3" r="3" fill="none" stroke="#A78BFA" strokeWidth="1" />
      <rect x="-1" y="-6" width="2" height="6" rx="1" fill="#C084FC" />
    </g>
  )
}

function Bicep({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <path d="M -4,-6 Q 6,-8 8,-2 Q 10,4 4,6" fill="none" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="4" cy="5" r="2.5" fill="#FBBF24" />
    </g>
  )
}

function CycleArrows({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <path d="M -4,0 A 5,5 0 1,1 4,4" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="4,0 6,5 1,3" fill="#38BDF8" />
    </g>
  )
}

function Target({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <circle cx="0" cy="0" r="8" fill="none" stroke="#F87171" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="5" fill="none" stroke="#F87171" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="2" fill="#F87171" />
    </g>
  )
}

function Star({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <polygon points="0,-9 2,-3 8,-3 3,1 5,7 0,3 -5,7 -3,1 -8,-3 -2,-3" fill="#FB7185" />
    </g>
  )
}

function Broom({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <rect x="-1" y="-10" width="2" height="12" rx="0.5" fill="#A3E635" transform="rotate(-15)" />
      <path d="M -4,2 L 4,2 M -4,4 L 4,4 M -4,6 L 4,6" stroke="#65A30D" strokeWidth="1.5" />
    </g>
  )
}

function UpArrow({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <rect x="-1" y="-2" width="2" height="10" rx="0.5" fill="#A78BFA" />
      <polygon points="-4,0 0,-6 4,0" fill="#A78BFA" />
    </g>
  )
}

function Sparkle({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#E879F9" />
    </g>
  )
}

function Briefcase({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <rect x="-5" y="-4" width="10" height="8" rx="1" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="-2" y="-7" width="4" height="3" rx="1" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
    </g>
  )
}

function MusicNote({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <circle cx="2" cy="5" r="3" fill="#22D3EE" />
      <rect x="4" y="-4" width="2" height="9" rx="0.5" fill="#22D3EE" />
      <path d="M 4,-4 Q 8,-6 10,-2" fill="none" stroke="#22D3EE" strokeWidth="1.5" />
    </g>
  )
}

function Confetti({ tx, ty }: { tx: number; ty: number }) {
  return (
    <g transform={`translate(${tx},${ty})`}>
      <rect x="-6" y="0" width="3" height="3" rx="0.5" fill="#FACC15" transform="rotate(-20)" />
      <rect x="2" y="-4" width="2.5" height="2.5" rx="0.5" fill="#FACC15" transform="rotate(30)" />
      <polygon points="0,-8 1,-5 3,-4 1,-3 0,0 -1,-3 -3,-4 -1,-5" fill="#FACC15" />
    </g>
  )
}

const CHAR_CONFIG: Record<string, CharConfig> = {
  saver: {
    anim: 'charBob 2s ease-in-out infinite',
    body: (_c) => <Coin tx={74} ty={44} />,
  },
  trialler: {
    anim: 'charSway 2.5s ease-in-out infinite',
    body: (_c) => <TestTube tx={74} ty={42} />,
  },
  flexer: {
    anim: 'charPulse 1.8s ease-in-out infinite',
    body: (_c) => <Bicep tx={74} ty={46} />,
  },
  switcher: {
    anim: 'charSpin 3s linear infinite',
    body: (_c) => <CycleArrows tx={76} ty={44} />,
  },
  missionary: {
    anim: 'charNod 2.2s ease-in-out infinite',
    body: (_c) => <Target tx={74} ty={44} />,
  },
  aspirer: {
    anim: 'charFloat 2.4s ease-in-out infinite',
    body: (_c) => <Star tx={74} ty={36} />,
  },
  declutterer: {
    anim: 'charSweep 2.6s ease-in-out infinite',
    body: (_c) => <Broom tx={76} ty={44} />,
  },
  upgrader: {
    anim: 'charBounceUp 1.6s ease-in-out infinite',
    body: (_c) => <UpArrow tx={74} ty={40} />,
  },
  collector: {
    anim: 'charRock 3s ease-in-out infinite',
    body: (_c) => <Sparkle tx={76} ty={38} />,
  },
  mogul: {
    anim: 'charConfident 2s ease-in-out infinite',
    body: (_c) => <Briefcase tx={74} ty={44} />,
  },
  hobbyist: {
    anim: 'charHeadNod 2s ease-in-out infinite',
    body: (_c) => <MusicNote tx={76} ty={38} />,
  },
  seasonal: {
    anim: 'charBounce 1.4s ease-in-out infinite',
    body: (_c) => <Confetti tx={76} ty={38} />,
  },
}

function PersonalityCharacter({ type, color }: { type: string; color: string }) {
  const cfg = CHAR_CONFIG[type] || CHAR_CONFIG.saver

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color }}>
      <g style={{ animation: cfg.anim, transformOrigin: '50px 50px' }}>
        <BodyBlob cx={50} cy={54} color={color} />
        <BaseFace cx={50} cy={52} />
        {cfg.body(color)}
      </g>
    </svg>
  )
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
      <style>{CHAR_STYLES}</style>

      {showRibbon && (
        <div className={`absolute top-0 right-0 ${colors.ribbon} text-white text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-lg z-10`}>
          {info.id}
        </div>
      )}

      {showAnimation ? (
        <div className="w-12 h-12 mb-1">
          <PersonalityCharacter type={type} color={colors.primary} />
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