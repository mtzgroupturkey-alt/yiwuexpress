import React from 'react';
import { 
  Utensils,
  Armchair,
  Sparkles,
  Lamp,
  Grid,
  Tv,
  Bath,
  Bed,
  Trees,
  Package,
  ArrowRight
} from 'lucide-react';
import { Category } from '../types';

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onViewAllDepartments: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onViewAllDepartments,
}) => {
  const getCategoryIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6 text-[#00407a]' };
    switch (iconName) {
      case 'Utensils': return <Utensils {...props} />;
      case 'Armchair': return <Armchair {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Lamp': return <Lamp {...props} />;
      case 'Grid': return <Grid {...props} />;
      case 'Tv': return <Tv {...props} />;
      case 'Bath': return <Bath {...props} />;
      case 'Bed': return <Bed {...props} />;
      case 'Trees': return <Trees {...props} />;
      case 'Package': return <Package {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <section className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Quality furniture, kitchenware, lighting, and decor for every living space
          </p>
        </div>

        <button
          id="view-all-departments-btn"
          onClick={onViewAllDepartments}
          className="text-xs sm:text-sm font-bold text-[#00407a] hover:text-blue-800 flex items-center gap-1.5 transition-colors group cursor-pointer"
        >
          <span>View all 28 departments</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Grid: 10 categories (2 rows of 5 on desktop, 5 on tablet, 2 on mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50/80 border-[#00407a] shadow-xs ring-1 ring-[#00407a]'
                  : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] group-hover:bg-[#DBEAFE] flex items-center justify-center mb-2.5 transition-colors">
                {getCategoryIcon(cat.icon)}
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#00407a] transition-colors">
                {cat.name}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-medium">
                {cat.itemCount.toLocaleString()} items
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
