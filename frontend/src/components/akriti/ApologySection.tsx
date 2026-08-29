"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { PAPER_TEXTURE } from "./paperTexture";

interface ApologySectionProps {
  data: {
    title: string;
    message: string;
    buttonText: string;
    buttonResponse: string;
  };
  reduceMotion: boolean;
}

export default function ApologySection({ data, reduceMotion }: ApologySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [apologyAccepted, setApologyAccepted] = useState(false);

  return (
    <section ref={ref} className="relative" aria-labelledby="apology-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="relative max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        {/* Decorative top */}
        <motion.div
          className="mb-8 flex justify-center"
          animate={reduceMotion ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-2">
            <motion.span className="text-2xl" animate={reduceMotion ? {} : { rotate: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity }}>💌</motion.span>
            <motion.div className="w-24 h-px" style={{ background: "linear-gradient(90deg, transparent, #f9a8d4, transparent)" }} />
            <motion.span className="text-2xl" animate={reduceMotion ? {} : { rotate: [10, -10, 10] }} transition={{ duration: 2, repeat: Infinity }}>💌</motion.span>
          </div>
        </motion.div>

        <h2 id="apology-heading" className="text-3xl md:text-4xl font-light mb-6" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          {data.title}
        </h2>

        <div className="relative p-8 md:p-10 rounded-2xl" style={{
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(251, 207, 232, 0.5)",
          boxShadow: "0 20px 60px rgba(236, 72, 153, 0.1)",
        }}>
          {/* Paper texture */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-5" style={{ backgroundImage: PAPER_TEXTURE }} />
          
          <div className="relative z-10 whitespace-pre-line text-left" style={{ fontFamily: "'Inter', sans-serif", color: "#1f1f1f", lineHeight: 1.9, fontSize: "1.05rem" }}>
            {data.message}
          </div>
        </div>

        <AnimatePresence>
          {!apologyAccepted ? (
            <motion.button
              key="accept"
              onClick={() => setApologyAccepted(true)}
              className="mt-8 px-10 py-4 rounded-full relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #ec4899, #f9a8d4)",
                border: "none",
                color: "#fff",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "1.1rem",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.4)",
              }}
              whileHover={{ scale: 1.03, boxShadow: "0 15px 50px rgba(236, 72, 153, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.5, ease: "easeOut" }}
            >
              {data.buttonText}
              <motion.span
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          ) : (
            <motion.div
              key="accepted"
              className="mt-8 p-6 rounded-2xl text-center"
              style={{
                background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                border: "1px solid #f9a8d4",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
            >
              <motion.p
                className="text-lg font-medium mb-2"
                style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}
                animate={reduceMotion ? {} : { scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {data.buttonResponse}
              </motion.p>
              <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                You're the best. ♡
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}