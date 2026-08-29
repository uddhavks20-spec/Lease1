"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";

interface HeartGameSectionProps {
  data: {
    maxHearts: number;
    revealMessage: string;
  };
  reduceMotion: boolean;
}

export default function HeartGameSection({ data, reduceMotion }: HeartGameSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [heartCount, setHeartCount] = useState(0);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; size: number; rotation: number; color: string }>>([]);
  const [showMessage, setShowMessage] = useState(false);

  const heartColors = ["#ec4899", "#f9a8d4", "#f472b6", "#fce7f3", "#fbcfe8", "#be185d"];

  const addHeart = useCallback((clientX: number, clientY: number) => {
    if (heartCount >= data.maxHearts) return;
    
    const newHeart = {
      id: Date.now() + Math.random(),
      x: clientX,
      y: clientY,
      size: 1 + Math.random() * 1.5,
      rotation: (Math.random() - 0.5) * 60,
      color: heartColors[Math.floor(Math.random() * heartColors.length)],
    };
    
    setHearts(prev => [...prev, newHeart]);
    setHeartCount(prev => prev + 1);
    
    if (heartCount + 1 >= data.maxHearts) {
      setTimeout(() => setShowMessage(true), 500);
    }
  }, [heartCount, data.maxHearts]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    addHeart(e.clientX, e.clientY);
  }, [addHeart]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    addHeart(touch.clientX, touch.clientY);
  }, [addHeart]);

  return (
    <section ref={ref} className="relative min-h-[50vh] flex items-center justify-center" aria-labelledby="heart-game-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="relative text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="heart-game-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Click the hearts.
        </h2>
        <p className="text-base mb-8" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
          {heartCount}/{data.maxHearts}
        </p>

        {/* Click area */}
        <motion.div
          className="relative w-full max-w-2xl mx-auto min-h-[300px] md:min-h-[400px] rounded-2xl cursor-crosshair touch-none"
          style={{
            background: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(10px)",
            border: "2px dashed rgba(249, 168, 212, 0.4)",
          }}
          onClick={handleClick}
          onTouchStart={handleTouch}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); addHeart(window.innerWidth/2, window.innerHeight/2); }}}
          aria-label="Click anywhere to create hearts"
        >
          {/* Floating hearts */}
          <AnimatePresence>
            {hearts.map((heart) => (
              <motion.span
                key={heart.id}
                className="absolute pointer-events-none text-shadow"
                style={{
                  left: `${heart.x}px`,
                  top: `${heart.y}px`,
                  fontSize: `${heart.size}rem`,
                  color: heart.color,
                  transform: `translate(-50%, -50%) rotate(${heart.rotation}deg)`,
                  textShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  userSelect: "none",
                }}
                initial={{ opacity: 0, scale: 0, rotate: heart.rotation - 180 }}
                animate={{ opacity: 1, scale: 1, rotate: heart.rotation }}
                exit={{ opacity: 0, scale: 0, y: -100 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
              >
                ♡
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Center hint */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            animate={{ opacity: heartCount > 10 ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="text-6xl mb-4"
              animate={reduceMotion ? {} : { scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🤍
            </motion.span>
            <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
              Click / tap anywhere
            </p>
          </motion.div>

          {/* Progress indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {Array.from({ length: data.maxHearts }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i < heartCount ? "#ec4899" : "rgba(249, 168, 212, 0.3)",
                  transform: `scale(${i < heartCount ? 1.2 : 1})`,
                }}
                animate={{ scale: i === heartCount - 1 && !reduceMotion ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Reveal message */}
        <AnimatePresence>
          {showMessage && (
            <motion.div
              key="message"
              className="mt-8 p-6 md:p-8 rounded-2xl max-w-xl mx-auto"
              style={{
                background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                border: "1px solid #f9a8d4",
                boxShadow: "0 20px 60px rgba(236, 72, 153, 0.15)",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
            >
              <p className="whitespace-pre-line text-center" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d", fontSize: "1.5rem", lineHeight: 1.6 }}>
                {data.revealMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background floating hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              color: heartColors[Math.floor(Math.random() * heartColors.length)],
              opacity: 0.06,
            }}
            animate={reduceMotion ? {} : { y: [0, -30, 0], rotate: [-10, 10, -10], opacity: [0.03, 0.08, 0.03] }}
            transition={{
              duration: 6 + Math.random() * 4,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ♡
          </motion.span>
        ))}
      </div>
    </section>
  );
}