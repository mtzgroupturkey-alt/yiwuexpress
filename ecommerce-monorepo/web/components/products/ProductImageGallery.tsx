'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const displayImages = images.length > 0 ? images : ['/placeholder-product.png']

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image with enhanced design */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl overflow-hidden group shadow-xl border-2 border-gray-200">
          <img
            src={displayImages[currentIndex]}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm hover:bg-white p-3 rounded-xl shadow-lg transition-all hover:scale-110 z-10"
            aria-label="Zoom image"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Navigation Arrows - Enhanced */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm hover:bg-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Image Counter - Enhanced */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
              {currentIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails - Enhanced */}
        {displayImages.length > 1 && (
          <div className="grid grid-cols-5 gap-3">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                  index === currentIndex
                    ? 'border-primary-500 ring-4 ring-primary-200 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-400 shadow-sm'
                }`}
              >
                <img
                  src={image}
                  alt={`${productName} - Thumbnail ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-primary-500/10" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal - Full screen zoom */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            aria-label="Close zoom"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={displayImages[currentIndex]}
              alt={`${productName} - Zoomed`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Navigation in lightbox */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 bg-white/20 hover:bg-white/30 p-4 rounded-full transition-all"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 bg-white/20 hover:bg-white/30 p-4 rounded-full transition-all"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
