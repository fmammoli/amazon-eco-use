"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { SectionCard } from "@/components/dashboard/plant-details-drawer/SectionCard"

export type INaturalistGalleryImage = {
  thumbUrl: string
  largeUrl: string
  attribution?: string
  photographer?: string
  observationUrl?: string
  licenseCode?: string
}

const normalizeInaturalistHost = (url: string) => {
  return url.replace(
    "https://static.inaturalist.org/",
    "https://inaturalist-open-data.s3.amazonaws.com/"
  )
}

const replacePhotoSize = (url: string, size: "square" | "medium" | "large") => {
  return url.replace(
    /\/(square|medium|large)\.(jpg|jpeg|png|webp)(\?.*)?$/i,
    `/${size}.$2$3`
  )
}

const buildImageFallbacks = (
  sourceUrl: string,
  preferredSize: "square" | "medium"
) => {
  const hostNormalized = normalizeInaturalistHost(sourceUrl)
  const candidates =
    preferredSize === "square"
      ? [
          sourceUrl,
          hostNormalized,
          replacePhotoSize(sourceUrl, "square"),
          replacePhotoSize(hostNormalized, "square"),
          replacePhotoSize(hostNormalized, "medium"),
        ]
      : [
          sourceUrl,
          hostNormalized,
          replacePhotoSize(sourceUrl, "medium"),
          replacePhotoSize(hostNormalized, "medium"),
          replacePhotoSize(hostNormalized, "large"),
          replacePhotoSize(hostNormalized, "square"),
        ]

  return Array.from(new Set(candidates.filter(Boolean)))
}

function FallbackImage({
  candidates,
  alt,
  className,
  variant,
}: {
  candidates: string[]
  alt: string
  className: string
  variant: "thumb" | "large"
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (candidates.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/40 text-[10px] text-muted-foreground ${className}`}
      >
        No image
      </div>
    )
  }

  return (
    <>
      {variant === "thumb" ? (
        <Image
          src={candidates[activeIndex]}
          alt={alt}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, 33vw"
          className={className}
          onError={() => {
            setActiveIndex((current) =>
              current + 1 < candidates.length ? current + 1 : current
            )
          }}
        />
      ) : (
        <Image
          src={candidates[activeIndex]}
          alt={alt}
          width={1400}
          height={1000}
          unoptimized
          className={className}
          onError={() => {
            setActiveIndex((current) =>
              current + 1 < candidates.length ? current + 1 : current
            )
          }}
        />
      )}
    </>
  )
}

export function ImageGallerySection({
  images,
}: {
  images: INaturalistGalleryImage[]
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedIndex])

  if (images.length === 0) return null

  const selectedImage =
    selectedIndex !== null ? (images[selectedIndex] ?? null) : null
  const selectedImageLabel =
    selectedImage?.photographer ??
    `iNaturalist image ${selectedIndex !== null ? selectedIndex + 1 : 1}`

  return (
    <>
      <SectionCard title="iNaturalist Gallery">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image, index) => (
            <button
              key={`${image.largeUrl}-${index}`}
              type="button"
              className="relative overflow-hidden rounded-md border border-border bg-muted/30 transition hover:border-foreground/30 hover:bg-muted/60"
              onClick={() => setSelectedIndex(index)}
            >
              <div className="relative h-24 w-full">
                <FallbackImage
                  key={`${image.thumbUrl}-${index}`}
                  candidates={buildImageFallbacks(image.thumbUrl, "square")}
                  alt={image.photographer ?? `iNaturalist image ${index + 1}`}
                  className="object-cover"
                  variant="thumb"
                />
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-3xl rounded-xl border border-white/10 bg-background p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged iNaturalist image"
          >
            <button
              type="button"
              className="absolute top-3 right-3 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50"
              onClick={() => setSelectedIndex(null)}
            >
              Close
            </button>

            <div className="flex max-h-[80vh] flex-col gap-3">
              <div className="flex items-center justify-center overflow-hidden rounded-lg bg-black/5">
                <FallbackImage
                  key={selectedImage.largeUrl}
                  candidates={buildImageFallbacks(
                    selectedImage.largeUrl,
                    "medium"
                  )}
                  alt={selectedImageLabel}
                  className="max-h-[62vh] w-auto max-w-full object-contain"
                  variant="large"
                />
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Attribution</p>
                <p>
                  {selectedImage.attribution ?? "No attribution available."}
                </p>

                {selectedImage.observationUrl ? (
                  <a
                    href={selectedImage.observationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-foreground underline underline-offset-2"
                  >
                    View observation on iNaturalist
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
