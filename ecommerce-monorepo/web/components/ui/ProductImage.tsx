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
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const DEFAULT_PRODUCT_FALLBACK = DEFAULT_PLACEHOLDER;

const Img = (typeof Image === 'function' ? Image : (Image as any)?.default || Image) as typeof Image;

/**
 * Robust ProductImage component that handles loading states, 404s,
 * missing images, and external image failures with a graceful fallback.
 * Automatically normalizes bare filenames, localhost URLs, and relative paths.
 * Automatically resets error state when `src` prop changes.
 */
export function ProductImage({
  src,
  alt = 'Product image',
  width,
  height,
  fill,
  className = '',
  sizes,
  priority,
  fallbackSrc = DEFAULT_PRODUCT_FALLBACK,
  quality,
  unoptimized = true,
  loading,
  style,
  onClick,
  onLoad,
  onError,
}: ProductImageProps) {
  const normalizedOriginal = src ? normalizeProductImageUrl(src) : '';
  const normalizedFallback = normalizeProductImageUrl(fallbackSrc || DEFAULT_PRODUCT_FALLBACK);

  const [error, setError] = useState(!normalizedOriginal || normalizedOriginal === normalizedFallback);
  const [loaded, setLoaded] = useState(false);

  // Sync state if src changes (e.g., variant switch, carousel slide)
  useEffect(() => {
    const fresh = src ? normalizeProductImageUrl(src) : '';
    setError(!fresh || fresh === normalizedFallback);
    setLoaded(false);
  }, [src, normalizedFallback]);

  const finalSrc = error || !normalizedOriginal ? normalizedFallback : normalizedOriginal;
  const safeAlt = alt?.trim() ? alt : 'Product image';

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

  if (fill) {
    return (
      <Img
        key={finalSrc}
        src={finalSrc}
        alt={safeAlt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        quality={quality}
        unoptimized={unoptimized}
        loading={loading}
        style={style}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
      />
    );
  }

  return (
    <Img
      key={finalSrc}
      src={finalSrc}
      alt={safeAlt}
      width={width || 500}
      height={height || 500}
      sizes={sizes}
      className={className}
      priority={priority}
      quality={quality}
      unoptimized={unoptimized}
      loading={loading}
      style={style}
      onClick={onClick}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}

export default ProductImage;
