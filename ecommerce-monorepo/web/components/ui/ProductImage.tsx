'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { normalizeProductImageUrl, getCategoryFallbackImage, DEFAULT_PLACEHOLDER } from '@/lib/image-utils';

export interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  productName?: string | null;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
  quality?: number;
  unoptimized?: boolean;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'auto' | 'sync';
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const DEFAULT_PRODUCT_FALLBACK = DEFAULT_PLACEHOLDER;

/**
 * Robust ProductImage component that handles loading states, 404s,
 * missing images, and external image failures with a graceful fallback.
 * Automatically normalizes bare filenames, localhost URLs, and relative paths.
 * Renders an optimized, direct HTML <img> element to prevent aspect-ratio/flex
 * collapse on mobile WebKit browsers and ensure instant display in PWAs.
 */
export function ProductImage({
  src,
  alt = 'Product image',
  category,
  productName,
  width,
  height,
  fill,
  className = '',
  sizes,
  priority = false,
  fallbackSrc,
  quality,
  unoptimized = true,
  loading,
  decoding = 'async',
  style,
  onClick,
  onLoad,
  onError,
}: ProductImageProps) {
  const safeAlt = alt?.trim() ? alt : (productName?.trim() || 'Product image');
  const fallback = fallbackSrc || getCategoryFallbackImage(category, productName || safeAlt);
  const normalizedFallback = normalizeProductImageUrl(fallback);
  const normalizedOriginal = src ? normalizeProductImageUrl(src, category, productName || safeAlt) : '';

  const initialSrc = normalizedOriginal || normalizedFallback || DEFAULT_PLACEHOLDER;
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const fresh = src ? normalizeProductImageUrl(src, category, productName || safeAlt) : '';
    setImgSrc(fresh || normalizedFallback || DEFAULT_PLACEHOLDER);
    setIsLoaded(false);
  }, [src, normalizedFallback, category, productName, safeAlt]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (imgSrc !== normalizedFallback && normalizedFallback) {
      setImgSrc(normalizedFallback);
    } else if (imgSrc !== DEFAULT_PLACEHOLDER) {
      setImgSrc(DEFAULT_PLACEHOLDER);
    }
    setIsLoaded(true);
    onError?.(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const effectiveLoading = priority ? 'eager' : (loading || 'eager');
  const objectFitClass = className.includes('object-cover') ? '' : 'object-contain';
  const stableKey = src || 'default-img';

  if (fill) {
    return (
      <img
        key={stableKey}
        src={imgSrc}
        alt={safeAlt}
        loading={effectiveLoading}
        decoding={decoding}
        {...({ fetchpriority: priority ? 'high' : 'auto' } as any)}
        className={`absolute inset-0 w-full h-full ${objectFitClass} transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        } ${className}`}
        style={style}
        onClick={onClick}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  const explicitWidth = width || 500;
  const explicitHeight = height || 500;
  const combinedStyle: React.CSSProperties = {
    aspectRatio: `${explicitWidth} / ${explicitHeight}`,
    ...style,
  };

  return (
    <img
      key={stableKey}
      src={imgSrc}
      alt={safeAlt}
      width={explicitWidth}
      height={explicitHeight}
      loading={effectiveLoading}
      decoding={decoding}
      {...({ fetchpriority: priority ? 'high' : 'auto' } as any)}
      className={`w-full h-auto ${objectFitClass} transition-opacity duration-200 ${
        isLoaded ? 'opacity-100' : 'opacity-90'
      } ${className}`}
      style={combinedStyle}
      onClick={onClick}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

export default ProductImage;
