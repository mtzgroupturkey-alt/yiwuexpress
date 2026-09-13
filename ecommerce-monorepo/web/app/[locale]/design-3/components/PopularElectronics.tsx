import React, { useState } from 'react';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface PopularElectronicsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  onSelectProduct: (product: Product) => void;
  onViewAllElectronics?: () => void;
}

const FILTER_TABS = [
  'All Popular',
  'Robot Vacuums',
  'Air Fryers & Grills',
  'Coffee Machines',
  'Smart TVs',
];

export const PopularElectronics: React.FC<PopularElectronicsProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  onSelectProduct,
  onViewAllElectronics,
}) => {
  const [activeFilter, setActiveFilter] = useState('All Popular');

  const filteredProducts = activeFilter === 'All Popular'
    ? products
    : products.filter((p) => p.category.toLowerCase() === activeFilter.toLowerCase());

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Header & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Popular in Electronics & Appliances
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official manufacturer equipment with factory guarantee
          </p>
        </div>

        {/* Filter Pills & View All */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00407a] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            );
          })}

          {onViewAllElectronics && (
            <button
              onClick={onViewAllElectronics}
              className="text-xs font-bold text-[#00407a] hover:text-[#003366] hover:underline flex items-center gap-1 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Explore All in Shop</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const qtyInCart = cartQuantities[product.id] || 0;

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <div>
                {/* Top Bar: Spec/Promo Pill + In Stock indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {product.tagBadge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                        product.tagBadge.type === 'promo'
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#EFF6FF] text-[#00407a] border border-blue-200'
                      }`}
                    >
                      {product.tagBadge.text}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    In Stock
                  </span>
                </div>

                {/* Product Photo */}
                <div
                  onClick={() => onSelectProduct(product)}
                  className="aspect-square w-full rounded-lg bg-white overflow-hidden flex items-center justify-center mb-3 cursor-pointer p-2"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Brand & Subtype */}
                <div className="text-xs text-slate-500 font-medium mb-1">
                  <strong className="text-slate-800 font-bold">{product.brand}</strong> • {product.originOrType}
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectProduct(product)}
                  className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug h-[40px] hover:text-[#00407a] transition-colors cursor-pointer mb-3"
                  title={product.name}
                >
                  {product.name}
                </h3>

                {/* Specs pills */}
                {product.specs && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {product.specs.map((spec, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Buy Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-lg font-black text-slate-900">
                      {product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BYN
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        {product.oldPrice.toFixed(2)} BYN
                      </span>
                    )}
                  </div>
                  {product.installmentPrice && (
                    <div className="text-[10px] text-slate-500 font-medium">
                      {product.installmentPrice}
                    </div>
                  )}
                </div>

                {/* Buy Button */}
                {qtyInCart === 0 ? (
                  <button
                    id={`buy-btn-${product.id}`}
                    onClick={() => onAddToCart(product)}
                    className="bg-[#F5A602] hover:bg-[#E09500] active:scale-95 text-slate-950 font-bold px-3.5 py-2 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Buy</span>
                  </button>
                ) : (
                  <div className="flex items-center bg-slate-100 border border-slate-300 rounded-md p-0.5 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(product.id, qtyInCart - 1)}
                      className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-black text-slate-900 px-2">
                      {qtyInCart}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(product.id, qtyInCart + 1)}
                      className="w-6 h-6 rounded bg-[#00407a] hover:bg-[#003366] text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
