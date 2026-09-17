import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MOTION_TOKENS } from '@/lib/motion';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Store, 
  Headphones, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Flame
} from 'lucide-react';

interface HeroBannerProps {
  onShopDeals: () => void;
  onViewFlashDrops: () => void;
  onExploreBakery: () => void;
  onExploreTech: () => void;
}

interface Slide {
  id: string | number;
  tag: string | null;
  subtag: string | null;
  headline: string;
  description: string | null;
  image: string;
  overlayGradient: string;
  btnText: string;
  badgeColor?: string;
  textColor?: string;
  secondaryBtnText?: string | null;
  secondaryBtnLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  btnLink?: string;
  ctaLink?: string;
  duration?: number;
  title?: string;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaText?: string;
  imageUrl?: string;
}

interface SideBannerItem {
  id?: string | number;
  tag?: string | null;
  subtag?: string | null;
  headline?: string;
  description?: string | null;
  btnText?: string;
  btnLink?: string;
  badgeColor?: string;
  textColor?: string;
  overlayColor?: string | null;
  title?: string;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string | null;
  imageUrl?: string;
}

const DEFAULT_SIDE_TOP: SideBannerItem = {
  id: 'default-side-top',
  tag: 'HOME SETS & KITCHEN',
  headline: 'Kitchenware, Cookware & Table Sets',
  description: 'Non-stick granite frying pans, premium stainless steel cutlery, and porcelain tableware.',
  subtag: 'From $24.50',
  btnText: 'Explore Kitchenware',
  btnLink: '/store?department=Kitchenware & Dining',
  overlayColor: 'emerald',
};

const DEFAULT_SIDE_BOTTOM: SideBannerItem = {
  id: 'default-side-bottom',
  tag: 'SMART LIVING HUB',
  headline: 'Robotic Vacuums & Air Purifiers',
  description: 'Official 2-year warranty with zero hassle replacement guarantee.',
  subtag: 'Up to -35%',
  btnText: 'Discover Appliances',
  btnLink: '/store?department=Furniture & Living',
  overlayColor: 'blue',
};

const FALLBACK_SLIDES: Slide[] = [
  {
    id: 1,
    tag: 'MODERN FURNITURE',
    subtag: 'NEW LIVING ROOM COLLECTION',
    headline: 'Modern Furniture — Up to 30% Off',
    description: 'Ergonomic lounge chairs, minimalist modular sofas, and solid wood dining tables crafted for ultimate comfort and elegance.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(90deg, rgba(7,26,48,0.94) 0%, rgba(7,26,48,0.85) 45%, rgba(7,26,48,0.40) 80%, rgba(7,26,48,0.20) 100%)',
    btnText: 'Shop Furniture'
  },
  {
    id: 2,
    tag: 'CHEF KITCHENWARE',
    subtag: 'CULINARY EXCELLENCE',
    headline: 'Professional Kitchenware & Cookware Sets',
    description: 'Cast iron skillets, non-stick granite pots, and Japanese precision cutlery sets designed for everyday home chefs.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1600&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(90deg, rgba(46,20,7,0.95) 0%, rgba(46,20,7,0.86) 45%, rgba(46,20,7,0.40) 80%, rgba(46,20,7,0.20) 100%)',
    btnText: 'Explore Kitchenware'
  },
  {
    id: 3,
    tag: 'HOME DECOR & TEXTILES',
    subtag: 'COZY LIVING ESSENTIALS',
    headline: 'Luxury Bedding, Linens & Artisan Accents',
    description: '100% Egyptian cotton duvet covers, handcrafted ceramic vases, and textured wool rugs that elevate every room in your home.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(90deg, rgba(17,24,39,0.94) 0%, rgba(17,24,39,0.85) 45%, rgba(17,24,39,0.40) 80%, rgba(17,24,39,0.20) 100%)',
    btnText: 'Discover Decor'
  },
  {
    id: 4,
    tag: 'DESIGNER LIGHTING',
    subtag: 'WARM AMBIENCE',
    headline: 'Pendant Lamps, Floor Lights & Smart Fixtures',
    description: 'Warm mood lighting, Scandinavian minimalist floor lamps, and smart dimmable ceiling pendants to brighten your sanctuary.',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1600&auto=format&fit=crop&q=80',
    overlayGradient: 'linear-gradient(90deg, rgba(30,27,75,0.95) 0%, rgba(30,27,75,0.86) 45%, rgba(30,27,75,0.40) 80%, rgba(30,27,75,0.20) 100%)',
    btnText: 'Shop Lighting'
  }
];

export const HeroBannerSkeleton: React.FC = () => {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 pt-5 pb-6">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse">
        {/* Main Banner Skeleton */}
        <div className="lg:col-span-8 min-w-0 w-full rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px] bg-slate-900 shadow-lg border border-slate-800">
          <div className="space-y-4 max-w-lg z-10">
            <div className="h-5 w-32 bg-slate-800 rounded-sm"></div>
            <div className="h-9 sm:h-12 w-3/4 bg-slate-800 rounded-md"></div>
            <div className="h-4 w-full bg-slate-800/70 rounded"></div>
            <div className="h-4 w-2/3 bg-slate-800/70 rounded"></div>
          </div>
          <div className="flex items-center gap-3 z-10 pt-6">
            <div className="h-11 w-40 bg-amber-500/50 rounded-xl"></div>
            <div className="h-11 w-32 bg-slate-800/80 rounded-xl"></div>
          </div>
        </div>

        {/* Right Stacked Feature Banners Skeleton */}
        <div className="lg:col-span-4 min-w-0 w-full flex flex-col gap-4">
          <div className="flex-1 rounded-2xl p-5 sm:p-6 bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[180px] sm:min-h-[200px]">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-800 rounded-sm"></div>
              <div className="h-6 w-48 bg-slate-800 rounded"></div>
              <div className="h-3 w-40 bg-slate-800/70 rounded"></div>
            </div>
            <div className="h-8 w-28 bg-slate-800 rounded-lg"></div>
          </div>
          <div className="flex-1 rounded-2xl p-5 sm:p-6 bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[180px] sm:min-h-[200px]">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-slate-800 rounded-sm"></div>
              <div className="h-6 w-48 bg-slate-800 rounded"></div>
              <div className="h-3 w-40 bg-slate-800/70 rounded"></div>
            </div>
            <div className="h-8 w-28 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onShopDeals,
  onViewFlashDrops,
  onExploreBakery,
  onExploreTech,
}) => {
  const currentLocale = useLocale();
  const router = useRouter();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch dynamic hero slides & side banners from live DB
  const { data: heroData, isLoading } = useQuery({
    queryKey: ['hero-slides', currentLocale],
    queryFn: async () => {
      const res = await fetch(`/api/hero-slides?locale=${encodeURIComponent(currentLocale || 'en')}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides: Slide[] = useMemo(() => {
    if (heroData?.data && Array.isArray(heroData.data) && heroData.data.length > 0) {
      return heroData.data;
    }
    return FALLBACK_SLIDES;
  }, [heroData]);

  const sideBanners: { top: SideBannerItem; bottom: SideBannerItem } = useMemo(() => {
    return {
      top: heroData?.sideBanners?.top || DEFAULT_SIDE_TOP,
      bottom: heroData?.sideBanners?.bottom || DEFAULT_SIDE_BOTTOM,
    };
  }, [heroData]);

  // Auto rotate slides (duration from DB or default 6s)
  useEffect(() => {
    if (slides.length <= 1) return;
    const duration = (slides[currentSlideIndex]?.duration || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, duration);
    return () => clearInterval(timer);
  }, [slides, currentSlideIndex]);

  if (isLoading && !heroData) {
    return <HeroBannerSkeleton />;
  }

  const currentSlide = slides[currentSlideIndex] || slides[0] || FALLBACK_SLIDES[0];

  const handlePrimaryClick = () => {
    const link = currentSlide.btnLink || currentSlide.ctaLink;
    if (link && link !== '#') {
      if (link.startsWith('#')) {
        const el = document.getElementById(link.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(link.startsWith('/') ? `/${currentLocale}${link}` : link);
      }
    } else {
      onShopDeals();
    }
  };

  const handleSecondaryClick = () => {
    const link = currentSlide.secondaryBtnLink;
    if (link && link !== '#') {
      if (link.startsWith('#')) {
        const el = document.getElementById(link.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(link.startsWith('/') ? `/${currentLocale}${link}` : link);
      }
    } else {
      onViewFlashDrops();
    }
  };

  const handleTopSideClick = () => {
    const link = sideBanners.top?.btnLink || sideBanners.top?.ctaLink;
    if (link && link !== '#') {
      router.push(link.startsWith('/') ? `/${currentLocale}${link}` : link);
    } else {
      onExploreBakery();
    }
  };

  const handleBottomSideClick = () => {
    const link = sideBanners.bottom?.btnLink || sideBanners.bottom?.ctaLink;
    if (link && link !== '#') {
      router.push(link.startsWith('/') ? `/${currentLocale}${link}` : link);
    } else {
      onExploreTech();
    }
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 pt-5 pb-6">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Hero Main Banner (8 cols) */}
        <div 
          className="lg:col-span-8 min-w-0 w-full rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px] shadow-lg group"
        >
          {/* Background Photography Layers with Crossfade */}
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: '1000ms',
              }}
            >
              <img
                src={slide.image}
                alt={slide.headline}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Studio lighting gradient overlay for high contrast readability like 5element/emall */}
              <div
                className="absolute inset-0"
                style={{ background: slide.overlayGradient }}
              />
            </div>
          ))}

          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2.5 z-10">
            {currentSlide.tag && (
              <span
                className="inline-flex items-center gap-1.5 text-slate-950 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-md"
                style={{ backgroundColor: currentSlide.badgeColor || '#F5A602' }}
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                {currentSlide.tag}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Official Distributor Guaranteed
            </span>
          </div>

          {/* Center Copy with Staggered Kinetic Motion */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: MOTION_TOKENS.easeOutCubic }}
              className="my-6 z-10 w-full max-w-[560px]"
            >
              {currentSlide.subtag && (
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider mb-2 uppercase drop-shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span>
                  <span>{currentSlide.subtag}</span>
                </div>
              )}
              <h1
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold leading-[1.15] tracking-tight mb-3 font-['Inter'] drop-shadow-md"
                style={{ color: currentSlide.textColor || '#ffffff' }}
              >
                {currentSlide.headline}
              </h1>
              {currentSlide.description && (
                <p className="text-slate-100/90 text-sm sm:text-base leading-relaxed drop-shadow-sm max-w-[520px]">
                  {currentSlide.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons & Slide Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 z-10">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                id="hero-shop-deals-btn"
                onClick={handlePrimaryClick}
                className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
              >
                <span>{currentSlide.btnText || currentSlide.ctaText || 'Shop Deals Now'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                id="hero-view-drops-btn"
                onClick={handleSecondaryClick}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer backdrop-blur-md shadow-xs"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>{currentSlide.secondaryBtnText || currentSlide.secondaryCtaText || 'View Flash Drops'}</span>
              </motion.button>
            </div>

            {/* Pagination Controls with Prev/Next Arrows */}
            <div className="flex items-center gap-3 text-white/90 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="flex items-center gap-1.5 ml-1">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentSlideIndex 
                        ? 'w-6 bg-[#F5A602]' 
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <span className="hidden sm:inline-block">
                Slide <strong className="text-white font-bold">{currentSlideIndex + 1}</strong> / {slides.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 2 Stacked Feature Cards (4 cols) */}
        <div className="lg:col-span-4 min-w-0 w-full flex flex-col gap-4">
          {/* Top Card: Kitchenware & Tableware */}
          <motion.div 
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onClick={handleTopSideClick}
            className="flex-1 bg-[#F0FDF4] border border-emerald-200/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {sideBanners.top?.badgeText || sideBanners.top?.tag || 'HOME SETS & KITCHEN'}
                </span>
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                {sideBanners.top?.headline || sideBanners.top?.title || 'Kitchenware, Cookware & Table Sets'}
              </h3>
              {(sideBanners.top?.description || sideBanners.top?.subtitle) && (
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {sideBanners.top?.description || sideBanners.top?.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-emerald-200/60 text-xs">
              <span className="font-extrabold text-slate-900 text-sm">
                {sideBanners.top?.subtag || 'From $24.50'}
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                {sideBanners.top?.btnText || sideBanners.top?.ctaText || 'Explore Kitchenware'} <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

          {/* Bottom Card: Home Comfort / Smart Living */}
          <motion.div 
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            onClick={handleBottomSideClick}
            className="flex-1 bg-[#EFF6FF] border border-blue-200/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-amber-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {sideBanners.bottom?.badgeText || sideBanners.bottom?.tag || 'SMART LIVING HUB'}
                </span>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-[#00407a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#00407a] transition-colors">
                {sideBanners.bottom?.headline || sideBanners.bottom?.title || 'Robotic Vacuums & Air Purifiers'}
              </h3>
              {(sideBanners.bottom?.description || sideBanners.bottom?.subtitle) && (
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {sideBanners.bottom?.description || sideBanners.bottom?.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-blue-200/60 text-xs">
              <span className="font-extrabold text-amber-700 text-sm">
                {sideBanners.bottom?.subtag || 'Up to -35%'}
              </span>
              <span className="text-[#00407a] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                {sideBanners.bottom?.btnText || sideBanners.bottom?.ctaText || 'Discover Appliances'} <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
