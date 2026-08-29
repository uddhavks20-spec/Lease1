"use client";

import { motion } from "framer-motion";

interface FloatingElementsProps {
  reduceMotion: boolean;
}

export default function FloatingElements({ reduceMotion }: FloatingElementsProps) {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 1.5,
    opacity: 0.15 + Math.random() * 0.25,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 4,
  }));

  const clouds = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 10 + Math.random() * 30,
    scale: 0.5 + Math.random() * 0.5,
    opacity: 0.05 + Math.random() * 0.08,
    delay: Math.random() * 10,
    duration: 30 + Math.random() * 20,
  }));

  const hearts = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 80 + Math.random() * 20,
    size: 0.8 + Math.random() * 0.8,
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 5,
    color: ["#ec4899", "#f9a8d4", "#f472b6"][Math.floor(Math.random() * 3)],
  }));

  if (reduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.span
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
            animate={{ opacity: [star.opacity, star.opacity + 0.3, star.opacity] }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle clouds */}
      <div className="absolute inset-0">
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
            animate={{ x: ["0%", "100%"] }}
            transition={{
              duration: cloud.duration,
              delay: cloud.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <svg viewBox="0 0 300 150" width="300" height="150" style={{ filter: "blur(3px)" }}>
              <ellipse cx="70" cy="90" rx="50" ry="25" fill="currentColor" />
              <ellipse cx="140" cy="60" rx="65" ry="35" fill="currentColor" />
              <ellipse cx="210" cy="90" rx="50" ry="25" fill="currentColor" />
              <ellipse cx="110" cy="80" rx="45" ry="22" fill="currentColor" />
              <ellipse cx="170" cy="80" rx="45" ry="22" fill="currentColor" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Floating hearts */}
      <div className="absolute inset-0">
        {hearts.map((heart) => (
          <motion.span
            key={heart.id}
            className="absolute"
            style={{
              left: `${heart.x}%`,
              top: `${heart.y}%`,
              fontSize: `${heart.size}rem`,
              color: heart.color,
              opacity: 0.1,
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
              rotate: [-10, 10, -10],
              opacity: [0, 0.1, 0],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ♡
          </motion.span>
        ))}
      </div>
    </div>
  );
}