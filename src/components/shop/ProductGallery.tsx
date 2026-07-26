"use client";

import { useState } from "react";
import { CategoryIllustration } from "./Illustrations";

export type GalleryShot = {
  src: string;
  caption: string;
};

/**
 * Product image viewer: one large frame plus thumbnails. With no images at
 * all it renders the category illustration, so a freshly created product
 * still looks finished before any asset is attached.
 */
export function ProductGallery({
  shots,
  category,
  title,
}: {
  shots: GalleryShot[];
  category: string;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const active = shots[index];

  return (
    <div className="space-y-3">
      <div
        className="aspect-square overflow-hidden border"
        style={{ borderColor: "#e6dfd0", backgroundColor: "#f5f0e8" }}
      >
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.src}
            alt={active.caption || title}
            className="w-full h-full object-contain"
          />
        ) : (
          <CategoryIllustration category={category} className="w-full h-full" />
        )}
      </div>

      {shots.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {shots.map((shot, i) => (
            <button
              key={`${shot.src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={shot.caption || `View image ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="aspect-square overflow-hidden border transition-opacity hover:opacity-80"
              style={{
                borderColor: i === index ? "#2d5a3d" : "#e6dfd0",
                backgroundColor: "#f5f0e8",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {active?.caption && <p className="text-[11px] opacity-45">{active.caption}</p>}
    </div>
  );
}
