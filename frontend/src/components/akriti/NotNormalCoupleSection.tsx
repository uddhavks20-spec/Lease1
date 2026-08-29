"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

interface NotNormalCoupleSectionProps {
  data: Array<{
    id: string;
    title: string;
    description: string;
    trigger?: string;
    reaction?: string;
    memorial?: {
      name: string;
      subtitle: string;
      epitaph: string;
    };
    courtCase?: {
      title: string;
      charge: string;
      verdict: string;
    };
  }>;
  reduceMotion: boolean;
}

const dialogueLines = [
  { speaker: "Akriti", text: "You're such a gawar.", isAkriti: true },
  { speaker: "Uddhav", text: "That argument has no logical basis.", isAkriti: false },
  { speaker: "Akriti", text: "😡", isAkriti: true },
  { speaker: "Uddhav", text: "Thank you for proving my point.", isAkriti: false },
];

export default function NotNormalCoupleSection({ data, reduceMotion }: NotNormalCoupleSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [showMemorial, setShowMemorial] = useState(false);
  const [courtVerdict, setCourtVerdict] = useState<string>("Still unresolved.");

  return (
    <section ref={ref} className="relative" aria-labelledby="couple-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="couple-heading" className="text-4xl md:text-6xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Couple?
        </h2>
        <p className="text-xl md:text-2xl font-light max-w-2xl mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899", lineHeight: 1.5 }}>
          Best friends who accidentally became a couple.
        </p>
        <p className="text-base max-w-2xl mx-auto mt-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Our relationship is less stereotypically romantic and more like two best friends constantly roasting each other.
        </p>
      </motion.div>

      {/* Animated Dialogue Bubbles */}
      <motion.div
        className="mb-16 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.3, ease: "easeOut" }}
      >
        <div className="space-y-4" role="list" aria-label="Our typical conversation">
          {dialogueLines.map((line, index) => (
            <motion.div
              key={index}
              className={`flex ${line.isAkriti ? "justify-start" : "justify-end"}`}
              initial={{ opacity: 0, x: line.isAkriti ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: line.isAkriti ? -30 : 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.5 + index * 0.3, ease: "easeOut" }}
              role="listitem"
            >
              <div
                className={`relative max-w-[80%] px-4 py-3 rounded-2xl ${line.isAkriti ? "rounded-tl-sm" : "rounded-tr-sm"}`}
                style={{
                  background: line.isAkriti
                    ? "linear-gradient(135deg, #fce7f3, #fbcfe8)"
                    : "linear-gradient(135deg, #fdf2f8, #fce7f3)",
                  border: line.isAkriti ? "1px solid #f9a8d4" : "1px solid #fbcfe8",
                  boxShadow: "0 4px 15px rgba(236, 72, 153, 0.08)",
                }}
              >
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: line.isAkriti ? "#be185d" : "#ec4899" }}>
                  {line.speaker}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", fontSize: line.text === "😡" ? "1.5rem" : "0.95rem" }}>
                  {line.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Inside Jokes Cards */}
      <div className="space-y-10">
        {data.map((joke, index) => (
          <motion.div
            key={joke.id}
            className="relative"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.6 + index * 0.15, ease: "easeOut" }}
          >
            {joke.id === "gawar" && (
              <div className="relative p-6 md:p-8 rounded-2xl" style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))", color: "#be185d" }}>
                    <span className="text-2xl">😤</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                    {joke.title}
                  </h3>
                </div>
                <p className="text-base leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
                  {joke.description}
                </p>
                <div className="mt-6 p-4 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(249, 168, 212, 0.1), rgba(252, 231, 243, 0.1))", border: "1px dashed rgba(249, 168, 212, 0.3)" }}>
                  <p className="text-sm font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                    Trigger → Reaction
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                    <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(249, 168, 212, 0.2)", color: "#be185d" }}>
                      {joke.trigger}
                    </span>
                    <span className="text-2xl">→</span>
                    <span className="px-3 py-1.5 rounded-full" style={{ background: "rgba(249, 168, 212, 0.2)", color: "#be185d" }}>
                      {joke.reaction}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {joke.id === "moon" && (
              <div className="relative p-6 md:p-8 rounded-2xl" style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))", color: "#be185d" }}>
                    <span className="text-2xl">🌙</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                    {joke.title}
                  </h3>
                </div>
                <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
                  {joke.description}
                </p>

                {!showMemorial ? (
                  <motion.button
                    onClick={() => setShowMemorial(true)}
                    className="w-full px-6 py-3 rounded-xl font-medium transition-all"
                    style={{
                      background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                      border: "1px solid #f9a8d4",
                      color: "#be185d",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(249, 168, 212, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Memorial 🕯️
                  </motion.button>
                ) : (
                  <AnimatePresence>
                    <motion.div
                      key="memorial"
                      className="relative mt-6 p-6 rounded-2xl text-center"
                      style={{
                        background: "linear-gradient(135deg, #1a0d14, #2a1220)",
                        border: "1px solid rgba(249, 168, 212, 0.2)",
                      }}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
                    >
                      <motion.div
                        className="absolute -top-6 left-1/2 -translate-x-1/2"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2, ease: "easeOut" }}
                      >
                        <span className="text-4xl">🐧</span>
                      </motion.div>
                      
                      <p className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "'Dancing Script', cursive", color: "#fce7f3" }}>
                        {joke.memorial?.name}
                      </p>
                      <p className="text-lg mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fbcfe8" }}>
                        {joke.memorial?.subtitle}
                      </p>
                      <p className="text-base mb-6" style={{ fontFamily: "'Inter', sans-serif", color: "#fbcfe8", fontStyle: "italic", lineHeight: 1.7 }}>
                        {joke.memorial?.epitaph}
                      </p>
                      
                      <motion.button
                        onClick={() => setShowMemorial(false)}
                        className="px-6 py-2 rounded-xl font-medium transition-all"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(249, 168, 212, 0.4)",
                          color: "#f9a8d4",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                        whileHover={{ background: "rgba(249, 168, 212, 0.1)", scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Close Memorial
                      </motion.button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            )}

            {joke.id === "two-phones" && (
              <div className="relative p-6 md:p-8 rounded-2xl" style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
              }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))", color: "#be185d" }}>
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                    {joke.title}
                  </h3>
                </div>
                <p className="text-base leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
                  {joke.description}
                </p>

                <div className="relative p-6 rounded-2xl" style={{
                  background: "linear-gradient(135deg, #1a0d14, #2a1220)",
                  border: "1px solid rgba(249, 168, 212, 0.2)",
                }}>
                  <div className="absolute -top-3 left-6 px-3 py-1 text-xs font-medium uppercase tracking-wider" style={{ 
                    background: "linear-gradient(135deg, #ec4899, #f9a8d4)", 
                    color: "#fff",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    borderRadius: "4px",
                  }}>
                    COURT CASE
                  </div>
                  
                  <h4 className="text-xl font-bold mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#fce7f3" }}>
                    {joke.courtCase?.title}
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                      <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f9a8d4" }}>
                        Charge:
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: "#fbcfe8" }}>
                        {joke.courtCase?.charge}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                      <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f9a8d4" }}>
                        Verdict:
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", color: "#fbcfe8" }}>
                        {courtVerdict}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => setCourtVerdict(courtVerdict === "Still unresolved." ? "GUILTY. Sentence: Infinite cuddles." : "Still unresolved.")}
                    className="mt-6 px-6 py-2 rounded-xl font-medium transition-all"
                    style={{
                      background: "linear-gradient(135deg, #ec4899, #f9a8d4)",
                      border: "none",
                      color: "#fff",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                    whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(236, 72, 153, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Appeal Verdict ⚖️
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </section>
  );
}