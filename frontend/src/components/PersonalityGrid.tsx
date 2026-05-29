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
  scale?: number
  description: string
}

const PERSONALITIES: PersonalityCardData[] = [
  // Renters
  { id: 'saver',      name: 'The Saver',       motto: 'Long-term value over short-term gain',      category: 'RENTER', imagePath: '/images/personalities/saver.png',    accentColor: '#059669', description: 'Plans ahead and maximizes every rupee. Prefers longer commitments for better value and rarely impulse-rents.' },
  { id: 'trialer',    name: 'The Trialler',     motto: 'Try before you commit',                     category: 'RENTER', imagePath: '/images/personalities/trialer.png',  accentColor: '#7c3aed', scale: 0.7, description: 'Loves experimenting with premium gear before making purchase decisions. Always testing the latest and greatest.' },
  { id: 'flexer',     name: 'The Flexer',       motto: 'Affordable, quick, and easy',               category: 'RENTER', imagePath: '/images/personalities/flexer.png',   accentColor: '#d97706', description: 'Needs things fast and on a budget. No fuss, no frills — just functional rentals at the best price.' },
  { id: 'switcher',   name: 'The Switcher',     motto: 'Always switching it up',                    category: 'RENTER', imagePath: '/images/personalities/switcher.png', accentColor: '#0284c7', description: 'Gets bored easily and loves variety. Regularly rotates their setup with fresh items and new experiences.' },
  { id: 'missionary', name: 'The Missionary',   motto: 'Renting with purpose',                      category: 'RENTER', imagePath: '/images/personalities/missionary.png', accentColor: '#dc2626', description: 'Rents for specific projects or fixed periods. Knows exactly what they need and returns it right on time.' },
  { id: 'aspirer',    name: 'The Aspirer',      motto: 'Luxury experiences, smart prices',          category: 'RENTER', imagePath: '/images/personalities/aspirer.png',  accentColor: '#e11d48', description: 'Craves premium and luxury items but prefers renting over owning. Lives the high life for a fraction of the cost.' },
  // Sellers
  { id: 'declutter',  name: 'The Declutterer',  motto: 'Turn clutter into cash',                    category: 'SELLER', imagePath: '/images/personalities/declutter.png', accentColor: '#65a30d', description: 'Lists idle items gathering dust and turns them into passive income. Minimalist at heart, entrepreneur by nature.' },
  { id: 'upgrader',   name: 'The Upgrader',     motto: 'Fund your next upgrade',                    category: 'SELLER', imagePath: '/images/personalities/upgrader.png',  accentColor: '#7c3aed', description: 'Uses rental income to fund gear upgrades. Always cycling through newer, better equipment paid for by their listings.' },
  { id: 'collector',  name: 'The Collector',    motto: 'A curated collection for all',              category: 'SELLER', imagePath: '/images/personalities/collector.png', accentColor: '#c026d3', description: 'Curies a premium catalog of items for the community to enjoy. Takes pride in offering only the best.' },
  { id: 'mogul',      name: 'The Mogul',        motto: 'Building a rental empire',                  category: 'SELLER', imagePath: '/images/personalities/mogul.png',     accentColor: '#1d4ed8', description: 'Treats renting as a full-fledged business. Scales inventory, optimizes listings, and maximizes ROI across categories.' },
  { id: 'hobbyist',   name: 'The Hobbyist',     motto: 'Share when you spare',                      category: 'SELLER', imagePath: '/images/personalities/hobbyist.png',  accentColor: '#0891b2', description: 'Rents out gear during downtime instead of letting it sit idle. A passionate enthusiast who shares their hobby.' },
  { id: 'seasonal',   name: 'The Seasonal',     motto: 'Peak season profits',                       category: 'SELLER', imagePath: '/images/personalities/seasonal.png',  accentColor: '#ca8a04', description: 'Times the market perfectly — lists during high-demand seasons and withdraws when the wave settles. Always ahead of the curve.' },
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
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative group rounded-3xl border transition-colors duration-500 overflow-hidden p-6 sm:p-8 flex flex-col items-center cursor-default"
      style={{ backgroundColor: 'transparent', borderColor: hovered ? `${data.accentColor}66` : 'rgba(255,255,255,0.06)' }}
    >
      <div className="w-full flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          {data.category}
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
          style={{ borderColor: `${data.accentColor}44`, color: data.accentColor }}
        >
          {data.id.charAt(0).toUpperCase() + data.id.slice(1)}
        </span>
      </div>

      <div className="relative w-full flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
        <div
          className="absolute inset-0 blur-3xl scale-[2] transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at center, ${data.accentColor}44 0%, transparent 70%)`,
            opacity: hovered ? 0.6 : 0.25,
          }}
        />

        <Particles seed={index} />

        <div className="flex items-center justify-center w-full h-full" style={{ transform: `scale(${data.scale || 1.3})` }}>
          <motion.img
            src={data.imagePath}
            alt={data.name}
            className="w-full h-full object-contain drop-shadow-2xl"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.5 + (index % 2), repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.25, rotate: [0, -6, 6, 0], transition: { duration: 0.5, ease: 'easeOut' } }}
            draggable={false}
          />
        </div>
      </div>

      <div className="mt-5 sm:mt-6 text-center space-y-2 w-full">
        <h3
          className="text-base sm:text-lg font-black transition-all duration-500"
          style={{
            color: hovered ? 'transparent' : 'rgba(255,255,255,0.92)',
            backgroundImage: hovered ? `linear-gradient(135deg, ${data.accentColor}, #fff)` : undefined,
            WebkitBackgroundClip: hovered ? 'text' : undefined,
            backgroundClip: hovered ? 'text' : undefined,
          }}
        >
          {data.name}
        </h3>
        <p className="text-[12px] italic text-white/40 leading-relaxed">
          "{data.motto}"
        </p>
        <p className="text-[11px] text-white/25 leading-relaxed max-w-[240px] mx-auto line-clamp-3">
          {data.description}
        </p>
      </div>
    </motion.div>
  )
}

export function PersonalityGrid({ className = '' }: { className?: string }) {
  return (
    <section className={`w-full bg-neutral-950 py-16 sm:py-24 px-4 sm:px-6 lg:px-12 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30">
            Discover Your Type
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-3">
            Which Personality Are You?
          </h2>
          <p className="text-sm text-white/40 mt-3 max-w-lg mx-auto">
            Every renter and seller has a unique style. Find yours and own it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {PERSONALITIES.map((p, i) => (
            <PersonalityCard key={p.id} data={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export { PERSONALITIES }