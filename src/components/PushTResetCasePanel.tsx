"use client";

import Image from "next/image";
import { useState } from "react";
import ResetSwipeCarousel from "@/components/ResetSwipeCarousel";
import VideoPlayer from "@/components/VideoPlayer";
import { useIsMobile } from "@/lib/useIsMobile";

const initialStates = [
  {
    id: "init-1",
    label: "Random Init 1",
    poster: "/images/pusht-reset-only-1-frame.jpg",
    video: "/videos/pusht-reset-only-1.mp4",
  },
  {
    id: "init-2",
    label: "Random Init 2",
    poster: "/images/pusht-reset-only-2-frame.jpg",
    video: "/videos/pusht-reset-only-2.mp4",
  },
  {
    id: "init-3",
    label: "Random Init 3",
    poster: "/images/pusht-reset-only-3-frame.jpg",
    video: "/videos/pusht-reset-only-3.mp4",
  },
  {
    id: "init-4",
    label: "Random Init 4",
    poster: "/images/pusht-reset-only-4-frame.jpg",
    video: "/videos/pusht-reset-only-4.mp4",
  },
];

export default function PushTResetCasePanel() {
  const [selectedId, setSelectedId] = useState(initialStates[0].id);
  const selectedState = initialStates.find((state) => state.id === selectedId) ?? initialStates[0];
  const isMobile = useIsMobile();

  const advance = () => {
    const i = initialStates.findIndex((state) => state.id === selectedId);
    setSelectedId(initialStates[(i + 1) % initialStates.length].id);
  };

  if (isMobile) {
    return <ResetSwipeCarousel ariaLabel="Case 1 Push T auto reset" initialStates={initialStates} />;
  }

  return (
    <section className="pusht-reset-case" aria-label="Case 1 Push T auto reset">
      <div className="pusht-reset-case__video">
        <VideoPlayer
          autoPlay
          key={selectedState.id}
          onEnded={advance}
          poster={selectedState.poster}
          src={selectedState.video}
          title={`Case 1 Push T auto reset: ${selectedState.label}`}
        />
      </div>
      <div className="pusht-reset-case__gallery" aria-label="Push T initial positions">
        {initialStates.map((state) => (
          <button
            aria-pressed={selectedId === state.id}
            className="pusht-reset-case__preset"
            data-selected={selectedId === state.id}
            key={state.id}
            onClick={() => setSelectedId(state.id)}
            type="button"
          >
            <Image alt="" height={135} src={state.poster} width={240} />
            <span>{state.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
