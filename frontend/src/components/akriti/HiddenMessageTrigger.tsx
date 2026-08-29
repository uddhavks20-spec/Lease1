"use client";

import { motion } from "framer-motion";
import { useHiddenMessages } from "./HiddenMessagesProvider";

interface HiddenMessageTriggerProps {
  triggerId: string;
  children: React.ReactNode;
  className?: string;
}

export function HiddenMessageTrigger({ triggerId, children, className = "" }: HiddenMessageTriggerProps) {
  const { messages, revealedMessages, revealMessage, reduceMotion } = useHiddenMessages();
  
  const message = messages.find(m => m.trigger === triggerId);
  const isRevealed = message ? revealedMessages.has(message.id) : false;

  if (!message) return <>{children}</>;

  return (
    <motion.span
      className={`relative inline-block cursor-pointer ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!isRevealed) revealMessage(message.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isRevealed) revealMessage(message.id); }}}
      aria-label={isRevealed ? "Hidden message already found" : "Discover hidden message"}
      whileHover={reduceMotion ? {} : { scale: 1.2, rotate: [0, 5, -5, 0] }}
      whileTap={reduceMotion ? {} : { scale: 0.9 }}
      animate={reduceMotion ? {} : { y: [0, -3, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
      {!isRevealed && (
        <motion.span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
          style={{ background: "rgba(249, 168, 212, 0.8)", color: "#fff" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: 2, ease: "easeOut" }}
        >
          ?
        </motion.span>
      )}
    </motion.span>
  );
}

export default HiddenMessageTrigger;