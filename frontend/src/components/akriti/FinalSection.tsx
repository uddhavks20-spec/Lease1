"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface FinalSectionProps {
  data: {
    timeline: Array<{ date: string; event: string }>;
    closingLines: string[];
  };
  reduceMotion: boolean;
}

export default function FinalSection({ data, reduceMotion }: FinalSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col" aria-labelledby="final-heading" style={{ background: "radial-gradient(ellipse at center, rgba(249, 168, 212, 0.08) 0%, transparent 70%)" }}>
      {/* Night sky background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Stars */}
        {Array.from({ length: 60 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
              background: "white",
              opacity: 0.3 + Math.random() * 0.7,
            }}
            animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 2 + Math.random() * 3,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Moon */}
        <motion.div
          className="absolute top-20 right-20"
          style={{ filter: "drop-shadow(0 0 80px rgba(249, 168, 212, 0.5))" }}
          animate={reduceMotion ? {} : { y: [0, -10, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 200 200" width={160} height={160}>
            <path
              d="M100 10 C55.8 10 20 45.8 20 90 c0 22.1 9.2 42.1 24 56.2 C30.3 158.6 10 132.5 10 100 C10 50.3 50.3 10 100 10 Z"
              fill="#fdf2f8"
              opacity="0.95"
            />
            <ellipse cx="70" cy="75" rx="12" ry="8" fill="#fbcfe8" opacity="0.5" />
            <ellipse cx="120" cy="110" rx="8" ry="5" fill="#fbcfe8" opacity="0.4" />
            <ellipse cx="85" cy="120" rx="6" ry="4" fill="#fbcfe8" opacity="0.3" />
          </svg>
        </motion.div>

        {/* Penguin */}
        <motion.div
          className="absolute bottom-20 left-20"
          animate={reduceMotion ? {} : { y: [0, -8, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-5xl">🐧</span>
        </motion.div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Timeline recap */}
        <motion.div
          className="w-full max-w-2xl mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
        >
          <div className="space-y-6">
            {data.timeline.map((item, index) => (
              <motion.div
                key={item.date}
                className="relative p-5 md:p-6 rounded-2xl text-center group"
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(251, 207, 232, 0.5)",
                  boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                  transform: `rotate(${(Math.random() - 0.5) * 1}deg)`,
                }}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.2 + index * 0.15, ease: "easeOut" }}
                whileHover={{ y: -4, rotate: 0, boxShadow: "0 20px 50px rgba(236, 72, 153, 0.15)" }}
              >
                <p className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "'Dancing Script', cursive", color: "#ec4899" }}>
                  {item.date}
                </p>
                <p className="text-lg font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                  {item.event}
                </p>
                <motion.div
                  className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                  style={{ background: "#f9a8d4" }}
                  animate={reduceMotion ? {} : { scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, delay: index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* "And somehow..." */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.8, ease: "easeOut" }}
        >
          <p className="text-xl md:text-2xl font-light" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
            And somehow...
          </p>
        </motion.div>

        {/* "You became my favourite person" */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: 1, ease: "easeOut" }}
        >
          <p className="text-2xl md:text-3xl lg:text-4xl font-light max-w-2xl" style={{ fontFamily: "'Dancing Script', cursive", color: "#ec4899", lineHeight: 1.4 }}>
            You became my favourite person.
          </p>
        </motion.div>

        {/* Closing lines */}
        <motion.div
          className="text-center max-w-xl"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: 1.3, ease: "easeOut" }}
        >
          <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.8, fontSize: "1.1rem" }}>
            {data.closingLines.map((line, index) => (
              <motion.p
                key={index}
                className={index >= data.closingLines.length - 3 ? "font-medium" : ""}
                style={{
                  fontFamily: index >= data.closingLines.length - 3 ? "'Dancing Script', cursive" : "'Inter', sans-serif",
                  color: index >= data.closingLines.length - 3 ? "#be185d" : "#1f1f1f",
                  fontSize: index === data.closingLines.length - 1 ? "1.5rem" : index === data.closingLines.length - 2 ? "1.25rem" : "1.1rem",
                  opacity: line === "" ? 0 : 1,
                  marginTop: line === "" ? "1rem" : 0,
                  marginBottom: line === "" ? "1rem" : 0,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: line === "" ? 0 : 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 1.5 + index * 0.12, ease: "easeOut" }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Final decorative elements */}
        <motion.div
          className="mt-16 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: 3, ease: "easeOut" }}
        >
          <motion.div
            className="text-3xl"
            animate={reduceMotion ? {} : { y: [0, -10, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌙
          </motion.div>
          <motion.div
            className="text-3xl"
            animate={reduceMotion ? {} : { y: [0, -8, 0], rotate: [3, -3, 3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🐧
          </motion.div>
          <motion.div
            className="text-3xl"
            animate={reduceMotion ? {} : { scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ♡
          </motion.div>
        </motion.div>

        {/* Made with love */}
        <motion.p
          className="mt-12 text-sm text-center"
          style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", opacity: 0.7 }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.7 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: 3.5, ease: "easeOut" }}
        >
          Made with love by Uddhav, for Akriti. ♡
        </motion.p>
      </div>
    </section>
  );
}