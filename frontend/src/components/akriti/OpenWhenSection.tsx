"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { PAPER_TEXTURE } from "./paperTexture";

interface OpenWhenSectionProps {
  data: Array<{ id: string; title: string; emoji: string; message: string; tone: string }>;
  reduceMotion: boolean;
}

export default function OpenWhenSection({ data, reduceMotion }: OpenWhenSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openedLetter, setOpenedLetter] = useState<string | null>(null);

  const toneStyles: Record<string, { bg: string; border: string; seal: string }> = {
    romantic: { bg: "linear-gradient(135deg, #fce7f3, #fbcfe8)", border: "#f9a8d4", seal: "💗" },
    funny: { bg: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "#f59e0b", seal: "😂" },
    emotional: { bg: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", border: "#818cf8", seal: "☁️" },
  };

  return (
    <section ref={ref} className="relative" aria-labelledby="letters-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="letters-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Open When...
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Sealed letters for the moments you need them most.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Open when letters">
        {data.map((letter, index) => {
          const styles = toneStyles[letter.tone] || toneStyles.romantic;
          const isOpen = openedLetter === letter.id;

          return (
            <motion.article
              key={letter.id}
              className="relative group"
              initial={{ opacity: 0, y: 40, rotate: (Math.random() - 0.5) * 6 }}
              animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: 40, rotate: (Math.random() - 0.5) * 6 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }}
              whileHover={{ y: -6, rotate: 0 }}
              role="listitem"
            >
              <div
                className="relative cursor-pointer"
                onClick={() => setOpenedLetter(isOpen ? null : letter.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOpenedLetter(isOpen ? null : letter.id)}
                aria-label={isOpen ? `Close letter: ${letter.title}` : `Open letter: ${letter.title}`}
                aria-expanded={isOpen}
              >
                {/* Envelope */}
                <div className="relative" style={{ perspective: "1000px" }}>
                  {/* Envelope back */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: styles.bg,
                      border: `2px solid ${styles.border}`,
                      boxShadow: "0 10px 40px rgba(236, 72, 153, 0.12)",
                      transformOrigin: "top center",
                    }}
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: isOpen ? -180 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeInOut" }}
                  >
                    {/* Seal */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-3xl" style={{ transformOrigin: "center" }}>
                      <motion.span
                        initial={{ scale: 1, rotate: 0 }}
                        animate={{ scale: isOpen ? 0 : 1, rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.4, delay: isOpen ? 0 : 0.2, ease: "easeInOut" }}
                      >
                        {styles.seal}
                      </motion.span>
                    </div>

                    {/* Title on envelope */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-4">
                      <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                        Open when
                      </p>
                      <p className="text-base font-medium" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f" }}>
                        {letter.title.replace("Open when ", "").replace("Open when you're ", "").replace("Open when you ", "")}
                      </p>
                      <p className="text-2xl mt-1">{letter.emoji}</p>
                    </div>
                  </motion.div>

                  {/* Envelope flap - animates to open */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: styles.bg,
                      border: `2px solid ${styles.border}`,
                      borderBottom: "none",
                      boxShadow: "0 10px 40px rgba(236, 72, 153, 0.12)",
                      transformOrigin: "top center",
                      clipPath: "polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)",
                    }}
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: isOpen ? -160 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.6, delay: isOpen ? 0.1 : 0, ease: "easeInOut" }}
                  >
                    {/* Inner flap design */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.1))" }}>
                      <motion.span
                        className="text-4xl"
                        initial={{ opacity: 1, scale: 1 }}
                        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.5 : 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
                      >
                        {letter.emoji}
                      </motion.span>
                    </div>
                  </motion.div>
                </div>

                {/* Tap hint */}
                <motion.p
                  className="absolute bottom-[-30px] left-1/2 -translate-x-1/2 text-xs text-center whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", opacity: 0.7 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isOpen ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? "Tap to close" : "Tap to open"}
                </motion.p>
              </div>

              {/* Letter content - appears when opened */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    key="content"
                    className="absolute top-0 left-0 right-0 z-10 mt-2"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.3, ease: "easeOut" }}
                  >
                    <div className="relative p-6 rounded-2xl" style={{
                      background: "#fff",
                      border: `1px solid ${styles.border}`,
                      boxShadow: "0 20px 60px rgba(236, 72, 153, 0.15)",
                    }}>
                      {/* Paper texture effect */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-5" style={{ backgroundImage: PAPER_TEXTURE }} />
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-2xl">{letter.emoji}</span>
                          <p className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                            {letter.title}
                          </p>
                        </div>
                        <div className="whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                          {letter.message}
                        </div>
                        <motion.div
                          className="mt-6 pt-4 border-t text-right text-sm"
                          style={{ borderColor: styles.border, fontFamily: "'Dancing Script', cursive", color: "#be185d" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: reduceMotion ? 0 : 0.3, delay: 0.5 }}
                        >
                          — Uddhav ♡
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}