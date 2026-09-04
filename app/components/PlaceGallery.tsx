"use client";

import { useState } from "react";

type PlaceGalleryProps = {
  images: string[];
  placeName: string;
};

export default function PlaceGallery({
  images,
  placeName,
}: PlaceGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
  }

  const showPrevious = () => {
    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <>
      <section className="mt-16 border-t border-stone-200 pt-10">
        <div className="flex items-end justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
            Photos
          </p>

          {images.length > 1 && (
            <p className="text-xs text-stone-400">
              {currentIndex + 1} / {images.length}
            </p>
          )}
        </div>

        <div className="relative mt-5 overflow-hidden rounded-2xl bg-stone-200">
          <button
            type="button"
            onClick={() => setSelectedIndex(currentIndex)}
            className="block aspect-[16/9] w-full"
            aria-label={`Enlarge ${placeName} photo ${currentIndex + 1}`}
          >
            <img
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt={`${placeName} photo ${currentIndex + 1}`}
              className="h-full w-full object-cover"
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-stone-50/90 text-lg text-stone-700 backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous photo"
              >
                ←
              </button>

              <button
                type="button"
                onClick={showNext}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-stone-50/90 text-lg text-stone-700 backdrop-blur-sm transition hover:bg-white"
                aria-label="Next photo"
              >
                →
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === index
                    ? "w-6 bg-stone-500"
                    : "w-1.5 bg-stone-300 hover:bg-stone-400"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-stone-950/80 p-6">
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-6 top-6 text-2xl text-white/80 transition hover:text-white"
            aria-label="Close gallery"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((current) =>
                  current === null
                    ? null
                    : current === 0
                      ? images.length - 1
                      : current - 1
                )
              }
              className="absolute left-6 text-3xl text-white/70 transition hover:text-white"
              aria-label="Previous photo"
            >
              ←
            </button>
          )}

          <img
            src={images[selectedIndex]}
            alt={`${placeName} photo ${selectedIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((current) =>
                  current === null
                    ? null
                    : current === images.length - 1
                      ? 0
                      : current + 1
                )
              }
              className="absolute right-6 text-3xl text-white/70 transition hover:text-white"
              aria-label="Next photo"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}