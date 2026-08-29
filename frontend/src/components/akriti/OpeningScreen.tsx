"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { relationshipData } from "@/data/akriti-website";

interface OpeningScreenProps {
  onEnter: () => void;
  reduceMotion: boolean;
  data: typeof relationshipData;
}

export default function OpeningScreen({ onEnter, reduceMotion, data }: OpeningScreenProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; delay: number; size: number }>>([]);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowContent(true), 800);
    const timer2 = setTimeout(() => setShowButton(true), 2000);
    const timer3 = setTimeout(() => {
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: Math.random() * 3 + 1,
      }));
      setParticles(newParticles);
      setShowParticles(true);
    }, 2500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleClick = () => {
    onEnter();
  };

  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
  }));

  const clouds = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 20 + Math.random() * 60,
    scale: 0.5 + Math.random() * 0.8,
    opacity: 0.15 + Math.random() * 0.15,
    delay: Math.random() * 5,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #1a0d14 0%, #0a0508 100%)" }}
      role="dialog"
      aria-label="Opening screen - Our Little Universe"
    >
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: "white",
              opacity: star.opacity,
            }}
            animate={reduceMotion ? {} : { opacity: [star.opacity, 1, star.opacity] }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <AnimatePresence>
        {showParticles &&
          particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: "linear-gradient(135deg, #f9a8d4, #fce7f3)",
                opacity: 0,
                pointerEvents: "none",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 2, opacity: [0.8, 0], x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: "easeOut",
              }}
            />
          ))}
      </AnimatePresence>

      {/* Clouds */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {clouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            className="absolute"
            style={{
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              transform: `scale(${cloud.scale})`,
              opacity: cloud.opacity,
            }}
            animate={reduceMotion ? {} : { x: [0, 20, 0] }}
            transition={{
              duration: 20 + Math.random() * 10,
              delay: cloud.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <svg viewBox="0 0 200 100" width="200" height="100" style={{ filter: "blur(2px)" }}>
              <ellipse cx="50" cy="60" rx="40" ry="20" fill="currentColor" />
              <ellipse cx="100" cy="40" rx="50" ry="30" fill="currentColor" />
              <ellipse cx="150" cy="60" rx="40" ry="20" fill="currentColor" />
              <ellipse cx="80" cy="55" rx="35" ry="18" fill="currentColor" />
              <ellipse cx="120" cy="55" rx="35" ry="18" fill="currentColor" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Moon */}
      <motion.div
        className="relative mb-8"
        initial={{ scale: 0, rotate: -180 }}
        animate={reduceMotion ? { scale: 1, rotate: 0 } : { scale: 1, rotate: 0 }}
        transition={{ duration: reduceMotion ? 0 : 1.5, delay: 0.3, ease: "easeOut" }}
        style={{ filter: "drop-shadow(0 0 60px rgba(249, 168, 212, 0.6))" }}
      >
        <svg viewBox="0 0 200 200" width={reduceMotion ? 180 : 200} height={reduceMotion ? 180 : 200} aria-hidden="true">
          <defs>
            <filter id="moonGlow">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M100 10 C55.8 10 20 45.8 20 90 c0 22.1 9.2 42.1 24 56.2 C30.3 158.6 10 132.5 10 100 C10 50.3 50.3 10 100 10 Z"
            fill="#fdf2f8"
            filter="url(#moonGlow)"
            style={{ opacity: 0.95 }}
          />
          <ellipse cx="70" cy="75" rx="12" ry="8" fill="#fbcfe8" opacity="0.5" />
          <ellipse cx="120" cy="110" rx="8" ry="5" fill="#fbcfe8" opacity="0.4" />
          <ellipse cx="85" cy="120" rx="6" ry="4" fill="#fbcfe8" opacity="0.3" />
        </svg>
      </motion.div>

      {/* Content */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            key="content"
            className="text-center px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1.2, delay: 1, ease: "easeOut" }}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-light mb-4"
              style={{
                fontFamily: "'Dancing Script', cursive",
                color: "#fce7f3",
                textShadow: "0 0 30px rgba(249, 168, 212, 0.5)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: 1.3, ease: "easeOut" }}
            >
              For {data.names.her} ♡
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl font-light tracking-widest mb-8"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#fbcfe8",
                letterSpacing: "0.3em",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: 1.6, ease: "easeOut" }}
            >
              17.07.2024 → ∞
            </motion.p>

            <motion.p
              className="text-base md:text-lg max-w-md mx-auto"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "#fbcfe8",
                opacity: 0.8,
                lineHeight: 1.8,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: 1.9, ease: "easeOut" }}
            >
              I made you a little corner of the internet.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enter Button */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            key="button"
            onClick={handleClick}
            className="relative px-10 py-4 mt-12 overflow-hidden"
            style={{
              background: "transparent",
              border: "1px solid rgba(249, 168, 212, 0.5)",
              borderRadius: "100px",
              cursor: "pointer",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              boxShadow: "0 0 40px rgba(249, 168, 212, 0.3)",
            }}
            transition={{ duration: reduceMotion ? 0 : 0.8, delay: 2.3, ease: "easeOut" }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(249, 168, 212, 0.5)" }}
            whileTap={{ scale: 0.98 }}
            aria-label="Enter our little universe"
          >
            <span
              className="relative z-10 text-lg font-medium"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "#fce7f3",
              }}
            >
              ♡ Enter our little universe
            </span>
            <motion.span
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent, rgba(249, 168, 212, 0.2), transparent)" }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}