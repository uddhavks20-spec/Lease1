"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

interface FutureSectionProps {
  data: {
    travel: Array<{ id: number; destination: string; illustration: string; why: string; status: string }>;
    dates: Array<{ id: number; idea: string; editable: boolean }>;
    checklist: Array<{ id: number; text: string; done: boolean }>;
  };
  reduceMotion: boolean;
}

export default function FutureSection({ data, reduceMotion }: FutureSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheck = (id: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section ref={ref} className="relative space-y-16 md:space-y-20" aria-labelledby="future-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="future-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Things we haven't done yet.
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          A bucket list for us. Someday isn't a date — it's a promise.
        </p>
      </motion.div>

      {/* Places to Travel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: "easeOut" }}
      >
        <h3 className="text-xl md:text-2xl font-medium mb-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          Places we want to travel
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.travel.map((place, index) => (
            <motion.div
              key={place.id}
              className="relative p-6 rounded-2xl group h-full"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                display: "flex",
                flexDirection: "column",
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.3 + index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(236, 72, 153, 0.15)" }}
            >
              <div className="text-4xl mb-4 text-center" style={{ opacity: 0.8 }}>{place.illustration}</div>
              <p className="text-lg font-medium mb-2 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: place.destination ? "#1f1f1f" : "#6b6b6b", fontStyle: place.destination ? "normal" : "italic" }}>
                {place.destination || "Add a destination"}
              </p>
              {place.why && (
                <p className="text-sm flex-1 mt-2" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{place.why}"
                </p>
              )}
              <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: "rgba(251, 207, 232, 0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                Status: {place.status}
              </div>
              {!place.destination && (
                <p className="text-xs mt-2 text-center" style={{ fontFamily: "'Inter', sans-serif", color: "#ec4899", opacity: 0.7 }}>
                  Tap to edit
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Future Dates */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.4, ease: "easeOut" }}
      >
        <h3 className="text-xl md:text-2xl font-medium mb-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          Future dates
        </h3>
        <div className="space-y-4 max-w-2xl mx-auto">
          {data.dates.map((date, index) => (
            <motion.div
              key={date.id}
              className="relative p-5 md:p-6 rounded-2xl flex items-center gap-4"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(251, 207, 232, 0.5)",
                boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
              }}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.5 + index * 0.08, ease: "easeOut" }}
              whileHover={{ y: -4, boxShadow: "0 15px 40px rgba(236, 72, 153, 0.12)" }}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{
                background: "linear-gradient(135deg, rgba(249, 168, 212, 0.2), rgba(252, 231, 243, 0.3))",
                color: "#be185d",
              }}>
                💑
              </div>
              <p className="text-base leading-relaxed flex-1" style={{ fontFamily: "'Inter', sans-serif", color: date.idea ? "#1f1f1f" : "#6b6b6b", fontStyle: date.idea ? "normal" : "italic" }}>
                {date.idea || "Add a date idea"}
              </p>
              {!date.idea && (
                <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(249, 168, 212, 0.1)", color: "#ec4899", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Edit
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.6, ease: "easeOut" }}
      >
        <h3 className="text-xl md:text-2xl font-medium mb-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
          Things we still need to do together
        </h3>
        <div className="space-y-3 max-w-xl mx-auto">
          {data.checklist.map((item, index) => {
            const isDone = checkedItems.has(item.id);
            return (
              <motion.div
                key={item.id}
                className="relative p-4 md:p-5 rounded-2xl flex items-center gap-4 group"
                style={{
                  background: isDone
                    ? "linear-gradient(135deg, rgba(249, 168, 212, 0.15), rgba(252, 231, 243, 0.1))"
                    : "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  border: isDone ? "1px solid #f9a8d4" : "1px solid rgba(251, 207, 232, 0.5)",
                  boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: 0.7 + index * 0.06, ease: "easeOut" }}
                whileHover={{ y: -2 }}
                onClick={() => toggleCheck(item.id)}
              >
                <motion.div
                  className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: isDone
                      ? "linear-gradient(135deg, #ec4899, #f9a8d4)"
                      : "transparent",
                    border: isDone ? "none" : "2px solid #f9a8d4",
                    color: "#fff",
                  }}
                  animate={{ scale: isDone ? 1 : 0.9, rotate: isDone ? 0 : -10 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                >
                  {isDone && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {!isDone && (
                    <motion.span
                      className="text-xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🤍
                    </motion.span>
                  )}
                </motion.div>
                <p className="text-base leading-relaxed flex-1" style={{
                  fontFamily: "'Inter', sans-serif",
                  color: isDone ? "#be185d" : "#1f1f1f",
                  textDecoration: isDone ? "line-through" : "none",
                  opacity: isDone ? 0.7 : 1,
                  lineHeight: 1.6,
                }}>
                  {item.text}
                </p>
                {isDone && (
                  <motion.span
                    className="text-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
                  >
                    💗
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}