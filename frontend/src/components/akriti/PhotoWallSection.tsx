"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

interface PhotoWallSectionProps {
  data: Array<{ id: number; label: string; date: string; caption: string; memory: string; placeholder: string }>;
  reduceMotion: boolean;
}

const rotations = [-3, 2, -2, 4, -4, 1, -1, 3, -2, 2];

export default function PhotoWallSection({ data, reduceMotion }: PhotoWallSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPhoto, setSelectedPhoto] = useState<typeof data[0] | null>(null);

  const photosWithContent = data.filter(p => p.caption || p.memory);
  const emptyPhotos = data.filter(p => !p.caption && !p.memory);

  return (
    <section ref={ref} className="relative" aria-labelledby="photos-heading" style={{ background: "linear-gradient(180deg, transparent, rgba(249, 168, 212, 0.03), transparent)" }}>
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      >
        <h2 id="photos-heading" className="text-3xl md:text-5xl font-light mb-4" style={{ fontFamily: "'Dancing Script', cursive", color: "#be185d" }}>
          Our Photo Wall
        </h2>
        <p className="text-base max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", lineHeight: 1.8 }}>
          Polaroids from our story. {photosWithContent.length} filled, {emptyPhotos.length} waiting for memories.
        </p>
      </motion.div>

      {/* Photo Grid */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.2, ease: "easeOut" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8" role="list" aria-label="Photo memories">
          {data.map((photo, index) => (
            <motion.article
              key={photo.id}
              className="relative group"
              style={{ perspective: "1000px" }}
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: 0.3 + index * 0.08, ease: "easeOut" }}
              whileHover={{ zIndex: 10, y: -8 }}
              role="listitem"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div
                className="relative"
                style={{
                  transform: `rotate(${rotations[index % rotations.length]}deg)`,
                  transition: "transform 0.3s ease",
                }}
              >
                {/* Polaroid frame */}
                <div className="relative" style={{
                  background: "#fff",
                  borderRadius: "4px",
                  boxShadow: "0 10px 40px rgba(236, 72, 153, 0.15), 0 4px 15px rgba(0,0,0,0.08)",
                  padding: "16px 16px 40px 16px",
                  minHeight: "320px",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  {/* Photo area */}
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0" style={{
                    background: photo.caption || photo.memory
                      ? "linear-gradient(145deg, rgba(252, 231, 243, 0.3), rgba(251, 207, 232, 0.2))"
                      : "linear-gradient(145deg, rgba(252, 231, 243, 0.5), rgba(251, 207, 232, 0.3))",
                    border: photo.caption || photo.memory ? "1px solid rgba(249, 168, 212, 0.3)" : "2px dashed rgba(249, 168, 212, 0.4)",
                  }}>
                    {(photo.caption || photo.memory) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                          {photo.placeholder}
                        </p>
                        <p className="text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                          Tap to view
                        </p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <div className="text-4xl mb-2">📷</div>
                        <p className="text-sm font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                          {photo.placeholder}
                        </p>
                        <p className="text-xs mt-1" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                          Tap to add photo
                        </p>
                      </div>
                    )}
                    {/* Tape on top */}
                    <motion.div
                      className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-16 h-8 rounded"
                      style={{
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid rgba(249, 168, 212, 0.2)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        transform: `rotate(${(Math.random() - 0.5) * 10}deg)`,
                      }}
                      animate={reduceMotion ? {} : { y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Caption area */}
                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div>
                      {photo.date && (
                        <p className="text-xs font-medium mb-1" style={{ fontFamily: "'Dancing Script', cursive", color: "#ec4899" }}>
                          {photo.date}
                        </p>
                      )}
                      {photo.caption && (
                        <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                          {photo.caption}
                        </p>
                      )}
                      {photo.memory && (
                        <p className="text-xs leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", fontStyle: "italic", lineHeight: 1.6 }}>
                          {photo.memory}
                        </p>
                      )}
                    </div>
                    {!photo.caption && !photo.memory && (
                      <p className="text-xs text-center" style={{ fontFamily: "'Inter', sans-serif", color: "#ec4899", opacity: 0.7 }}>
                        Waiting for a memory...
                      </p>
                    )}
                  </div>
                </div>

                {/* Label at bottom of polaroid */}
                <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-medium whitespace-nowrap" style={{
                  background: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
                  border: "1px solid #f9a8d4",
                  color: "#be185d",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 2px 8px rgba(249, 168, 212, 0.3)",
                }}>
                  {photo.label}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            role="dialog"
            aria-label={`Memory: ${selectedPhoto.caption || selectedPhoto.label}`}
          >
            <motion.div
              className="relative max-w-3xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Polaroid in lightbox */}
              <div className="relative" style={{
                background: "#fff",
                borderRadius: "4px",
                boxShadow: "0 25px 80px rgba(236, 72, 153, 0.2), 0 10px 40px rgba(0,0,0,0.15)",
                padding: "24px 24px 60px 24px",
                transform: `rotate(${rotations[selectedPhoto.id % rotations.length]}deg)`,
              }}>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{
                  background: selectedPhoto.caption || selectedPhoto.memory
                    ? "linear-gradient(145deg, rgba(252, 231, 243, 0.3), rgba(251, 207, 232, 0.2))"
                    : "linear-gradient(145deg, rgba(252, 231, 243, 0.5), rgba(251, 207, 232, 0.3))",
                  border: selectedPhoto.caption || selectedPhoto.memory ? "1px solid rgba(249, 168, 212, 0.3)" : "2px dashed rgba(249, 168, 212, 0.4)",
                }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-lg font-medium mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#ec4899" }}>
                      {selectedPhoto.placeholder}
                    </p>
                    <p className="text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b" }}>
                      {selectedPhoto.caption || selectedPhoto.memory ? "Tap to replace with your photo" : "Add your photo here"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  {selectedPhoto.date && (
                    <p className="text-lg font-medium mb-2" style={{ fontFamily: "'Dancing Script', cursive", color: "#ec4899" }}>
                      {selectedPhoto.date}
                    </p>
                  )}
                  {selectedPhoto.caption && (
                    <p className="text-xl font-medium mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1f1f1f" }}>
                      {selectedPhoto.caption}
                    </p>
                  )}
                  {selectedPhoto.memory && (
                    <p className="text-base leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", color: "#6b6b6b", fontStyle: "italic", lineHeight: 1.8 }}>
                      {selectedPhoto.memory}
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                className="absolute -top-12 right-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(26, 13, 20, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(249, 168, 212, 0.3)",
                  color: "#fce7f3",
                }}
                onClick={() => setSelectedPhoto(null)}
                whileHover={{ scale: 1.1, background: "rgba(236, 72, 153, 0.8)" }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}