"use client";

import Image from "next/image";
import { useState } from "react";
import ResetSwipeCarousel from "@/components/ResetSwipeCarousel";
import VideoPlayer from "@/components/VideoPlayer";
import type { ResetCode } from "@/data/resetCode";
import { useIsMobile } from "@/lib/useIsMobile";

type ResetInit = {
  id: string;
  label: string;
  poster: string;
  video: string;
};

export function ResetVideoCasePanel({
  ariaLabel,
  initialStates,
  code,
}: {
  ariaLabel: string;
  initialStates: ResetInit[];
  code?: ResetCode;
}) {
  const [selectedId, setSelectedId] = useState(initialStates[0]?.id ?? "");
  const selectedState = initialStates.find((state) => state.id === selectedId) ?? initialStates[0];
  const isMobile = useIsMobile();

  const advance = () => {
    const i = initialStates.findIndex((state) => state.id === selectedId);
    setSelectedId(initialStates[(i + 1) % initialStates.length].id);
  };

  if (!selectedState) return null;

  if (isMobile) {
    return <ResetSwipeCarousel ariaLabel={ariaLabel} initialStates={initialStates} />;
  }

  return (
    <section className="pusht-reset-case" aria-label={ariaLabel}>
      <div className="pusht-reset-case__video">
        <VideoPlayer
          autoPlay
          key={selectedState.id}
          code={code}
          onEnded={advance}
          poster={selectedState.poster}
          src={selectedState.video}
          title={`${ariaLabel}: ${selectedState.label}`}
        />
      </div>
      <div className="pusht-reset-case__gallery" aria-label={`${ariaLabel} initial positions`}>
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
