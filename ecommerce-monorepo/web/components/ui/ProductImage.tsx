'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

export const DEFAULT_PRODUCT_FALLBACK = '/images/product-placeholder.webp';

/**
 * Robust ProductImage component that handles loading states, 404s,
 * missing images, and external image failures with a graceful fallback.
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
  unoptimized,
  loading,
  style,
  onClick,
  onLoad,
  onError,
}: ProductImageProps) {
  const [error, setError] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  // Sync state if src changes (e.g., variant switch, carousel slide)
  useEffect(() => {
    setError(!src);
    setLoaded(false);
  }, [src]);

  const finalSrc = !src || error ? fallbackSrc : src;
  const safeAlt = alt?.trim() ? alt : 'Product image';

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (finalSrc !== fallbackSrc) {
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
      <Image
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
    <Image
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
