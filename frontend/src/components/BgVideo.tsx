"use client";

import { useEffect, useRef } from "react";

export function BgVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.playbackRate = 0.25;
    }
  }, []);

  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      className="fixed inset-0 w-full h-full object-cover scale-110 pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <source src="/bg-video.mp4" type="video/mp4" />
    </video>
  );
}
