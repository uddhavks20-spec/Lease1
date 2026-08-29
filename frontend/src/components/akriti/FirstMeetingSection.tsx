"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

interface FirstMeetingSectionProps {
  data: Array<{
    id: string;
    number: string;
    title: string;
    subtitle: string;
    memory: string;
    icon: string;
    photoPlaceholder: string;
  }>;
  reduceMotion: boolean;
}

const stopIcons: Record<string, React.ReactNode> = {
  "hand-heart": (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.87 2.59c.65-.65 1.71-.65 2.36 0l3.54 3.54c.65.65.65 1.71 0 2.36L9 19.82c-.35.35-.76.59-1.19.73-.22.07-.44.09-.66.07l-3.74-.29c-.8-.06-1.42-.69-1.48-1.48l-.29-3.74c-.02-.22 0-.44.07-.66.14-.43.38-.84.73-1.19l10.87-10.87 3.54 3.54Z" />
      <path d="M7.5 18.5c-.65.65-1.71.65-2.36 0l-3.54-3.54c-.65-.65-.65-1.71 0-2.36l10.87-10.87" />
    </svg>
  ),
  hug: (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12Z" />
      <path d="M10 7v10" />
      <path d="M14 7v10" />
      <path d="M7 12h10" />
    </svg>
  ),
  burger: (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M5 12h14" />
      <path d="M5 6h14" />
      <path d="M5 18h14" />
      <ellipse cx="12" cy="12" rx="3" ry="2" />
    </svg>
  ),
};

export default function FirstMeetingSection({ data, reduceMotion }: FirstMeetingSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  return (
    <section ref={ref} className="relative" aria-labelledby="meeting-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="meeting-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          From a screen to real life.
        </h2>
        <p className="text-lg md:text-xl font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          13 August 2025 — 11:30 AM — Jammu
        </p>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Our first and currently only proper meeting. Three stops. One perfect day.
        </p>
      </motion.div>

      <div className="space-y-12 md:space-y-16">
        {data.map((stop, index) => (
          <motion.div
            key={stop.id}
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.2 + index * 0.2, ease: "easeOut" }}
          >
            {/* Connecting line between stops */}
            {index < data.length - 1 && (
              <motion.div
                className="absolute left-1/2 top-full h-24 w-0.5 -translate-x-1/2"
                style={{ background: "linear-gradient(to bottom, #f9a8d4, transparent)" }}
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.5 + index * 0.2, ease: "easeOut" }}
              />
            )}

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              {/* Stop number */}
              <motion.div
                className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center z-10"
                style={{
                  background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                  border: "2px solid #f9a8d4",
                  boxShadow: "0 4px 20px rgba(251, 207, 232, 0.5)",
                }}
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
                  {stop.number}
                </span>
              </motion.div>

              {/* Content */}
              <motion.div
                className={`w-full md:w-1/2 relative p-6 md:p-8 rounded-2xl ${index % 2 === 0 ? "md:mr-auto" : "md:ml-auto"}`}
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(251, 207, 232, 0.5)",
                  boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                }}
                whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(236, 72, 153, 0.12)" }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))",
                      color: "#be185d",
                    }}
                  >
                    {stopIcons[stop.icon]}
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                      Stop {stop.number} — {stop.title}
                    </p>
                    <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                      {stop.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.8 }}>
                  {stop.memory}
                </p>

                {/* Photo placeholder */}
                <motion.div
                  className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer"
                  style={{
                    background: "linear-gradient(145deg, rgba(252, 231, 243, 0.5), rgba(251, 207, 232, 0.3))",
                    border: "2px dashed rgba(249, 168, 212, 0.4)",
                  }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setExpandedStop(stop.id === expandedStop ? null : stop.id)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                      {stop.photoPlaceholder}
                    </p>
                    <p className="text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                      Tap to add photo
                    </p>
                  </div>
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: expandedStop === stop.id ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ background: "rgba(26, 13, 20, 0.8)" }}
                  >
                    <span className="text-lg" style={{ fontFamily: "'Inter', sans-serif", color: "#fce7f3" }}>
                      Click to replace with your photo
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded photo modal */}
      <AnimatePresence>
        {expandedStop && (
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedStop(null)}
            role="dialog"
            aria-label="Photo placeholder"
          >
            <motion.div
              className="relative max-w-2xl w-full aspect-[4/3] rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(252, 231, 243, 0.5), rgba(251, 207, 232, 0.3))",
                border: "2px solid #f9a8d4",
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-xl font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#be185d" }}>
                  {data.find(s => s.id === expandedStop)?.photoPlaceholder}
                </p>
                <p className="text-base" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                  Replace this placeholder with your photo
                </p>
                <p className="text-xs mt-4" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", opacity: 0.7 }}>
                  Click outside to close
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (max-width: 768px) {
          .stop-content {
            margin-left: 0 !important;
            text-align: left !important;
          }
        }
      `}</style>
    </section>
  );
}