"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HiddenMessage {
  id: number;
  trigger: string;
  message: string;
  type: string;
}

interface HiddenMessagesContextType {
  messages: HiddenMessage[];
  revealedMessages: Set<number>;
  revealMessage: (id: number) => void;
  reduceMotion: boolean;
}

const HiddenMessagesContext = createContext<HiddenMessagesContextType | null>(null);

export function useHiddenMessages() {
  const context = useContext(HiddenMessagesContext);
  if (!context) {
    throw new Error("useHiddenMessages must be used within HiddenMessagesProvider");
  }
  return context;
}

interface HiddenMessagesProviderProps {
  children?: ReactNode;
  data: HiddenMessage[];
  reduceMotion: boolean;
}

export function HiddenMessagesProvider({ children, data, reduceMotion }: HiddenMessagesProviderProps) {
  const [revealedMessages, setRevealedMessages] = useState<Set<number>>(new Set());

  const revealMessage = (id: number) => {
    setRevealedMessages(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const value = useMemo(() => ({
    messages: data,
    revealedMessages,
    revealMessage,
    reduceMotion,
  }), [data, revealedMessages, reduceMotion]);

  return (
    <HiddenMessagesContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {Array.from(revealedMessages).slice(-1).map((id) => {
          const message = data.find(m => m.id === id);
          if (!message) return null;
          return (
            <motion.div
              key={id}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
            >
              <div className="relative p-5 md:p-6 rounded-2xl text-center" style={{
                background: "linear-gradient(135deg, #1a0d14, #2a1220)",
                border: "1px solid rgba(249, 168, 212, 0.3)",
                boxShadow: "0 25px 80px rgba(236, 72, 153, 0.2)",
              }}>
                <div className="text-3xl mb-3">💫</div>
                <p className="text-base leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#fce7f3", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                  {message.message}
                </p>
                <motion.p
                  className="mt-4 text-xs font-medium"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f9a8d4" }}
                  animate={reduceMotion ? {} : { opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  Hidden message found ♡
                </motion.p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </HiddenMessagesContext.Provider>
  );
}

export default HiddenMessagesProvider;