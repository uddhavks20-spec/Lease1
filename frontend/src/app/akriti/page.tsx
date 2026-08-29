"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { relationshipData } from "@/data/akriti-website";

// Components
const OpeningScreen = dynamic(() => import("@/components/akriti/OpeningScreen"), { ssr: false });
const TimelineSection = dynamic(() => import("@/components/akriti/TimelineSection"), { ssr: false });
const FirstMeetingSection = dynamic(() => import("@/components/akriti/FirstMeetingSection"), { ssr: false });
const NotNormalCoupleSection = dynamic(() => import("@/components/akriti/NotNormalCoupleSection"), { ssr: false });
const ThingsAboutAkritiSection = dynamic(() => import("@/components/akriti/ThingsAboutAkritiSection"), { ssr: false });
const ReasonsJarSection = dynamic(() => import("@/components/akriti/ReasonsJarSection"), { ssr: false });
const PhotoWallSection = dynamic(() => import("@/components/akriti/PhotoWallSection"), { ssr: false });
const OpenWhenSection = dynamic(() => import("@/components/akriti/OpenWhenSection"), { ssr: false });
const ApologySection = dynamic(() => import("@/components/akriti/ApologySection"), { ssr: false });
const LoveLetterSection = dynamic(() => import("@/components/akriti/LoveLetterSection"), { ssr: false });
const FutureSection = dynamic(() => import("@/components/akriti/FutureSection"), { ssr: false });
const LittleThingsSection = dynamic(() => import("@/components/akriti/LittleThingsSection"), { ssr: false });
const HeartGameSection = dynamic(() => import("@/components/akriti/HeartGameSection"), { ssr: false });
const FinalSection = dynamic(() => import("@/components/akriti/FinalSection"), { ssr: false });
const HiddenMessagesProvider = dynamic(() => import("@/components/akriti/HiddenMessagesProvider"), { ssr: false });
const FloatingElements = dynamic(() => import("@/components/akriti/FloatingElements"), { ssr: false });

export default function AkritiPage() {
  const [showMainContent, setShowMainContent] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleEnter = useCallback(() => {
    setShowMainContent(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] overflow-x-hidden relative" style={{ background: "#fff1f7" }}>
      <style jsx global>{`
        :root {
          --bg: #fff1f7;
          --text: #1f1f1f;
          --text-muted: #6b6b6b;
          --primary: #fce7f3;
          --secondary: #fbcfe8;
          --accent: #f9a8d4;
          --deep: #ec4899;
          --darker: #be185d;
          --surface: #ffffff;
          --star: #fdf2f8;
          --moon: #fce7f3;
          --cloud: #fdf2f8;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #1a0d14;
            --text: #fdf2f8;
            --text-muted: #a8a8a8;
            --primary: #4a1d33;
            --secondary: #6b2d4a;
            --accent: #f9a8d4;
            --deep: #f472b6;
            --darker: #f9a8d4;
            --surface: #2a1220;
            --star: #4a1d33;
            --moon: #3a1a2a;
            --cloud: #2a1220;
          }
        }
        @font-face {
          font-family: 'Dancing Script';
          src: url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap');
        }
        @font-face {
          font-family: 'Plus Jakarta Sans';
          src: url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        }
        @font-face {
          font-family: 'Inter';
          src: url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        }
      `}</style>

      <HiddenMessagesProvider data={relationshipData.hiddenMessages} reduceMotion={reduceMotion} />

      <FloatingElements reduceMotion={reduceMotion} />

      <AnimatePresence mode="wait">
        {!showMainContent && (
          <OpeningScreen
            key="opening"
            onEnter={handleEnter}
            reduceMotion={reduceMotion}
            data={relationshipData}
          />
        )}
      </AnimatePresence>

      {showMainContent && (
        <main className="relative z-10" style={{ willChange: "transform" }}>
          <TimelineSection data={relationshipData.timeline} reduceMotion={reduceMotion} />
          <FirstMeetingSection data={relationshipData.firstMeetingStops} reduceMotion={reduceMotion} />
          <NotNormalCoupleSection data={relationshipData.insideJokes} reduceMotion={reduceMotion} />
          <ThingsAboutAkritiSection data={relationshipData.thingsAboutAkriti} reduceMotion={reduceMotion} />
          <ReasonsJarSection data={relationshipData.loveReasons} reduceMotion={reduceMotion} />
          <PhotoWallSection data={relationshipData.photoMemories} reduceMotion={reduceMotion} />
          <OpenWhenSection data={relationshipData.openWhenLetters} reduceMotion={reduceMotion} />
          <ApologySection data={relationshipData.apology} reduceMotion={reduceMotion} />
          <LoveLetterSection data={relationshipData.loveLetter} reduceMotion={reduceMotion} />
          <FutureSection data={relationshipData.future} reduceMotion={reduceMotion} />
          <LittleThingsSection data={relationshipData.littleThings} reduceMotion={reduceMotion} />
          <HeartGameSection data={relationshipData.heartGame} reduceMotion={reduceMotion} />
          <FinalSection data={relationshipData.finalSection} reduceMotion={reduceMotion} />
        </main>
      )}

      <style jsx>{`
        main {
          min-height: 100vh;
        }
        section {
          padding: 4rem 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          section {
            padding: 3rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}