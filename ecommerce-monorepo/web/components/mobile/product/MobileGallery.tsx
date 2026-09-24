'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { normalizeProductImageUrl } from '@/lib/image-utils'
import { ProductImage } from '@/components/ui/ProductImage'

interface MobileGalleryProps {
  images?: string[]
  mainImage: string
  productName: string
  discountBadge?: string
  inStock?: boolean
  className?: string
}

export function MobileGallery({
  images: propImages,
  mainImage,
  productName,
  discountBadge,
  inStock = true,
  className = '',
}: MobileGalleryProps) {
  const rawList = propImages && propImages.length > 0 ? propImages : [mainImage]
  const images = rawList
    .map((src) => normalizeProductImageUrl(src, undefined, productName))
    .filter(Boolean)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <section
      data-testid="mobile-gallery"
      aria-label="Product Gallery"
      className={`relative w-full bg-white dark:bg-[#0f172a] overflow-hidden ${className}`}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discountBadge && (
          <span className="px-2 py-1 rounded-lg bg-red-600 text-white font-black text-xs shadow-xs">
            {discountBadge}
          </span>
        )}
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs ${
            inStock
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
          }`}
        >
          {inStock ? 'In Stock · Ready to Ship' : 'Backorder'}
        </span>
      </div>

      {/* Fullscreen Trigger */}
      <button
        type="button"
        onClick={() => setIsFullscreen(true)}
        aria-label="View Fullscreen Image"
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/85 dark:bg-slate-800/85 backdrop-blur-xs flex items-center justify-center text-gray-700 dark:text-slate-300 shadow-xs active:scale-90 transition-transform"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Main Swipeable Image Container */}
      <div className="relative w-full aspect-square bg-gray-50/80 dark:bg-slate-900/60 flex items-center justify-center overflow-hidden">
        {images[activeIndex] ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              drag={images.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const threshold = 40
                if (info.offset.x < -threshold) {
                  handleNext()
                } else if (info.offset.x > threshold) {
                  handlePrev()
                }
              }}
              className="w-full h-full relative cursor-grab active:cursor-grabbing"
            >
              <ProductImage
                src={images[activeIndex]}
                alt={`${productName} image ${activeIndex + 1}`}
                productName={productName}
                fill
                sizes="100vw"
                className="object-contain p-4 select-none"
                priority={activeIndex === 0}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-16 h-16" />
          </div>
        )}

        {/* Prev / Next Arrows if multiple */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-center text-gray-700 dark:text-slate-300 shadow-xs active:scale-90 transition-transform tap-spring"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-center text-gray-700 dark:text-slate-300 shadow-xs active:scale-90 transition-transform tap-spring"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="min-h-[24px] min-w-[24px] flex items-center justify-center tap-spring"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  activeIndex === idx
                    ? 'w-6 h-1.5 bg-primary-600 dark:bg-primary-400 shadow-xs'
                    : 'w-1.5 h-1.5 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen view"
              className="absolute top-4 right-4 min-w-[48px] min-h-[48px] flex items-center justify-center text-white bg-white/10 hover:bg-white/20 active:scale-90 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg aspect-square"
            >
              <ProductImage
                src={images[activeIndex]}
                alt={productName}
                productName={productName}
                fill
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
