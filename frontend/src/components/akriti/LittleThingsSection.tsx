"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface LittleThingsSectionProps {
  data: string[];
  reduceMotion: boolean;
}

const icons = ["💭", "😤", "🎯", "😂", "🐱", "🐧", "💀", "📱", "🤝", "🤐", "🤲", "🫂", "🍟", "💬", "📅"];

export default function LittleThingsSection({ data, reduceMotion }: LittleThingsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: icons[Math.floor(Math.random() * icons.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 1.5,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 3,
  }));

  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="little-things-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      {/* Floating background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {floatingElements.map((el) => (
          <motion.span
            key={el.id}
            className="absolute"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              fontSize: `${el.size}rem`,
              opacity: 0.08,
              userSelect: "none",
              pointerEvents: "none",
            }}
            animate={reduceMotion ? {} : { y: [0, -15, 0], rotate: [-5, 5, -5] }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {el.emoji}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="relative z-10 text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="little-things-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Our Little Things
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Tiny random memories and observations. The stuff that makes us us.
        </p>
      </motion.div>

      <motion.div
        className="relative z-10 max-w-3xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <div className="space-y-4" role="list" aria-label="Our little memories">
          {data.map((thing, index) => {
            const icon = icons[index % icons.length];
            return (
              <motion.article
                key={index}
                className="relative p-4 md:p-5 rounded-2xl group"
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(251, 207, 232, 0.5)",
                  boxShadow: "0 8px 30px rgba(236, 72, 153, 0.06)",
                  transform: `rotate(${(Math.random() - 0.5) * 1.5}deg)`,
                }}
                initial={{ opacity: 0, y: 20, scale: 0.95, rotate: (Math.random() - 0.5) * 4 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1, rotate: (Math.random() - 0.5) * 1.5 } : { opacity: 0, y: 20, scale: 0.95, rotate: (Math.random() - 0.5) * 4 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.3 + index * 0.05, ease: "easeOut" }}
                whileHover={{ y: -4, rotate: 0, boxShadow: "0 15px 40px rgba(236, 72, 153, 0.12)", zIndex: 10 }}
                role="listitem"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{
                    background: "linear-gradient(135deg, rgba(249, 168, 212, 0.15), rgba(252, 231, 243, 0.2))",
                    color: "#be185d",
                    transform: `rotate(${(Math.random() - 0.5) * 10}deg)`,
                  }}>
                    {icon}
                  </div>
                  <p className="text-base leading-relaxed flex-1 pt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.7 }}>
                    {thing}
                  </p>
                </div>
                {/* Tape effect */}
                <div className="absolute top-[-6px] left-6 w-10 h-6 rounded" style={{
                  background: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid rgba(249, 168, 212, 0.2)",
                  transform: `rotate(${(Math.random() - 0.5) * 8}deg)`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }} />
              </motion.article>
            );
          })}
        </div>
      </motion.div>

      {/* Scrapbook corner decoration */}
      <div className="absolute bottom-4 right-4 pointer-events-none" aria-hidden="true">
        <motion.div className="text-3xl" animate={reduceMotion ? {} : { rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity }}>📌</motion.div>
      </div>
      <div className="absolute top-4 left-4 pointer-events-none" aria-hidden="true">
        <motion.div className="text-2xl" animate={reduceMotion ? {} : { y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>💗</motion.div>
      </div>
    </section>
  );
}