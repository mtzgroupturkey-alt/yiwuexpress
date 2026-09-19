'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<1 | 2.5>(1)
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const thumbnailStripRef = useRef<HTMLDivElement>(null)
  const lightboxThumbnailsRef = useRef<HTMLDivElement>(null)

  const rawImages = images && images.length > 0 ? images.filter(Boolean) : []
  const displayImages = rawImages.length > 0 ? rawImages : ['/images/product-placeholder.webp']

  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    setFailedIndices(new Set())
  }, [images])

  const handleImageError = (index: number) => {
    setFailedIndices((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const getImageSrc = (index: number) => {
    if (failedIndices.has(index)) {
      return '/images/product-placeholder.webp'
    }
    return displayImages[index] || '/images/product-placeholder.webp'
  }

  // Keep index within bounds if image count changes (e.g. variant switch)
  const safeIndex = currentIndex >= displayImages.length ? 0 : currentIndex

  const goToPrevious = useCallback(() => {
    setZoomLevel(1)
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }, [displayImages.length])

  const goToNext = useCallback(() => {
    setZoomLevel(1)
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }, [displayImages.length])

  const selectIndex = (index: number) => {
    setZoomLevel(1)
    setCurrentIndex(index)
  }

  // Mobile touch swipe handling
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current
      const minSwipeDistance = 35
      if (diff > minSwipeDistance) {
        goToNext()
      } else if (diff < -minSwipeDistance) {
        goToPrevious()
      }
    }
    touchStartX.current = null
    touchEndX.current = null
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isZoomed) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomed(false)
        setZoomLevel(1)
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isZoomed, goToPrevious, goToNext])

  // Scroll thumbnails in standard view
  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailStripRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      thumbnailStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Scroll thumbnails in lightbox view
  const scrollLightboxThumbnails = (direction: 'left' | 'right') => {
    if (lightboxThumbnailsRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      lightboxThumbnailsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Mouse move pan for 2.5x zoom
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel === 1) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setPanOrigin({ x, y })
  }

  // Toggle zoom level at click position
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (zoomLevel === 1) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      setPanOrigin({ x, y })
      setZoomLevel(2.5)
    } else {
      setZoomLevel(1)
    }
  }

  return (
    <>
      <div className="space-y-3 select-none">
        {/* Main Image Container */}
        <div
          className="relative aspect-square bg-slate-50/80 dark:bg-[#0c192c] rounded-2xl overflow-hidden group shadow-sm hover:shadow-md border border-slate-200/80 dark:border-slate-800 cursor-zoom-in transition-all flex items-center justify-center touch-pan-y"
          onClick={() => {
            setIsZoomed(true)
            setZoomLevel(1)
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsZoomed(true)
            }
          }}
          aria-label={`Zoom photo of ${productName}`}
        >
          {/* Main Photo - Standard uncropped object-contain view */}
          <img
            src={getImageSrc(safeIndex)}
            alt={`${productName} - Image ${safeIndex + 1}`}
            className="object-contain w-full h-full p-2.5 transition-transform duration-300 group-hover:scale-105"
            loading="eager"
            onError={() => handleImageError(safeIndex)}
          />

          {/* Hover Overlay Hint & Zoom Button */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-semibold text-gray-700 transition-all group-hover:scale-105">
            <ZoomIn className="w-3.5 h-3.5 text-primary-600" />
            <span className="hidden sm:inline">Click to zoom</span>
          </div>

          {/* Previous / Next Arrows in Main View */}
          {displayImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-white/90 sm:bg-white/95 hover:bg-white text-gray-800 p-2 sm:p-2.5 rounded-full shadow-md border border-gray-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 focus:opacity-100 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-white/90 sm:bg-white/95 hover:bg-white text-gray-800 p-2 sm:p-2.5 rounded-full shadow-md border border-gray-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 focus:opacity-100 z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Counter Badge */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-gray-900/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium tracking-wide">
              {safeIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Mobile carousel indicator dots */}
        {displayImages.length > 1 && (
          <div className="sm:hidden flex items-center justify-center gap-1.5 py-1">
            {displayImages.map((_, dotIdx) => (
              <button
                key={`dot-${dotIdx}`}
                type="button"
                onClick={() => selectIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all ${
                  dotIdx === safeIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-300'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails Carousel (Shows all photos in thumbnails) */}
        {displayImages.length > 0 && (
          <div className="relative flex items-center group/thumbs">
            {/* Scroll Left Button if many images */}
            {displayImages.length > 5 && (
              <button
                type="button"
                onClick={() => scrollThumbnails('left')}
                className="absolute -left-3 z-10 bg-white/95 hover:bg-white text-gray-700 shadow-md border border-gray-200 p-1.5 rounded-full hover:scale-110 transition-all"
                aria-label="Scroll thumbnails left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scrollable Thumbnails Strip */}
            <div
              ref={thumbnailStripRef}
              className="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 scrollbar-none scroll-smooth w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayImages.map((image, index) => (
                <button
                  key={`thumb-${index}`}
                  type="button"
                  onClick={() => selectIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-white border-2 transition-all cursor-pointer ${
                    index === safeIndex
                      ? 'border-primary-600 ring-2 ring-primary-500/30 shadow-sm scale-102'
                      : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                  aria-label={`View photo ${index + 1}`}
                >
                  <img
                    src={getImageSrc(index)}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="object-contain w-full h-full p-1"
                    loading="lazy"
                    onError={() => handleImageError(index)}
                  />
                  {index === safeIndex && (
                    <div className="absolute inset-0 bg-primary-600/5 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>

            {/* Scroll Right Button if many images */}
            {displayImages.length > 5 && (
              <button
                type="button"
                onClick={() => scrollThumbnails('right')}
                className="absolute -right-3 z-10 bg-white/95 hover:bg-white text-gray-700 shadow-md border border-gray-200 p-1.5 rounded-full hover:scale-110 transition-all"
                aria-label="Scroll thumbnails right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal - Portaled to document.body to break out of all parent stacking contexts */}
      {isZoomed && mounted && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
          onClick={() => {
            setIsZoomed(false)
            setZoomLevel(1)
          }}
        >
          {/* Header Bar */}
          <div
            className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent text-white z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title & Counter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold bg-white/15 px-3 py-1 rounded-full text-white/90">
                {safeIndex + 1} / {displayImages.length}
              </span>
              <span className="text-sm font-medium text-white/80 hidden sm:inline truncate max-w-md">
                {productName}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 2.5 : 1))}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                aria-label={zoomLevel === 1 ? 'Zoom in' : 'Zoom out'}
              >
                {zoomLevel === 1 ? (
                  <>
                    <ZoomIn className="w-4 h-4" />
                    <span>Zoom In (2.5x)</span>
                  </>
                ) : (
                  <>
                    <ZoomOut className="w-4 h-4" />
                    <span>Zoom Out</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsZoomed(false)
                  setZoomLevel(1)
                }}
                className="bg-white/10 hover:bg-white/25 text-white p-2 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Zoom Stage */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden px-4 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-4 z-30 bg-white/15 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}

            {/* Image Box with 2.5x Interactive Pan */}
            <div
              className={`relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center overflow-hidden rounded-xl ${
                zoomLevel === 2.5 ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onMouseMove={handleStageMouseMove}
              onClick={handleStageClick}
            >
              <img
                src={getImageSrc(safeIndex)}
                alt={`${productName} zoomed`}
                style={{
                  transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
                  transform: `scale(${zoomLevel})`,
                  transition: zoomLevel === 1 ? 'transform 0.25s ease-out' : 'none',
                }}
                className="max-h-[75vh] max-w-[85vw] object-contain select-none pointer-events-auto shadow-2xl"
                draggable={false}
                onError={() => handleImageError(safeIndex)}
              />
            </div>

            {/* Next Arrow */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 z-30 bg-white/15 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Next photo"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip (Shows all photos in zoom view) */}
          {displayImages.length > 0 && (
            <div
              className="py-4 px-6 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center max-w-4xl w-full">
                {displayImages.length > 6 && (
                  <button
                    type="button"
                    onClick={() => scrollLightboxThumbnails('left')}
                    className="absolute -left-3 z-10 bg-white/20 hover:bg-white/35 text-white p-1.5 rounded-full transition-all"
                    aria-label="Scroll thumbnails left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <div
                  ref={lightboxThumbnailsRef}
                  className="flex items-center gap-2.5 overflow-x-auto py-1 px-4 scrollbar-none scroll-smooth mx-auto"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {displayImages.map((image, index) => (
                    <button
                      key={`lb-thumb-${index}`}
                      type="button"
                      onClick={() => selectIndex(index)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-white/10 border-2 transition-all ${
                        index === safeIndex
                          ? 'border-white ring-2 ring-white/40 scale-105'
                          : 'border-white/20 hover:border-white/60 opacity-60 hover:opacity-100'
                      }`}
                      aria-label={`Jump to photo ${index + 1}`}
                    >
                      <img
                        src={getImageSrc(index)}
                        alt={`Photo thumbnail ${index + 1}`}
                        className="object-contain w-full h-full p-1 bg-white rounded-md"
                        loading="lazy"
                        onError={() => handleImageError(index)}
                      />
                    </button>
                  ))}
                </div>

                {displayImages.length > 6 && (
                  <button
                    type="button"
                    onClick={() => scrollLightboxThumbnails('right')}
                    className="absolute -right-3 z-10 bg-white/20 hover:bg-white/35 text-white p-1.5 rounded-full transition-all"
                    aria-label="Scroll thumbnails right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
