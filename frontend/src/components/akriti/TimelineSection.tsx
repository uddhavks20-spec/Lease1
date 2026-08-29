"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface TimelineSectionProps {
  data: {
    metOnline: string;
    startedTalking: string;
    becameCouple: string;
    firstMeeting: string;
  };
  reduceMotion: boolean;
}

const timelineItems = [
  {
    date: "17 July 2024",
    shortDate: "17.07.2024",
    title: "We met in a random group chat.",
    description: "A random group chat. Neither of us knew it then, but this was the start of everything.",
    icon: "💬",
    isSpecial: false,
  },
  {
    date: "20 July 2024",
    shortDate: "20.07.2024",
    title: "We started talking.",
    description: "First real conversation. The kind that makes you lose track of time.",
    icon: "💭",
    isSpecial: false,
  },
  {
    date: "17 July 2024 → 15 June 2025",
    shortDate: "17.07.2024 – 15.06.2025",
    title: "Friends. Best friends, actually.",
    description: "Technically we were just friends.\nEmotionally... yeah, that's debatable.",
    icon: "🤝",
    isSpecial: true,
    note: "Technically we were just friends.\nEmotionally... yeah, that's debatable.",
  },
  {
    date: "16 June 2025",
    shortDate: "16 • 06 • 2025",
    title: "Somewhere along the way, my best friend became my girlfriend.",
    description: "Our official beginning.",
    icon: "♡",
    isSpecial: true,
    isAnniversary: true,
  },
];

export default function TimelineSection({ data, reduceMotion }: TimelineSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative" aria-labelledby="timeline-heading">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(249, 168, 212, 0.08) 0%, transparent 70%)" }}
      />

      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="timeline-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Before we were us...
        </h2>
        <p className="text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Every story has a beginning. Ours started in the most unexpected place.
        </p>
      </motion.div>

      <div className="relative" style={{ position: "relative" }}>
        {/* Vertical line */}
        <motion.div
          className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
          style={{ background: "linear-gradient(to bottom, transparent, #f9a8d4, transparent)" }}
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1.2, delay: 0.3, ease: "easeOut" }}
        />

        <div className="space-y-12 md:space-y-16">
          {timelineItems.map((item, index) => (
            <motion.div
              key={item.date}
              className="relative flex flex-col md:flex-row items-center"
              style={{ gap: "2rem" }}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.4 + index * 0.15, ease: "easeOut" }}
            >
              {/* Date marker */}
              <motion.div
                className="relative flex-shrink-0 w-10 md:w-16 h-10 md:h-16 rounded-full flex items-center justify-center z-10"
                style={{
                  background: item.isAnniversary ? "linear-gradient(135deg, #ec4899, #f9a8d4)" : "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                  boxShadow: item.isAnniversary ? "0 0 40px rgba(236, 72, 153, 0.5)" : "0 4px 20px rgba(251, 207, 232, 0.5)",
                  border: item.isAnniversary ? "3px solid #fff" : "2px solid #f9a8d4",
                }}
                animate={reduceMotion || !item.isAnniversary ? {} : { boxShadow: ["0 0 40px rgba(236, 72, 153, 0.5)", "0 0 60px rgba(236, 72, 153, 0.8)", "0 0 40px rgba(236, 72, 153, 0.5)"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {item.isAnniversary ? (
                  <span className="text-2xl font-bold" style={{ color: "#fff", fontFamily: "'Dancing Script', cursive" }}>
                    16•06•25
                  </span>
                ) : (
                  <span className="text-xl" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>{item.icon}</span>
                )}
              </motion.div>

              {/* Content card */}
              <motion.div
                className={`w-full md:w-1/2 relative p-6 md:p-8 rounded-2xl ${index % 2 === 0 ? "md:mr-auto text-right" : "md:ml-auto"}`}
                style={{
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(251, 207, 232, 0.5)",
                  boxShadow: "0 10px 40px rgba(236, 72, 153, 0.08)",
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899", letterSpacing: "0.1em" }}>
                  {item.shortDate}
                </p>
                <h3 className="text-xl md:text-2xl font-medium mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                  {item.title}
                </h3>
                {item.note ? (
                  <p className="text-base leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", fontStyle: "italic" }}>
                    {item.note}
                  </p>
                ) : (
                  <p className="text-base leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                    {item.description}
                  </p>
                )}
                {item.isAnniversary && (
                  <motion.p
                    className="mt-4 text-sm font-medium"
                    style={{ fontFamily: "'Dancing Script', cursive", color: "#ec4899" }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    Our official beginning. ♡
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .timeline-line {
            left: 2.5rem !important;
          }
          .timeline-content {
            margin-left: 5rem !important;
            text-align: left !important;
          }
        }
      `}</style>
    </section>
  );
}