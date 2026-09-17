import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ChevronRight, 
  Star, 
  Heart, 
  Share2, 
  SlidersHorizontal, 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Zap, 
  Store, 
  Headphones, 
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowLeft,
  Search,
  Check
} from 'lucide-react';
import { Product } from '../types';
import { PHILIPS_PDP_PRODUCT, SIMILAR_COFFEE_MACHINES } from '../data/pdpData';
import { useCompanyName } from '@/hooks/useCompanyName';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';

interface ProductDetailPageProps {
  product?: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
  onBackToShop: () => void;
  onGoHome?: () => void;
  onSelectProduct: (product: Product) => void;
  onProceedToCheckout?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product = PHILIPS_PDP_PRODUCT,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  onBackToShop,
  onGoHome,
  onSelectProduct,
  onProceedToCheckout,
}) => {
  const companyName = useCompanyName();
  const { tPdp, tShop, tModals, tBadge } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();
  const currentProduct = product || PHILIPS_PDP_PRODUCT;

  // Gallery state
  const images = currentProduct.images && currentProduct.images.length > 0 
    ? currentProduct.images 
    : [currentProduct.image];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant state
  const finishVariants = currentProduct.finishVariants || [
    { name: 'Piano Black & Silver Chrome', colorHex: '#0F172A' },
    { name: 'Brushed Stainless Steel', colorHex: '#CBD5E1' },
    { name: 'Matte Satin Black', colorHex: '#44403C' },
  ];
  const [selectedVariant, setSelectedVariant] = useState(finishVariants[0].name);

  // Buy box state
  const [quantity, setQuantity] = useState(1);
  const [isAddedAnim, setIsAddedAnim] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'delivery' | 'qa'>('specs');
  const [countdown, setCountdown] = useState('02:44:19');
  const [isBundleAdded, setIsBundleAdded] = useState(false);

  // Countdown timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(23 - now.getHours()).padStart(2, '0');
      const mins = String(59 - now.getMinutes()).padStart(2, '0');
      const secs = String(59 - now.getSeconds()).padStart(2, '0');
      setCountdown(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state when product prop changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [product?.id]);

  const handleAddToCart = () => {
    onAddToCart(currentProduct, quantity);
    setIsAddedAnim(true);
    setTimeout(() => {
      setIsAddedAnim(false);
    }, 2200);
  };

  const handleAddBundle = () => {
    // Add current product + accessory bundle
    onAddToCart(currentProduct, 1);
    onAddToCart({
      id: 'bundle-cleaner-1',
      name: 'AquaClean Anti-Scale Filter Pack (2x)',
      category: 'Accessories',
      department: currentProduct.department || 'Appliances',
      brand: currentProduct.brand || 'Official',
      originOrType: 'Official Care',
      rating: 4.9,
      reviewsCount: 190,
      price: 19.90,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIUKqsMtOejhQXCClKBJ5ANf7hvHncqM0MhhZrT2WXzBc-bKwzrycuo-rvg0KuE5AVEQUsneRYaJgYGkQ3COPfwsyJseZoW8rgWb7z9KbZsa3ow4zONzKeHMUZVRBypUnxTuT-HDkR9uN3MFEaIHB8x4mtLXNzMi-ePF5_OQbMZ250BU2qmzresn4qxtOwIbuMcM4lDPU_MnBODJvAX1Sc6Gd4otqHbKLBij_zeKEGAyjuOC3aJC9p',
      inStock: true,
    }, 1);
    setIsBundleAdded(true);
    setTimeout(() => setIsBundleAdded(false), 2000);
  };

  return (
    <div className="w-full bg-[#F8FAFC] pb-16">
      {/* 1. Breadcrumb Ribbon */}
      <div className="w-full bg-white border-b border-slate-200 py-3 mb-6 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
            <button 
              onClick={onGoHome || onBackToShop}
              className="hover:text-[#00407a] transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button 
              onClick={onBackToShop}
              className="hover:text-[#00407a] transition-colors font-medium cursor-pointer"
            >
              Shop Catalog
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="hover:text-[#00407a] cursor-pointer" onClick={onBackToShop}>
              {currentProduct.department || 'Appliances'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold truncate max-w-[280px] sm:max-w-md">
              {currentProduct.name}
            </span>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span>Article: <strong className="text-slate-700 font-semibold">{currentProduct.article || 'PH-3246-70'}</strong></span>
            <span>SKU: <strong className="text-slate-700 font-semibold">{currentProduct.sku || '94018241'}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 w-full">
        {/* Back button link */}
        <button
          onClick={onBackToShop}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#00407a] hover:underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tPdp('backToShop')}</span>
        </button>

        {/* 2. Top 3-Column Layout: Gallery | Specs Highlights | Sticky Buy Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: Visual Media Gallery (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative flex flex-col-reverse md:flex-row gap-4">
              {/* Vertical Thumbnail Strip */}
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-visible shrink-0 pb-1 md:pb-0">
                {images.map((imgUrl, idx) => {
                  const isSelected = selectedImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl bg-slate-50 overflow-hidden relative p-1 transition-all cursor-pointer ${
                        isSelected 
                          ? 'ring-2 ring-[#00407a] shadow-sm' 
                          : 'opacity-70 hover:opacity-100 border border-slate-200'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`View ${idx + 1}`} 
                        className="w-full h-full object-contain mix-blend-multiply" 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Main Showcase Viewport */}
              <div className="flex-1 relative aspect-square bg-slate-50/70 rounded-xl overflow-hidden flex items-center justify-center group cursor-crosshair border border-slate-100">
                {/* Floating Badge Tags */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                  {currentProduct.discountBadge ? (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
                      {currentProduct.discountBadge}
                    </span>
                  ) : currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price ? (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
                      -{Math.round(((currentProduct.oldPrice - currentProduct.price) / currentProduct.oldPrice) * 100)}%
                    </span>
                  ) : null}

                  {currentProduct.isExpressDelivery && (
                    <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs uppercase tracking-wider">
                      <Zap className="w-3 h-3 fill-amber-500 text-amber-600" />
                      {tBadge('EXPRESS')}
                    </span>
                  )}

                  {currentProduct.tagBadge ? (
                    <span className="bg-[#00407a] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                      {tBadge(currentProduct.tagBadge.text, currentProduct.tagBadge.type)}
                    </span>
                  ) : (
                    <span className="bg-[#00407a] text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
                      {tBadge('BESTSELLER')}
                    </span>
                  )}
                </div>

                {/* Wishlist & Share Quick Actions */}
                <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
                  <button
                    onClick={() => onToggleFavorite(currentProduct.id)}
                    className={`w-9 h-9 rounded-full shadow-xs flex items-center justify-center transition-colors cursor-pointer ${
                      isFavorite 
                        ? 'bg-red-50 text-red-500 border border-red-200' 
                        : 'bg-white text-slate-500 hover:text-red-500 border border-slate-200'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Product link copied to clipboard!');
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-500 hover:text-[#00407a] transition-colors cursor-pointer"
                    title="Share product link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <img
                  src={images[selectedImageIndex] || currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                />
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-lg bg-slate-50 border-2 p-1 shrink-0 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-[#00407a] ring-2 ring-[#00407a]/20'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trust Badges Under Gallery */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-[#00407a] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{tPdp('warranty2Years')}</span>
                  <span className="text-[11px] text-slate-500">{tModals('verifiedQuality')}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{tPdp('freeExpressCourier')}</span>
                  <span className="text-[11px] text-slate-500">{tShop('express60min')}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center gap-2.5">
                <RotateCcw className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{tPdp('hassleFreeReturn')}</span>
                  <span className="text-[11px] text-slate-500">{tModals('exchangeGuarantee')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Product Information & Specifications Highlights (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Brand & Title Block */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#00407a]">
                  {currentProduct.brand}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {tPdp('inStockHub', { count: currentProduct.stockLeft || 28 })}
                </span>
              </div>

              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 leading-snug">
                {currentProduct.name}
              </h1>
            </div>

            {/* Rating, Reviews & Questions Counter */}
            <div className="flex items-center gap-3 py-2 bg-white border border-slate-200 rounded-xl px-3.5 shadow-xs">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-black text-slate-900">{currentProduct.rating.toFixed(1)}</span>
              </div>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setActiveTab('reviews')} 
                className="text-xs font-semibold text-[#00407a] hover:underline cursor-pointer"
              >
                {tShop('customerReviews', { count: currentProduct.reviewsCount })}
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setActiveTab('qa')} 
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {tPdp('qAndACount', { count: 52 })}
              </button>
            </div>

            {/* Color & Finish Selector */}
            <div className="space-y-2 bg-white border border-slate-200 p-3.5 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  {tPdp('finishVariant')} <strong className="text-slate-900 font-bold">{selectedVariant}</strong>
                </span>
                <span className="text-slate-400 font-medium">{tPdp('finishesAvailable', { count: finishVariants.length })}</span>
              </div>

              <div className="flex items-center gap-2">
                {finishVariants.map((v) => {
                  const isSelected = selectedVariant === v.name;
                  return (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v.name)}
                      className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all cursor-pointer text-xs font-semibold ${
                        isSelected 
                          ? 'border-[#00407a] bg-blue-50/50 text-[#00407a] ring-1 ring-[#00407a]' 
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" 
                        style={{ backgroundColor: v.colorHex }}
                      />
                      <span className="truncate max-w-[100px]">{v.name.split('&')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Quick Specs Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-[#00407a]" />
                <span>{tPdp('keySpecs')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Pump Pressure</div>
                  <div className="font-bold text-slate-900 mt-0.5">15 Bar Italian</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Grinder Mechanism</div>
                  <div className="font-bold text-slate-900 mt-0.5">100% Ceramic (12-step)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Milk Carafe</div>
                  <div className="font-bold text-slate-900 mt-0.5">LatteGo 2-Part (No tube)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-slate-400 font-medium text-[10px] uppercase">Water Tank Volume</div>
                  <div className="font-bold text-slate-900 mt-0.5">1.8 Liters (AquaClean)</div>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>5 one-touch coffee beverages: Espresso, Cappuccino, Latte, Coffee, Americano</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>AquaClean filter: up to 5,000 cups without descaling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dishwasher safe LatteGo carafe cleans in 15 seconds</span>
                </li>
              </ul>
            </div>

            {/* Hypermarket Bundle Recommendation Card */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>{tPdp('boughtTogether')}</span>
                </div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                  {tPdp('saveBundle')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIUKqsMtOejhQXCClKBJ5ANf7hvHncqM0MhhZrT2WXzBc-bKwzrycuo-rvg0KuE5AVEQUsneRYaJgYGkQ3COPfwsyJseZoW8rgWb7z9KbZsa3ow4zONzKeHMUZVRBypUnxTuT-HDkR9uN3MFEaIHB8x4mtLXNzMi-ePF5_OQbMZ250BU2qmzresn4qxtOwIbuMcM4lDPU_MnBODJvAX1Sc6Gd4otqHbKLBij_zeKEGAyjuOC3aJC9p"
                    alt="Coffee beans"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-slate-400 font-bold text-sm">+</span>
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEeMN-v_bu1vo1BvdcW5fcO6DQrX4h3ZRZQPsDMflEasJhtxjB6CwZymr9QhKemeqOuYwfcZiLboi9xAoNPr6Myq_ndpWzXr9Ej7OeHm0IqgC-r59If5i76MLDK709nRqdL34NqShxga6MMNPAWu3PdMzSbmxnkwxNdamzZqE8jse_Ip0njDIZmzAHDO0y8VnVEwFPCUbWXy7JPqe8F4Egt_QZDV46Np2uuxtx4i5xhx9nZKjMQoio"
                    alt="AquaClean filter"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 pl-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">1kg Arabica Blend + AquaClean Cartridge</div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs font-black text-slate-900">{formatPrice(34.90)}</span>
                    <span className="text-[11px] text-slate-400 line-through">{formatPrice(44.00)}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddBundle}
                  className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {isBundleAdded ? tPdp('added') : tPdp('addBoth')}
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Sticky Buy Box & Fulfillment Engine (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:sticky lg:top-36">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md space-y-4">
              
              {/* Pricing Block */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {formatPrice(currentProduct.price)}
                    </span>
                    {currentProduct.oldPrice && (
                      <span className="text-sm font-medium text-slate-400 line-through">
                        {formatPrice(currentProduct.oldPrice)}
                      </span>
                    )}
                  </div>
                  {currentProduct.discountBadge && (
                    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-md">
                      {currentProduct.discountBadge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-amber-700 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  <span>{tPdp('earnBonus', { company: companyName })}</span>
                </div>
              </div>

              {/* 0% Installment FinTech Banner */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 cursor-pointer hover:bg-blue-100/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#00407a] text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{tPdp('installmentPlan')}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">0-0-12</span>
                  </div>
                  <span className="text-sm font-black text-[#00407a] mt-0.5">
                    {currentProduct.installmentPrice || `${formatPrice(currentProduct.price / 12)} / mo`}
                  </span>
                  <span className="text-[11px] text-slate-500">{tPdp('installmentPlanSub')}</span>
                </div>
              </div>

              {/* Quantity Stepper & Add to Cart */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-md bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(3, quantity + 1))}
                      className="w-7 h-7 rounded-md bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{tPdp('maxUnitsPerBuyer')}</span>
                </div>

                {/* Add To Cart Primary Button */}
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 ${
                    isAddedAnim
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F5A602] hover:bg-[#E09500] text-slate-950 shadow-md'
                  }`}
                >
                  {isAddedAnim ? (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{tPdp('addedToCart', { count: quantity })}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>{tPdp('addToCart')} • {formatPrice(currentProduct.price * quantity)}</span>
                    </>
                  )}
                </button>

                {/* 1-Click Fast Purchase */}
                <button
                  onClick={() => {
                    handleAddToCart();
                    if (onProceedToCheckout) onProceedToCheckout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#00407a] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-500 fill-current" />
                  <span>{tPdp('oneClickCheckout')}</span>
                </button>
              </div>

              {/* Delivery Timelines & Hub Promises */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-[#00407a] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{tPdp('courierDeliveryFree')}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">Fast</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {tPdp('orderCountdownPrompt', { countdown })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">{tPdp('hypermarketPickupFree')}</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {tPdp('readyInHour')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hotline operator widget */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Headphones className="w-4 h-4 text-[#00407a]" />
                  <span>{tPdp('needHelpOrdering')}</span>
                </div>
                <a href="tel:7711" className="text-xs font-bold text-[#00407a] hover:underline">
                  7711 ({tPdp('freeCall')})
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Detailed Tabs Section (Specs, Reviews, Delivery, QA) */}
        <div className="mt-12 bg-white rounded-2xl shadow-xs border border-slate-200 p-6 lg:p-8">
          {/* Tabs Navigation Header */}
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap border-b border-slate-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab('specs')}
              className={`font-bold text-sm pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === 'specs' ? 'text-[#00407a]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tPdp('fullSpecs')}</span>
              {activeTab === 'specs' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00407a] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`font-bold text-sm pb-2.5 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reviews' ? 'text-[#00407a]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tPdp('customerReviews')}</span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {currentProduct.reviewsCount}
              </span>
              {activeTab === 'reviews' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00407a] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`font-bold text-sm pb-2.5 relative transition-colors cursor-pointer ${
                activeTab === 'delivery' ? 'text-[#00407a]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tPdp('deliveryAndPayment')}</span>
              {activeTab === 'delivery' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00407a] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`font-bold text-sm pb-2.5 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'qa' ? 'text-[#00407a]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tPdp('qAndA')}</span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">52</span>
              {activeTab === 'qa' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#00407a] rounded-full" />
              )}
            </button>
          </div>

          {/* TAB 1: Specifications */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-slate-900">{tPdp('completeTechSpecs')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {(currentProduct.detailedSpecs || PHILIPS_PDP_PRODUCT.detailedSpecs || []).map((group, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-bold text-[#00407a] uppercase tracking-wider">
                      {group.category}
                    </h4>
                    <div className="divide-y divide-slate-100 text-xs">
                      {group.items.map((item, itemIdx) => (
                        <div 
                          key={itemIdx} 
                          className={`flex justify-between py-2 px-2.5 rounded ${
                            itemIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'
                          }`}
                        >
                          <span className="text-slate-500">{item.label}</span>
                          <span className="font-semibold text-slate-900 text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Review Summary Score & Star Distribution */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-slate-900">{currentProduct.rating.toFixed(1)}</span>
                    <div className="flex text-amber-400 my-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{tPdp('basedOnReviews', { count: currentProduct.reviewsCount })}</span>
                  </div>

                  {/* Star Distribution Progress */}
                  <div className="flex flex-col gap-1.5 w-48 md:w-60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-slate-500 font-medium">5 ★</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-[#F5A602] h-full w-[88%]"></div>
                      </div>
                      <span className="text-slate-400 w-8 text-right">306</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-slate-500 font-medium">4 ★</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-[#F5A602] h-full w-[9%]"></div>
                      </div>
                      <span className="text-slate-400 w-8 text-right">31</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-slate-500 font-medium">3 ★</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-[#F5A602] h-full w-[2%]"></div>
                      </div>
                      <span className="text-slate-400 w-8 text-right">7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-slate-500 font-medium">2 ★</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-[#F5A602] h-full w-[1%]"></div>
                      </div>
                      <span className="text-slate-400 w-8 text-right">4</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => alert('Review form submitted! Thank you for rating.')}
                  className="bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {tPdp('writeReview')}
                </button>
              </div>

              {/* Review Items List */}
              <div className="space-y-4">
                {(currentProduct.customerReviews || PHILIPS_PDP_PRODUCT.customerReviews || []).map((rev) => (
                  <div key={rev.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#00407a] text-white text-xs font-bold flex items-center justify-center">
                          {rev.avatarText || rev.author.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{rev.author}</span>
                            {rev.verified && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {tModals('verifiedQuality')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{rev.date}</span>
                        </div>
                      </div>

                      <div className="flex text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {rev.content}
                    </p>

                    {rev.photos && rev.photos.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {rev.photos.map((photoUrl, pIdx) => (
                          <img
                            key={pIdx}
                            src={photoUrl}
                            alt="Customer photo"
                            className="w-16 h-16 rounded-lg object-cover border border-slate-200 shadow-xs hover:opacity-90 cursor-pointer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Delivery Terms */}
          {activeTab === 'delivery' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">{tPdp('deliveryAndPayment')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-[#00407a] flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>{tPdp('delivery')}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tPdp('freeExpressCourier')}. Delivered securely from warehouse with package inspection before signing.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-[#00407a] flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <span>{tPdp('hypermarketPickupFree')}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tPdp('readyInHour')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Q&A */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{tPdp('qAndA')}</h3>
                <button 
                  onClick={() => alert('Question posted! Customer support replies within 2 hours.')}
                  className="bg-slate-100 hover:bg-slate-200 text-[#00407a] text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {tPdp('qAndA')}
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">Q: Can plant-based oat or almond milk be used with LatteGo?</div>
                  <p className="text-slate-600">A: Yes! Oat milk with barista-grade fat content produces excellent velvety micro-foam in the LatteGo system.</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900">Q: Is the brewing group removable for washing?</div>
                  <p className="text-slate-600">A: Yes, the entire brewing unit unlocks from the side service door and rinses clean under running tap water.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Related Similar Products Carousel Section */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {tPdp('similar')}
            </h3>
            <span className="text-xs text-slate-400 font-medium">{tPdp('warranty')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SIMILAR_COFFEE_MACHINES.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div 
                    onClick={() => onSelectProduct(item)}
                    className="relative aspect-square bg-slate-50 rounded-lg mb-3 p-3 flex items-center justify-center cursor-pointer overflow-hidden"
                  >
                    {item.discountBadge && (
                      <span className="absolute top-2 left-2 bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {item.discountBadge}
                      </span>
                    )}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-slate-900">{item.rating.toFixed(1)}</span>
                      <span className="text-slate-400">({item.reviewsCount})</span>
                    </div>

                    <h4 
                      onClick={() => onSelectProduct(item)}
                      className="text-xs font-bold text-slate-900 hover:text-[#00407a] line-clamp-2 cursor-pointer transition-colors"
                    >
                      {item.name}
                    </h4>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-black text-slate-900">{formatPrice(item.price)}</span>
                      {item.oldPrice && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(item.oldPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onAddToCart(item, 1)}
                  className="mt-3 w-full py-2 bg-slate-100 hover:bg-[#F5A602] hover:text-slate-950 text-[#00407a] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{tPdp('addToCart')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
