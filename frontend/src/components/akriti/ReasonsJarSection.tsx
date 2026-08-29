"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";

interface ReasonsJarSectionProps {
  data: Array<{ id: number; text: string; type: string }>;
  reduceMotion: boolean;
}

const typeColors: Record<string, { bg: string; border: string; icon: string }> = {
  romantic: { bg: "linear-gradient(135deg, #fce7f3, #fbcfe8)", border: "#f9a8d4", icon: "♡" },
  friendship: { bg: "linear-gradient(135deg, #fdf2f8, #fce7f3)", border: "#fbcfe8", icon: "🤝" },
  funny: { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "#f59e0b", icon: "😂" },
  memory: { bg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", border: "#818cf8", icon: "📸" },
};

export default function ReasonsJarSection({ data, reduceMotion }: ReasonsJarSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [shownReasons, setShownReasons] = useState<Set<number>>(new Set());
  const [jarHearts, setJarHearts] = useState<Array<{ id: number; x: number; y: number; rotation: number }>>([]);
  const [showJar, setShowJar] = useState(true);

  const shuffledReasons = [...data].sort(() => Math.random() - 0.5);

  const handleJarClick = useCallback(() => {
    const remaining = shuffledReasons.filter(r => !shownReasons.has(r.id));
    if (remaining.length === 0) {
      setShownReasons(new Set());
      return;
    }
    const nextReason = remaining[0];
    setShownReasons(prev => {
      const next = new Set(prev);
      next.add(nextReason.id);
      return next;
    });
    
    // Add heart particle
    setJarHearts(prev => [...prev, {
      id: Date.now(),
      x: 50 + (Math.random() - 0.5) * 30,
      y: 60,
      rotation: (Math.random() - 0.5) * 60,
    }]);
    
    // Remove heart after animation
    setTimeout(() => {
      setJarHearts(prev => prev.slice(1));
    }, 1500);
  }, [shownReasons, shuffledReasons]);

  const allShown = shownReasons.size >= data.length;

  return (
    <section ref={ref} className="relative" aria-labelledby="reasons-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="reasons-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          10 Reasons I Love You
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          A glass jar filled with tiny folded notes. Click to pull one out.
        </p>
      </motion.div>

      {/* The Jar */}
      <motion.div
        className="relative flex flex-col items-center mb-12"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
      >
        {/* Jar visualization */}
        <div className="relative" onClick={handleJarClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleJarClick()} aria-label="Click to pull a reason from the jar">
          {/* Jar body */}
          <motion.div
            className="relative"
            style={{
              width: "200px",
              height: "280px",
              borderRadius: "0 0 40px 40px",
              background: "linear-gradient(145deg, rgba(252, 231, 243, 0.4), rgba(251, 207, 232, 0.3))",
              border: "3px solid rgba(249, 168, 212, 0.6)",
              borderTop: "none",
              position: "relative",
              overflow: "hidden",
              boxShadow: "inset 0 -20px 40px rgba(249, 168, 212, 0.1), 0 20px 60px rgba(236, 72, 153, 0.15)",
            }}
            animate={reduceMotion ? {} : { y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Hearts inside jar */}
            <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "0 0 37px 37px" }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${30 + Math.random() * 60}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0.4,
                  }}
                  animate={reduceMotion ? {} : { y: [0, -15, 0], rotate: [0, 180, 360] }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  ♡
                </motion.span>
              ))}
            </div>

            {/* Jar neck */}
            <div className="absolute top-[-15px] left-1/2 -translate-x-1/2" style={{
              width: "80px",
              height: "20px",
              borderRadius: "0 0 10px 10px",
              background: "linear-gradient(145deg, rgba(252, 231, 243, 0.4), rgba(251, 207, 232, 0.3))",
              border: "3px solid rgba(249, 168, 212, 0.6)",
              borderBottom: "none",
              boxShadow: "inset 0 -10px 20px rgba(249, 168, 212, 0.1)",
            }} />

            {/* Jar lid */}
            <div className="absolute top-[-25px] left-1/2 -translate-x-1/2" style={{
              width: "100px",
              height: "12px",
              borderRadius: "6px 6px 0 0",
              background: "linear-gradient(145deg, #fce7f3, #fbcfe8)",
              border: "3px solid rgba(249, 168, 212, 0.6)",
              borderBottom: "none",
              boxShadow: "0 -5px 15px rgba(249, 168, 212, 0.2)",
            }} />

            {/* Cork */}
            <div className="absolute top-[-38px] left-1/2 -translate-x-1/2" style={{
              width: "50px",
              height: "18px",
              borderRadius: "8px 8px 4px 4px",
              background: "linear-gradient(145deg, #d4a574, #c49564)",
              boxShadow: "0 -3px 10px rgba(0,0,0,0.1)",
            }} />
          </motion.div>

          {/* Floating hearts from jar */}
          <AnimatePresence>
            {jarHearts.map((heart) => (
              <motion.span
                key={heart.id}
                className="absolute text-xl pointer-events-none"
                style={{ left: `${heart.x}%`, top: `${heart.y}%`, transform: `rotate(${heart.rotation}deg)` }}
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 0, scale: 1.5, y: -80, x: (Math.random() - 0.5) * 40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                ♡
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Tap hint */}
          <motion.p
            className="mt-4 text-sm text-center max-w-xs"
            style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}
            animate={reduceMotion ? {} : { opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            Tap the jar to pull out a reason ♡
          </motion.p>
        </div>
      </motion.div>

      {/* Reasons displayed */}
      <AnimatePresence>
        {shownReasons.size > 0 && (
          <motion.div
            key="reasons"
            className="relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="space-y-4 max-w-2xl mx-auto">
              {shuffledReasons
                .filter(r => shownReasons.has(r.id))
                .map((reason, index) => {
                  const colors = typeColors[reason.type] || typeColors.romantic;
                  return (
                    <motion.div
                      key={reason.id}
                      className="relative p-5 md:p-6 rounded-2xl"
                      style={{
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: 20, rotate: -3 }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.5, delay: index * 0.1, ease: "easeOut" }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: colors.border, color: "#fff" }}>
                          {colors.icon}
                        </div>
                        <p className="text-base leading-relaxed flex-1 pt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.7 }}>
                          {reason.text}
                        </p>
                      </div>
                      <div className="absolute bottom-3 right-3 text-xs font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: colors.border }}>
                        #{reason.id}
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {allShown && (
              <motion.div
                key="done"
                className="text-center mt-8 p-6 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                  border: "1px solid #f9a8d4",
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.3, ease: "easeOut" }}
              >
                <p className="text-lg font-medium" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
                  That's all the notes... for now.
                </p>
                <p className="text-sm mt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                  Click the jar again to start over ♡
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}