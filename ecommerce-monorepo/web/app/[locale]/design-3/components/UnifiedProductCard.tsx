'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductImage } from '@/components/ui/ProductImage';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus, 
  Check, 
  Zap, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Product } from '../types';
import { getProductDisplayNames } from '@/lib/utils/productNames';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSettings } from '@/components/SettingsProvider';
import { useStoreMode } from '@/contexts/StoreModeContext';
import { useSessionMode } from '@/contexts/SessionModeContext';
import { useQuoteCart } from '@/components/QuoteCartContext';
import { useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext';
import { useCustomerView } from '@/hooks/useCustomerView';
import { useAuth } from '@/hooks/useAuth';

interface UnifiedProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number, mode?: 'RETAIL' | 'WHOLESALE') => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  variant?: 'compact' | 'standard' | 'detailed' | 'flash' | 'grocery' | 'electronics';
}

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between h-[360px] animate-pulse shadow-2xs">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-16 bg-slate-200/80 rounded"></div>
          <div className="h-6 w-6 bg-slate-200/80 rounded-full"></div>
        </div>
        <div className="w-full h-36 bg-slate-100 rounded-lg mb-3"></div>
        <div className="h-3 w-14 bg-slate-200/70 rounded mb-1.5"></div>
        <div className="h-4 w-full bg-slate-200/80 rounded mb-1"></div>
        <div className="h-4 w-3/4 bg-slate-200/80 rounded mb-2"></div>
        <div className="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
      <div>
        <div className="h-5 w-24 bg-slate-200/80 rounded mb-3"></div>
        <div className="h-9 w-full bg-slate-100 rounded-lg"></div>
      </div>
    </div>
  );
};

export const UnifiedProductCard: React.FC<UnifiedProductCardProps> = ({
  product,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  variant = 'standard',
}) => {
  const locale = useLocale();
  const { tFlash, tBadge, tPdp, tOriginAndBrand } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const qtyInCart = cartQuantities[product.id] || 0;
  const isFavorite = favoriteIds.has(product.id);
  const [justAdded, setJustAdded] = useState(false);

  const { settings } = useSettings();
  const customerView = useCustomerView();
  const {
    isWholesale: isWholesaleActive,
    canRequestQuote,
    canAddToWholesaleCart,
    isLoading: isCustomerLoading,
  } = customerView;
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isUserLoggedIn = mounted ? (isAuthenticated || !customerView.isGuest) : false;
  const { items: quoteItems, addToQuote, updateQuantity: updateQuoteQuantity, removeFromQuote } = useQuoteCart();
  const { addItem: addInquiryItem } = useWholesaleInquiry();

  const rfqModel = settings?.rfqModel || 'RFQ';
  const isInstantWholesale = rfqModel === 'INSTANT';
  const moq = product.minOrderQty || (product as any).moq || settings?.wholesaleDefaultMoq || 1;

  const quoteItem = quoteItems.find((i) => i.productId === product.id);
  const qtyInQuote = quoteItem?.quantity || 0;

  const isWholesaleCustomer = isWholesaleActive || !isUserLoggedIn || !customerView.isRetail;
  const isRetailUserLoggedIn = isUserLoggedIn && customerView.isRetail;

  const effectiveWholesalePrice = product.wholesalePrice || product.price;
  const displayPrice = isRetailUserLoggedIn ? product.price : effectiveWholesalePrice;

  const effectiveTaxRate = useMemo(() => {
    const rawTax =
      (product as any).taxRate ??
      (product as any).taxPercent ??
      (product as any).rawIkeaPayload?.taxRate ??
      (product as any).rawIkeaPayload?.taxPercent;
    if (rawTax !== undefined && rawTax !== null && !isNaN(Number(rawTax)) && Number(rawTax) > 0) {
      return Number(rawTax);
    }
    return 20; // Standard 20% VAT fallback
  }, [product]);

  const effectiveDisplayPriceWithTax = useMemo(() => {
    if ((product as any).wholesalePriceWithTax && (product as any).wholesalePriceWithTax > 0) {
      return (product as any).wholesalePriceWithTax;
    }
    if (displayPrice > 0) {
      return Math.round((displayPrice * (1 + effectiveTaxRate / 100) + Number.EPSILON) * 100) / 100;
    }
    return null;
  }, [product, effectiveTaxRate, displayPrice]);

  // Only show crossed-out retail price if retail user is logged in
  const showOriginalPrice = isRetailUserLoggedIn && product.oldPrice && product.oldPrice > displayPrice
    ? product.oldPrice
    : null;

  const isStockAvailable = product.stock !== undefined ? product.stock > 0 : (product.inStock !== false);

  const stockStatusLabel = isStockAvailable
    ? (locale === 'ru' ? 'В наличии' : locale === 'zh' ? '有现货' : 'In Stock')
    : (locale === 'ru' ? 'Под заказ' : locale === 'zh' ? '按需预定' : 'By Order');

  const productUrl = `/${locale}/products/${product.slug || product.id}`;

  // Item # formatted as clean number only (e.g. "950.962.59", stripping "DK-", "Item #", etc.)
  const rawItemNumber =
    product.dromkokItemNo ||
    (product as any).ikeaItemNo ||
    (product as any).itemNo ||
    (product as any).articleNumber ||
    product.sku ||
    '';
  const displayItemNumber = rawItemNumber
    ? rawItemNumber
        .replace(/^DK-/i, '')
        .replace(/^[a-zA-Z#:\s-]+/, '')
        .trim()
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1, 'RETAIL');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleAddToQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQuote({
      productId: product.id,
      productName: product.name,
      productSku: product.sku || product.slug || product.id,
      productImage: product.image,
      quantity: moq,
      minOrderQty: moq,
      targetPrice: product.wholesalePrice || null,
    });
    addInquiryItem({
      productId: product.id,
      slug: product.slug || product.id,
      name: product.name,
      image: product.image,
      wholesalePrice: effectiveWholesalePrice,
      retailPrice: product.price,
      quantity: moq,
      minOrderQty: moq,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleInstantWholesaleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const orderQty = Math.max(1, product.minOrderQty || moq || 1);
    onAddToCart(
      {
        ...product,
        price: effectiveWholesalePrice,
      },
      orderQty,
      'WHOLESALE'
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="@container bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 flex flex-col justify-between hover:border-blue-300 hover:shadow-[0_8px_24px_rgba(0,64,122,0.08)] transition-shadow duration-300 group relative"
    >
      {/* Top Header: Badges & Favorite */}
      <div>
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex flex-wrap gap-1 items-center">
            {isRetailUserLoggedIn && product.discountBadge && (
              <motion.span 
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#DC2626] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tight inline-block shadow-xs"
              >
                {product.discountBadge}
              </motion.span>
            )}
            {product.isExpressDelivery && (
              <span className="bg-amber-100 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                {tBadge('EXPRESS')}
              </span>
            )}
            {product.tagBadge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase ${
                  product.tagBadge.type === 'hot'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : product.tagBadge.type === 'bestseller'
                    ? 'bg-[#FEF08A] text-[#854D0E]'
                    : 'bg-[#DBEAFE] text-[#00407a]'
                }`}
              >
                {tBadge(product.tagBadge.text, product.tagBadge.type)}
              </span>
            )}
            {typeof product.similarity === 'number' && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-tight text-white shadow-xs ${
                  Math.round(product.similarity * 100) >= 90
                    ? 'bg-emerald-600'
                    : Math.round(product.similarity * 100) >= 70
                    ? 'bg-amber-600'
                    : 'bg-slate-500'
                }`}
              >
                {Math.round(product.similarity * 100)}% match
              </span>
            )}
          </div>

          {isUserLoggedIn && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product);
              }}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              aria-label="Add to favorites"
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400'
                }`}
              />
            </motion.button>
          )}
        </div>

        {/* Product Image */}
        <Link 
          href={productUrl}
          onClick={(e) => {
            e.preventDefault();
            onSelectProduct(product);
          }}
          className="aspect-square w-full rounded-lg bg-slate-50/50 overflow-hidden flex items-center justify-center mb-2.5 cursor-pointer p-2 relative block"
        >
          <ProductImage
            src={product.image}
            alt={product.name || 'Product image'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300 ease-out p-2"
            loading="lazy"
          />
          {product.installmentPrice && variant === 'detailed' && (
            <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-white/90 backdrop-blur-xs text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {product.installmentPrice}
            </span>
          )}
        </Link>

        {/* Category, Item #, Brand */}
        <div className="flex items-center text-[11px] text-slate-500 font-medium mb-1 gap-1">
          <div className="truncate flex items-center gap-1.5 min-w-0">
            {product.category && (
              <span className="text-[10px] font-semibold text-[#00407a] bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[130px]">
                {product.category}
              </span>
            )}
            {displayItemNumber && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono tracking-tight shrink-0">
                {displayItemNumber}
              </span>
            )}
            {product.brand && product.brand.toLowerCase() !== 'official sourcing' && (
              <strong className="text-slate-800 font-bold truncate">
                {tOriginAndBrand(product.brand)}
              </strong>
            )}
            {product.originOrType && !product.category && (
              <span> • {tOriginAndBrand(product.originOrType)}</span>
            )}
          </div>
        </div>

        {/* Title: First Swedish name, next line English name */}
        {(() => {
          const { swedenName, englishName } = getProductDisplayNames(product);

          return (
            <h3 className="text-xs leading-[18px] min-h-[38px] mb-1.5">
              <Link
                href={productUrl}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectProduct(product);
                }}
                title={product.name}
                className="block group/title hover:text-[#00407a] transition-colors"
              >
                {swedenName ? (
                  <>
                    <span className="block font-black text-slate-900 uppercase tracking-wide group-hover/title:text-[#00407a] transition-colors truncate">
                      {swedenName}
                    </span>
                    <span className="block font-medium text-slate-600 line-clamp-1 group-hover/title:text-slate-900 transition-colors">
                      {englishName}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-slate-900 line-clamp-2 group-hover/title:text-[#00407a] transition-colors">
                    {englishName || product.name}
                  </span>
                )}
              </Link>
            </h3>
          );
        })()}

        {/* Price Block: Stacked on narrow cards (@container < 220px), inline with pipe on wide cards */}
        <div className="mb-2">
          {isRetailUserLoggedIn ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {formatPrice(displayPrice)}
              </span>
              {showOriginalPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {formatPrice(showOriginalPrice)}
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="flex flex-col @[220px]:flex-row @[220px]:items-baseline gap-0.5 @[220px]:gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    {locale === 'ru' ? 'Без НДС:' : locale === 'zh' ? '未含税：' : 'Excl. TAX:'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight font-sans">
                    {formatPrice(displayPrice)}
                  </span>
                </div>

                {effectiveDisplayPriceWithTax && (
                  <>
                    <span className="hidden @[220px]:inline text-slate-300 text-xs sm:text-sm font-light">|</span>

                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-tight">
                        {locale === 'ru' ? 'С НДС:' : locale === 'zh' ? '含税价：' : 'Incl. TAX:'}
                      </span>
                      <span className="text-sm sm:text-base font-black text-purple-900 tracking-tight font-sans">
                        {formatPrice(effectiveDisplayPriceWithTax)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stock Status Badge (Left) & Star Rating (Right) on the same line after prices */}
          <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-100">
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-wider uppercase shrink-0 ${
                isStockAvailable
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                  : 'bg-amber-100 text-amber-800 border border-amber-200/80'
              }`}
            >
              {stockStatusLabel}
            </span>

            {/* Rating on right side after prices */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800">{product.rating}</span>
              <span className="text-[10px]">({product.reviewsCount})</span>
            </div>
          </div>

          {isWholesaleCustomer ? (
            <div className="mt-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-[#00407a] border border-blue-200/80 text-[10px] font-bold">
                {tPdp('wholesaleMoq', { moq })}
              </span>
            </div>
          ) : product.unitPrice ? (
            <div className="text-[10px] text-slate-500 font-medium truncate mt-1">
              {product.unitPrice}
            </div>
          ) : null}
        </div>
      </div>

      {/* Card Bottom: Add to Cart */}
      <div className="pt-2 border-t border-slate-100">

        {/* Cart Button or Rapid Stepper - Only shown for authenticated users */}
        {isUserLoggedIn && (
          canRequestQuote && !isInstantWholesale ? (
          // Wholesale RFQ Mode: "Request Quote (MOQ: X)" -> QuoteCartContext
          qtyInQuote === 0 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleAddToQuote}
              className={`w-full font-bold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-1 font-bold"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{tPdp('addedToQuote')}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{tPdp('requestQuoteMoq', { moq })}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-0.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (qtyInQuote <= moq) {
                    removeFromQuote(product.id);
                  } else {
                    updateQuoteQuantity(product.id, qtyInQuote - 1);
                  }
                }}
                className="w-7 h-7 rounded bg-white hover:bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </motion.button>
              <span className="text-xs font-bold text-blue-950 px-2 flex items-center gap-1">
                <span className="tabular-nums">{qtyInQuote}</span>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuoteQuantity(product.id, qtyInQuote + 1);
                }}
                className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )
        ) : canAddToWholesaleCart && isInstantWholesale ? (
          // Wholesale INSTANT Mode: "Add to Cart" with wholesale price + MOQ
          qtyInCart === 0 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleInstantWholesaleAdd}
              className={`w-full font-bold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-1 font-bold"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{tPdp('added')}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{tFlash('addToCart')}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-md p-0.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, Math.max(0, qtyInCart - 1));
                }}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </motion.button>
              <span className="text-xs font-bold text-slate-900 px-2 flex items-center gap-1">
                <span className="tabular-nums">{qtyInCart}</span>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, qtyInCart + 1);
                }}
                className="w-7 h-7 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )
        ) : (
          // Retail Mode (unchanged)
          qtyInCart === 0 ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleAdd}
              className={`w-full font-bold py-2 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F5A602] hover:bg-[#E09500] text-slate-950'
              }`}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-1 font-bold"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{tPdp('added')}</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{tFlash('addToCart')}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ) : (
            <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-md p-0.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => onUpdateQuantity(product.id, qtyInCart - 1)}
                className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </motion.button>
              <span className="text-xs font-bold text-slate-900 px-2 flex items-center gap-1">
                <span className="tabular-nums">{qtyInCart}</span>
                <Check className="w-3 h-3 text-emerald-600" />
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => onUpdateQuantity(product.id, qtyInCart + 1)}
                className="w-7 h-7 rounded bg-[#F5A602] hover:bg-[#E09500] text-slate-950 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )
        ))}
      </div>
    </motion.div>
  );
};
