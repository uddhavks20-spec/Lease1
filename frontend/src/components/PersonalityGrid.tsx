"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'

export interface PersonalityCardData {
  id: string
  name: string
  motto: string
  category: 'RENTER' | 'SELLER'
  imagePath: string
  accentColor: string
}

const PERSONALITIES: PersonalityCardData[] = [
  // Renters
  { id: 'saver',      name: 'The Saver',       motto: 'Long-term value over short-term gain',   category: 'RENTER', imagePath: '/images/personalities/saver.png',    accentColor: '#059669' },
  { id: 'trialer',    name: 'The Trialler',     motto: 'Try before you commit',                  category: 'RENTER', imagePath: '/images/personalities/trialer.png',  accentColor: '#7c3aed' },
  { id: 'flexer',     name: 'The Flexer',       motto: 'Affordable, quick, and easy',            category: 'RENTER', imagePath: '/images/personalities/flexer.png',   accentColor: '#d97706' },
  { id: 'switcher',   name: 'The Switcher',     motto: 'Always switching it up',                 category: 'RENTER', imagePath: '/images/personalities/switcher.png', accentColor: '#0284c7' },
  { id: 'missionary', name: 'The Missionary',   motto: 'Renting with purpose',                   category: 'RENTER', imagePath: '/images/personalities/missionary.png', accentColor: '#dc2626' },
  { id: 'aspirer',    name: 'The Aspirer',      motto: 'Luxury experiences, smart prices',       category: 'RENTER', imagePath: '/images/personalities/aspirer.png',  accentColor: '#e11d48' },
  // Sellers
  { id: 'declutter',  name: 'The Declutterer',  motto: 'Turn clutter into cash',                 category: 'SELLER', imagePath: '/images/personalities/declutter.png', accentColor: '#65a30d' },
  { id: 'upgrader',   name: 'The Upgrader',     motto: 'Fund your next upgrade',                 category: 'SELLER', imagePath: '/images/personalities/upgrader.png',  accentColor: '#7c3aed' },
  { id: 'collector',  name: 'The Collector',    motto: 'A curated collection for all',           category: 'SELLER', imagePath: '/images/personalities/collector.png', accentColor: '#c026d3' },
  { id: 'mogul',      name: 'The Mogul',        motto: 'Building a rental empire',               category: 'SELLER', imagePath: '/images/personalities/mogul.png',     accentColor: '#1d4ed8' },
  { id: 'hobbyist',   name: 'The Hobbyist',     motto: 'Share when you spare',                   category: 'SELLER', imagePath: '/images/personalities/hobbyist.png',  accentColor: '#0891b2' },
  { id: 'seasonal',   name: 'The Seasonal',     motto: 'Peak season profits',                    category: 'SELLER', imagePath: '/images/personalities/seasonal.png',  accentColor: '#ca8a04' },
]

function Particles({ seed }: { seed: number }) {
  const items = Array.from({ length: 5 }).map((_, i) => {
    const n = i + seed * 5
    return {
      left: 12 + ((n * 19) % 76),
      top: 8 + ((n * 13) % 78),
      size: 1.5 + (i % 3),
      delay: (n * 0.43) % 3.5,
      duration: 1.8 + (i % 3),
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 0.7, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

function PersonalityCard({ data, index }: { data: PersonalityCardData; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group rounded-3xl bg-white/[0.04] backdrop-blur-md border transition-colors duration-500 overflow-hidden p-5 sm:p-6 flex flex-col items-center cursor-default"
      style={{ borderColor: hovered ? `${data.accentColor}55` : 'rgba(255,255,255,0.06)' }}
    >
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 self-start mb-3">
        {data.category}
      </div>

      <div className="relative w-full aspect-square max-w-[160px] mx-auto flex items-center justify-center">
        <div
          className="absolute inset-0 blur-3xl scale-125 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at center, ${data.accentColor}44 0%, transparent 70%)`,
            opacity: hovered ? 0.6 : 0.25,
          }}
        />

        <Particles seed={index} />

        <motion.img
          src={data.imagePath}
          alt={data.name}
          className="relative w-full h-full object-contain drop-shadow-2xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3 + (index % 2), repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.15, rotate: [0, -4, 4, 0], transition: { duration: 0.5, ease: 'easeOut' } }}
          draggable={false}
        />
      </div>

      <div className="mt-4 sm:mt-5 text-center space-y-1">
        <h3
          className="text-sm font-black transition-all duration-500"
          style={{
            color: hovered ? 'transparent' : 'rgba(255,255,255,0.9)',
            backgroundImage: hovered ? `linear-gradient(135deg, ${data.accentColor}, #fff)` : undefined,
            WebkitBackgroundClip: hovered ? 'text' : undefined,
            backgroundClip: hovered ? 'text' : undefined,
          }}
        >
          {data.name}
        </h3>
        <p className="text-[11px] italic text-white/30 leading-relaxed">
          {data.motto}
        </p>
      </div>
    </motion.div>
  )
}

export function PersonalityGrid({ className = '' }: { className?: string }) {
  return (
    <section className={`w-full bg-neutral-950 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
            Discover Your Type
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Which Personality Are You?
          </h2>
          <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
            Every renter and seller has a unique style. Find yours and own it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {PERSONALITIES.map((p, i) => (
            <PersonalityCard key={p.id} data={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export { PERSONALITIES }