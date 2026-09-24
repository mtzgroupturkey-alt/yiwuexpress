'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { normalizeProductImageUrl, DEFAULT_PLACEHOLDER } from '@/lib/image-utils';

export interface ProductImageProps {
  src?: string | null;
  alt: string;
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

const Img = (typeof Image === 'function' ? Image : (Image as any)?.default || Image) as typeof Image;

// Lightweight SVG Low Quality Image Placeholder (LQIP) to prevent jarring flashes
const SHIMMER_BLUR_DATA_URL =
  'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3C/svg%3E';

/**
 * Robust ProductImage component that handles loading states, 404s,
 * missing images, and external image failures with a graceful fallback.
 * Automatically normalizes bare filenames, localhost URLs, and relative paths.
 * Enforces native lazy loading, async decoding, layout shift prevention,
 * and smooth blur-up/fade transition on real mobile devices.
 */
export function ProductImage({
  src,
  alt = 'Product image',
  width,
  height,
  fill,
  className = '',
  sizes,
  priority = false,
  fallbackSrc = DEFAULT_PRODUCT_FALLBACK,
  quality,
  unoptimized = true,
  loading,
  decoding = 'async',
  style,
  onClick,
  onLoad,
  onError,
}: ProductImageProps) {
  const normalizedOriginal = src ? normalizeProductImageUrl(src) : '';
  const normalizedFallback = normalizeProductImageUrl(fallbackSrc || DEFAULT_PRODUCT_FALLBACK);

  const [error, setError] = useState(!normalizedOriginal || normalizedOriginal === normalizedFallback);
  const [loaded, setLoaded] = useState(Boolean(priority));

  // Sync state if src changes (e.g., variant switch, carousel slide)
  useEffect(() => {
    const fresh = src ? normalizeProductImageUrl(src) : '';
    setError(!fresh || fresh === normalizedFallback);
    setLoaded(Boolean(priority));
  }, [src, normalizedFallback, priority]);

  const finalSrc = error || !normalizedOriginal ? normalizedFallback : normalizedOriginal;
  const safeAlt = alt?.trim() ? alt : 'Product image';
  const effectiveLoading = priority ? 'eager' : (loading || 'lazy');

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!error && finalSrc !== normalizedFallback) {
      setError(true);
    }
    onError?.(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const transitionClass = `transition-opacity duration-300 ease-out ${loaded ? 'opacity-100' : 'opacity-85'} ${className}`;

  if (fill) {
    return (
      <Img
        key={finalSrc}
        src={finalSrc}
        alt={safeAlt}
        fill
        sizes={sizes || '(max-width: 768px) 50vw, 33vw'}
        className={transitionClass}
        priority={priority}
        quality={quality}
        unoptimized={unoptimized}
        loading={effectiveLoading}
        decoding={decoding}
        placeholder="blur"
        blurDataURL={SHIMMER_BLUR_DATA_URL}
        style={style}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
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
    <Img
      key={finalSrc}
      src={finalSrc}
      alt={safeAlt}
      width={explicitWidth}
      height={explicitHeight}
      sizes={sizes}
      className={transitionClass}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
      loading={effectiveLoading}
      decoding={decoding}
      placeholder="blur"
      blurDataURL={SHIMMER_BLUR_DATA_URL}
      style={combinedStyle}
      onClick={onClick}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}

export default ProductImage;
