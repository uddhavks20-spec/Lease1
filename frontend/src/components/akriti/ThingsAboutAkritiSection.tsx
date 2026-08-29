"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface ThingsAboutAkritiSectionProps {
  data: {
    favorites: Array<{ key: string; label: string; value: string; icon: string }>;
    observations: string[];
  };
  reduceMotion: boolean;
}

const catStickers = ["🐱", "😺", "😸", "😻", "🐈", "😽", "🙀", "😹", "😼", "🐱‍👤"];

export default function ThingsAboutAkritiSection({ data, reduceMotion }: ThingsAboutAkritiSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const scatteredStickers = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    emoji: catStickers[Math.floor(Math.random() * catStickers.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 1.5,
    rotation: (Math.random() - 0.5) * 30,
    delay: Math.random() * 2,
  }));

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="akriti-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      {/* Scattered cat stickers background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {scatteredStickers.map((sticker) => (
          <motion.span
            key={sticker.id}
            className="absolute"
            style={{
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              fontSize: `${sticker.size}rem`,
              transform: `rotate(${sticker.rotation}deg)`,
              opacity: 0.15,
              userSelect: "none",
              pointerEvents: "none",
            }}
            animate={reduceMotion ? {} : { y: [0, -10, 0], rotate: [sticker.rotation, sticker.rotation + 5, sticker.rotation] }}
            transition={{
              duration: 4 + Math.random() * 2,
              delay: sticker.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {sticker.emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="relative text-center mb-16 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="akriti-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Things that are very Akriti.
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          A soft scrapbook of her favourite things and the little details I've noticed.
        </p>
      </motion.div>

      {/* Favourites Grid */}
      <motion.div
        className="relative z-10 mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <h3 className="text-xl md:text-2xl font-medium mb-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          Her Favourites
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {data.favorites.map((fav, index) => (
            <motion.div
              key={fav.key}
              className="relative p-5 md:p-6 rounded-2xl group"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                minHeight: "160px",
                display: "flex",
                flexDirection: "column",
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.3 + index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(236, 72, 153, 0.15)" }}
            >
              <div className="text-3xl mb-3" style={{ opacity: 0.8 }}>{fav.icon}</div>
              <p className="text-sm font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#be185d" }}>
                {fav.label}
              </p>
              <p className="text-base flex-1" style={{ fontFamily: "'Inter', sans-serif", color: fav.value ? "#1f1f1f" : "#6b6b6b", fontStyle: fav.value ? "normal" : "italic" }}>
                {fav.value || "Click to add"}
              </p>
              {!fav.value && (
                <p className="text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif", color: "#ec4899", opacity: 0.7 }}>
                  Tap to edit
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Observations */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.5, ease: "easeOut" }}
      >
        <h3 className="text-xl md:text-2xl font-medium mb-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          Things Uddhav has noticed about her
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.observations.map((obs, index) => (
            <motion.div
              key={index}
              className="relative p-5 md:p-6 rounded-2xl flex items-start gap-4"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
              }}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.6 + index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(236, 72, 153, 0.12)" }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{
                background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))",
                color: "#be185d",
              }}>
                🐱
              </div>
              <p className="text-base leading-relaxed flex-1" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.7 }}>
                {obs}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Extra cat stickers in the section */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.span className="absolute top-10 right-10 text-3xl" style={{ opacity: 0.2 }} animate={reduceMotion ? {} : { rotate: [-5, 5, -5] }} transition={{ duration: 3, repeat: Infinity }}>😺</motion.span>
        <motion.span className="absolute bottom-20 left-10 text-2xl" style={{ opacity: 0.15 }} animate={reduceMotion ? {} : { y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>😻</motion.span>
        <motion.span className="absolute top-1/2 right-5 text-4xl" style={{ opacity: 0.1 }} animate={reduceMotion ? {} : { scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}>🐱</motion.span>
        <motion.span className="absolute bottom-10 right-20 text-2xl" style={{ opacity: 0.2 }} animate={reduceMotion ? {} : { rotate: [3, -3, 3] }} transition={{ duration: 2.5, repeat: Infinity }}>😸</motion.span>
      </div>
    </section>
  );
}