import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';
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
  btnLink?: string;
  duration?: number;
}

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

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onShopDeals,
  onViewFlashDrops,
  onExploreBakery,
  onExploreTech,
}) => {
  const currentLocale = useLocale();
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Fetch dynamic hero slides from API
  useEffect(() => {
    fetch(`/api/hero-slides?locale=${encodeURIComponent(currentLocale || 'en')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setSlides(data.data);
        }
      })
      .catch((err) => {
        console.error('[HeroBanner] Failed to load slides, using fallback:', err);
      });
  }, [currentLocale]);

  // Auto rotate slides (duration from DB or default 7s)
  useEffect(() => {
    const duration = (slides[currentSlideIndex]?.duration || 7) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, duration);
    return () => clearInterval(timer);
  }, [slides, currentSlideIndex]);

  const currentSlide = slides[currentSlideIndex] || FALLBACK_SLIDES[0];

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-5 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Hero Main Banner (8 cols) */}
        <div 
          className="lg:col-span-8 rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px] shadow-lg group"
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
              className="my-6 z-10 max-w-[560px]"
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
              <button
                id="hero-shop-deals-btn"
                onClick={onShopDeals}
                className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
              >
                <span>{currentSlide.btnText || 'Shop Deals Now'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                id="hero-view-drops-btn"
                onClick={onViewFlashDrops}
                className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer backdrop-blur-md shadow-xs"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>View Flash Drops</span>
              </button>
            </div>

            {/* Pagination Controls with Prev/Next Arrows */}
            <div className="flex items-center gap-3 text-white/90 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
                  className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
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
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Top Card: Kitchenware & Tableware */}
          <div 
            onClick={onExploreBakery}
            className="flex-1 bg-[#F0FDF4] border border-emerald-200/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 bg-[#DCFCE7] text-emerald-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  HOME SETS & KITCHEN
                </span>
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Kitchenware, Cookware & Table Sets
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Non-stick granite frying pans, premium stainless steel cutlery, and porcelain tableware.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-emerald-200/60 text-xs">
              <span className="font-extrabold text-slate-900 text-sm">
                From 24.50 BYN
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Explore Kitchenware <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Bottom Card: Home Comfort / Smart Living */}
          <div 
            onClick={onExploreTech}
            className="flex-1 bg-[#EFF6FF] border border-blue-200/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-amber-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  SMART LIVING HUB
                </span>
                <div className="w-9 h-9 rounded-full bg-blue-100 text-[#00407a] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#00407a] transition-colors">
                Robotic Vacuums & Air Purifiers
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Official 2-year warranty with zero hassle replacement guarantee.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-3 border-t border-blue-200/60 text-xs">
              <span className="font-extrabold text-amber-700 text-sm">
                Up to -35%
              </span>
              <span className="text-[#00407a] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                Discover Appliances <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
