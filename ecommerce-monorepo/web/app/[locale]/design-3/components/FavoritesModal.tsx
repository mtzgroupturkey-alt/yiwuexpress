import React from 'react';
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFavorite: (product: Product) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onAddToCart,
  onRemoveFavorite,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h3 className="text-base font-bold text-slate-900">
              Saved Favorites ({favorites.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No favorites yet</h4>
              <p className="text-xs text-slate-400">Click the heart icon on any product to save it here.</p>
            </div>
          ) : (
            favorites.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 hover:border-blue-200 bg-white"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 object-contain rounded-md border border-slate-100 p-1 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">{product.brand}</div>
                  <h4 className="text-xs font-bold text-slate-900 truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="text-xs font-black text-slate-900 mt-1">
                    {product.price.toFixed(2)} BYN
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onAddToCart(product)}
                    className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(product)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
