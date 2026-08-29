"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { PAPER_TEXTURE } from "./paperTexture";

interface LoveLetterSectionProps {
  data: {
    title: string;
    content: string;
  };
  reduceMotion: boolean;
}

export default function LoveLetterSection({ data, reduceMotion }: LoveLetterSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [letterOpened, setLetterOpened] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const paragraphs = data.content.split('\n\n').filter(p => p.trim());

  return (
    <section ref={ref} className="relative" aria-labelledby="letter-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="relative max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        {/* Envelope closed state */}
        <AnimatePresence mode="wait">
          {!letterOpened && (
            <motion.div
              key="envelope"
              className="relative cursor-pointer"
              onClick={() => {
                setLetterOpened(true);
                setTimeout(() => setShowContent(true), 600);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && (setLetterOpened(true), setTimeout(() => setShowContent(true), 600))}
              aria-label="Open the love letter"
            >
              {/* Envelope back */}
              <motion.div
                className="relative rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
                  border: "2px solid #f9a8d4",
                  boxShadow: "0 20px 60px rgba(236, 72, 153, 0.15)",
                  padding: "3rem 2rem",
                  minHeight: "300px",
                }}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: letterOpened ? 180 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeInOut" }}
              >
                {/* Seal */}
                <motion.div
                  className="absolute top-6 left-1/2 -translate-x-1/2"
                  initial={{ scale: 1, rotate: 0 }}
                  animate={{ scale: letterOpened ? 0 : 1, rotate: letterOpened ? 180 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.5, delay: letterOpened ? 0 : 0.3, ease: "easeInOut" }}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{
                    background: "linear-gradient(135deg, #ec4899, #f9a8d4)",
                    boxShadow: "0 4px 20px rgba(236, 72, 153, 0.4)",
                  }}>
                    ♡
                  </div>
                </motion.div>

                {/* Title on envelope */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-4">
                  <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                    A letter
                  </p>
                  <p className="text-xl font-light" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
                    {data.title}
                  </p>
                  <p className="text-sm mt-2" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                    Tap to open ♡
                  </p>
                </div>
              </motion.div>

              {/* Envelope flap */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
                  border: "2px solid #f9a8d4",
                  borderBottom: "none",
                  clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)",
                  transformOrigin: "top center",
                }}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: letterOpened ? -150 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.8, delay: letterOpened ? 0.1 : 0, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span className="text-5xl" initial={{ opacity: 1 }} animate={{ opacity: letterOpened ? 0 : 1 }} transition={{ duration: 0.3 }}>
                    💌
                  </motion.span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Letter opened state */}
        <AnimatePresence mode="wait">
          {letterOpened && (
            <motion.div
              key="letter"
              className="relative"
              initial={{ opacity: 0, scale: 0.95, rotateX: 10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotateX: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
            >
              {/* Paper */}
              <div className="relative rounded-2xl" style={{
                background: "#fff",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 25px 80px rgba(236, 72, 153, 0.15)",
                padding: "3rem 2.5rem",
              }}>
                {/* Paper texture */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-3" style={{ backgroundImage: PAPER_TEXTURE }} />
                
                {/* Fold lines */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: "linear-gradient(to bottom, transparent, rgba(249, 168, 212, 0.2), transparent)" }} />
                <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2" style={{ background: "linear-gradient(to right, transparent, rgba(249, 168, 212, 0.2), transparent)" }} />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="mb-8 pb-6 border-b" style={{ borderColor: "rgba(251, 207, 232, 0.5)" }}>
                    <p className="text-sm font-medium uppercase tracking-wider mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                      For Akriti ♡
                    </p>
                    <p className="text-base" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
                      17.07.2024 → ∞
                    </p>
                  </div>

                  {/* Letter content */}
                  <AnimatePresence>
                    {showContent && (
                      <motion.div
                        key="content"
                        className="whitespace-pre-line leading-relaxed"
                        style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.9, fontSize: "1.05rem", whiteSpace: "pre-line" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
                      >
                        {data.content}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Signature */}
                  <AnimatePresence>
                    {showContent && (
                      <motion.div
                        key="signature"
                        className="mt-10 pt-6 border-t text-right"
                        style={{ borderColor: "rgba(251, 207, 232, 0.5)", fontFamily: "'Dancing Script', cursive", color: "#be185d", fontSize: "1.5rem" }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.8, ease: "easeOut" }}
                      >
                        — Uddhav ♡
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={() => { setShowContent(false); setTimeout(() => setLetterOpened(false), 300); }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(249, 168, 212, 0.1)",
                    border: "1px solid rgba(249, 168, 212, 0.3)",
                    color: "#ec4899",
                  }}
                  whileHover={{ scale: 1.1, background: "rgba(249, 168, 212, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close letter"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}