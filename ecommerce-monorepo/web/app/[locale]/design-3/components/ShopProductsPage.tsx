import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutList, 
  ChevronRight, 
  X, 
  Search, 
  Star, 
  Zap, 
  Check, 
  RotateCcw, 
  Heart, 
  Plus, 
  Minus, 
  ChevronDown, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Product, Category } from '../types';
import { CATEGORIES, DEPARTMENTS } from '../data/catalogData';

interface ShopProductsPageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  cartQuantities: Record<string, number>;
  favoriteIds: Set<string>;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  initialCategory?: string | null;
  initialDepartment?: string | null;
  initialSearch?: string;
  onBackToHome: () => void;
}

export const ShopProductsPage: React.FC<ShopProductsPageProps> = ({
  products,
  onAddToCart,
  onUpdateQuantity,
  cartQuantities,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  initialCategory = null,
  initialDepartment = null,
  initialSearch = '',
  onBackToHome,
}) => {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartment || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [expressOnly, setExpressOnly] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mobile filter drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Sync initial props when changed externally
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialDepartment) setSelectedDepartment(initialDepartment);
    if (initialSearch !== undefined) setCatalogSearch(initialSearch);
  }, [initialCategory, initialDepartment, initialSearch]);

  // Extract all unique brands with item count
  const allBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    products.forEach((p) => {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    });
    return Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  // Toggle a brand selection
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedDepartment('all');
    setSelectedBrands([]);
    setPriceRange([0, 5000]);
    setMinRating(0);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setExpressOnly(false);
    setCatalogSearch('');
    setSortBy('popular');
    setCurrentPage(1);
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedDepartment !== 'all') count++;
    if (selectedBrands.length > 0) count += selectedBrands.length;
    if (priceRange[0] > 0 || priceRange[1] < 5000) count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
    if (expressOnly) count++;
    if (catalogSearch.trim()) count++;
    return count;
  }, [
    selectedCategory,
    selectedDepartment,
    selectedBrands,
    priceRange,
    minRating,
    inStockOnly,
    onSaleOnly,
    expressOnly,
    catalogSearch,
  ]);

  // Main filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // 1. Search Query
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchDesc && !matchCategory) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Department Filter
      if (selectedDepartment !== 'all' && item.department && item.department !== selectedDepartment) {
        return false;
      }

      // 4. Brands Filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(item.brand)) {
        return false;
      }

      // 5. Price Range
      if (item.price < priceRange[0] || item.price > priceRange[1]) {
        return false;
      }

      // 6. Rating Filter
      if (minRating > 0 && item.rating < minRating) {
        return false;
      }

      // 7. Stock status
      if (inStockOnly && !item.inStock) {
        return false;
      }

      // 8. On Sale / Discount
      if (onSaleOnly && !item.discountBadge && !item.oldPrice) {
        return false;
      }

      // 9. Express delivery
      if (expressOnly && !item.isExpressDelivery) {
        return false;
      }

      return true;
    });
  }, [
    products,
    catalogSearch,
    selectedCategory,
    selectedDepartment,
    selectedBrands,
    priceRange,
    minRating,
    inStockOnly,
    onSaleOnly,
    expressOnly,
  ]);

  // Sorting logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      case 'discount':
        return list.sort((a, b) => {
          const discA = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
          const discB = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
          return discB - discA;
        });
      case 'popular':
      default:
        return list.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }
  }, [filteredProducts, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const currentCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return null;
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? cat.name : selectedCategory;
  }, [selectedCategory]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* 1. Breadcrumbs & Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-4">
          {/* Breadcrumb nav */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 flex-wrap">
            <button 
              onClick={onBackToHome}
              className="hover:text-[#00407a] font-medium transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedDepartment('all');
                setCurrentPage(1);
              }}
              className={`hover:text-[#00407a] font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all' && selectedDepartment === 'all'
                  ? 'text-[#00407a] font-bold'
                  : ''
              }`}
            >
              Shop Catalog
            </button>
            {selectedDepartment !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{selectedDepartment}</span>
              </>
            )}
            {selectedCategory !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{currentCategoryName}</span>
              </>
            )}
          </nav>

          {/* Page Headline & SKU Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00407a] to-[#0157A3] text-white flex items-center justify-center shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentCategoryName || (selectedDepartment !== 'all' ? selectedDepartment : 'All Shop Products')}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Showing <strong className="text-slate-900 font-bold">{sortedProducts.length}</strong> items • Direct hypermarket fulfillment with 60-min delivery
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#00407a]" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#00407a] text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Layout: Sidebar + Product Grid */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
        <div className="flex items-start gap-6">
          
          {/* DESKTOP FILTER SIDEBAR */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-28 max-h-[calc(100vh-130px)] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-[#00407a]" />
                <span>Filters & Facets</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset all
                </button>
              )}
            </div>

            {/* 1. Quick Deals & Express Delivery Switches */}
            <div className="py-4 border-b border-slate-100 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Special Perks
              </div>
              <label className="flex items-center justify-between cursor-pointer group select-none">
                <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  On Sale & Promos
                </span>
                <input
                  type="checkbox"
                  checked={onSaleOnly}
                  onChange={(e) => {
                    setOnSaleOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 accent-[#00407a] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group select-none">
                <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  Express 60 min
                </span>
                <input
                  type="checkbox"
                  checked={expressOnly}
                  onChange={(e) => {
                    setExpressOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 accent-[#00407a] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group select-none">
                <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  In Stock Only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 accent-[#00407a] rounded cursor-pointer"
                />
              </label>
            </div>

            {/* 2. Department Filter */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Departments
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedDepartment('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedDepartment === 'all'
                      ? 'bg-blue-50 text-[#00407a] font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>All Departments</span>
                  <span className="text-[10px] text-slate-400">{products.length}</span>
                </button>
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepartment === dept.name;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => {
                        setSelectedDepartment(isSelected ? 'all' : dept.name);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 text-[#00407a] font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{dept.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {dept.itemCount > 1000 ? `${Math.round(dept.itemCount / 1000)}k` : dept.itemCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Product Categories */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Categories
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-blue-50 text-[#00407a] font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(isSelected ? 'all' : cat.id);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 text-[#00407a] font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Price Range Slider & Inputs */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Price (BYN)
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold">Min</div>
                  <input
                    type="number"
                    min="0"
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setPriceRange([val, priceRange[1]]);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold">Max</div>
                  <input
                    type="number"
                    min={priceRange[0]}
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 5000;
                      setPriceRange([priceRange[0], val]);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="5000"
                step="25"
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([priceRange[0], Number(e.target.value)]);
                  setCurrentPage(1);
                }}
                className="w-full accent-[#00407a] cursor-pointer"
              />

              {/* Quick price pills */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                <button
                  onClick={() => {
                    setPriceRange([0, 25]);
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  &lt; 25 BYN
                </button>
                <button
                  onClick={() => {
                    setPriceRange([25, 100]);
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  25 - 100
                </button>
                <button
                  onClick={() => {
                    setPriceRange([100, 1000]);
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  100 - 1000
                </button>
                <button
                  onClick={() => {
                    setPriceRange([1000, 5000]);
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  1000+
                </button>
              </div>
            </div>

            {/* 5. Brand Multi-Select */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Brands ({allBrands.length})
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {allBrands.map(({ brand, count }) => {
                  const isChecked = selectedBrands.includes(brand);
                  return (
                    <label
                      key={brand}
                      className="flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBrandToggle(brand)}
                          className="w-3.5 h-3.5 accent-[#00407a] rounded cursor-pointer"
                        />
                        <span className={isChecked ? 'font-bold text-[#00407a]' : 'font-medium'}>
                          {brand}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. Customer Rating Filter */}
            <div className="pt-4">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Customer Rating
              </div>
              <div className="space-y-1.5">
                {[
                  { stars: 4.8, label: '4.8★ & up (Top Rated)' },
                  { stars: 4.5, label: '4.5★ & up' },
                  { stars: 4.0, label: '4.0★ & up' },
                ].map(({ stars, label }) => (
                  <button
                    key={stars}
                    onClick={() => {
                      setMinRating(minRating === stars ? 0 : stars);
                      setCurrentPage(1);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      minRating === stars
                        ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{label}</span>
                    </div>
                    {minRating === stars && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCT LISTING AREA */}
          <div className="flex-1 min-w-0">
            {/* Top Toolbar: Search within Catalog, Active Chips, Sort & View Mode */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search in products */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search in these filtered products..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00407a] focus:bg-white transition-colors"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Right controls: Sort + View Toggles */}
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 font-medium hidden sm:inline">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#00407a] cursor-pointer"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating">Highest Rating</option>
                      <option value="discount">Biggest Discount (%)</option>
                    </select>
                  </div>

                  {/* View Mode Toggle: Grid vs List */}
                  <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#00407a] shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'list'
                          ? 'bg-white text-[#00407a] shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="List View"
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Active:</span>

                  {selectedDepartment !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00407a] border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Dept: {selectedDepartment}
                      <button onClick={() => setSelectedDepartment('all')} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00407a] border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Cat: {currentCategoryName}
                      <button onClick={() => setSelectedCategory('all')} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedBrands.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Brand: {b}
                      <button onClick={() => handleBrandToggle(b)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Price: {priceRange[0]} - {priceRange[1]} BYN
                      <button onClick={() => setPriceRange([0, 5000])} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {onSaleOnly && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      On Sale
                      <button onClick={() => setOnSaleOnly(false)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {expressOnly && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      Express 60 min
                      <button onClick={() => setExpressOnly(false)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {minRating}+ Stars
                      <button onClick={() => setMinRating(0)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold underline ml-1 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* 3. Product Cards Rendering */}
            {sortedProducts.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-[#00407a] flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">
                  No products match your criteria
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  Try adjusting or clearing some of your filters, widening the price range, or searching with broader keywords.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-[#00407a] hover:bg-[#003366] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset All Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {paginatedProducts.map((product) => {
                  const qty = cartQuantities[product.id] || 0;
                  const isFav = favoriteIds.has(product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group relative"
                    >
                      {/* Top Badges & Favorite Button */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="flex flex-col gap-1">
                          {product.discountBadge && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs w-fit">
                              {product.discountBadge}
                            </span>
                          )}
                          {product.tagBadge && (
                            <span className="bg-[#00407a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide w-fit">
                              {product.tagBadge.text}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onToggleFavorite(product)}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                            isFav
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-300 hover:text-red-400 hover:bg-slate-100'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Image */}
                      <div
                        onClick={() => onSelectProduct(product)}
                        className="aspect-square w-full rounded-xl bg-slate-50 flex items-center justify-center p-3 mb-3 cursor-pointer overflow-hidden group-hover:scale-[1.02] transition-transform duration-200"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                          loading="lazy"
                        />
                      </div>

                      {/* Meta & Title */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                          <span className="uppercase tracking-wider text-slate-600 font-bold">{product.brand}</span>
                          <span>{product.originOrType}</span>
                        </div>

                        <h3
                          onClick={() => onSelectProduct(product)}
                          className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-[#00407a] cursor-pointer mb-2 leading-snug"
                        >
                          {product.name}
                        </h3>

                        {/* Rating & reviews */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            ({product.reviewsCount})
                          </span>
                          {product.isExpressDelivery && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 fill-emerald-600" /> 60 min
                            </span>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="mt-auto pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              {product.price.toFixed(2)} BYN
                            </span>
                            {product.oldPrice && (
                              <span className="text-xs text-slate-400 line-through font-semibold">
                                {product.oldPrice.toFixed(2)} BYN
                              </span>
                            )}
                          </div>
                          {product.unitPrice && (
                            <div className="text-[10px] text-slate-400 font-medium truncate">
                              {product.unitPrice}
                            </div>
                          )}
                          {product.installmentPrice && (
                            <div className="text-[10px] text-[#00407a] font-bold truncate mt-0.5">
                              {product.installmentPrice}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart / Stepper */}
                      <div className="mt-3">
                        {qty === 0 ? (
                          <button
                            onClick={() => onAddToCart(product, 1)}
                            className="w-full bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Add to Cart</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
                            <button
                              onClick={() => onUpdateQuantity(product.id, qty - 1)}
                              className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-[#00407a] px-2">
                              {qty} in cart
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(product.id, qty + 1)}
                              className="w-7 h-7 bg-[#00407a] hover:bg-[#003366] text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="space-y-3">
                {paginatedProducts.map((product) => {
                  const qty = cartQuantities[product.id] || 0;
                  const isFav = favoriteIds.has(product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 hover:shadow-md transition-all duration-200 group"
                    >
                      {/* Image with badges */}
                      <div className="relative w-full sm:w-36 h-36 bg-slate-50 rounded-xl flex items-center justify-center p-3 shrink-0 overflow-hidden">
                        {product.discountBadge && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs z-10">
                            {product.discountBadge}
                          </span>
                        )}
                        <img
                          src={product.image}
                          alt={product.name}
                          onClick={() => onSelectProduct(product)}
                          className="w-full h-full object-contain mix-blend-multiply cursor-pointer group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Content details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {product.brand}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {product.originOrType}
                          </span>
                          {product.isExpressDelivery && (
                            <span className="ml-auto text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                              Express 60 min
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => onSelectProduct(product)}
                          className="text-sm sm:text-base font-bold text-slate-900 hover:text-[#00407a] cursor-pointer mb-1.5 line-clamp-1"
                        >
                          {product.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            {product.reviewsCount} customer reviews
                          </span>
                          {product.stockLeft && product.stockLeft < 15 && (
                            <span className="text-amber-700 text-[11px] font-semibold">
                              Only {product.stockLeft} units left in hub
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Action button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                            {product.price.toFixed(2)} BYN
                          </div>
                          {product.oldPrice && (
                            <div className="text-xs text-slate-400 line-through font-semibold">
                              {product.oldPrice.toFixed(2)} BYN
                            </div>
                          )}
                          {product.unitPrice && (
                            <div className="text-[10px] text-slate-400">
                              {product.unitPrice}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleFavorite(product)}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isFav
                                ? 'bg-red-50 border-red-200 text-red-500'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                          </button>

                          {qty === 0 ? (
                            <button
                              onClick={() => onAddToCart(product, 1)}
                              className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                            >
                              Add to Cart
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-1">
                              <button
                                onClick={() => onUpdateQuantity(product.id, qty - 1)}
                                className="w-7 h-7 bg-white text-slate-900 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-[#00407a] px-1">
                                {qty}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(product.id, qty + 1)}
                                className="w-7 h-7 bg-[#00407a] text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. Pagination Controls */}
            {sortedProducts.length > 0 && (
              <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="text-xs text-slate-500">
                  Showing <strong className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong className="text-slate-900 font-bold">
                    {Math.min(currentPage * itemsPerPage, sortedProducts.length)}
                  </strong>{' '}
                  of <strong className="text-slate-900 font-bold">{sortedProducts.length}</strong> hypermarket items
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => {
                          setCurrentPage(pg);
                          window.scrollTo({ top: 180, behavior: 'smooth' });
                        }}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pg
                            ? 'bg-[#00407a] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE FILTER MODAL / DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-[#00407a]" />
                <span>Filters ({activeFiltersCount})</span>
              </div>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Quick toggles */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase">Perks & Stock</div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>On Sale Only</span>
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={(e) => setOnSaleOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00407a]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>Express 60 min Delivery</span>
                  <input
                    type="checkbox"
                    checked={expressOnly}
                    onChange={(e) => setExpressOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00407a]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00407a]"
                  />
                </label>
              </div>

              {/* Departments */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">Department</div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">Category</div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">
                  Max Price: {priceRange[1]} BYN
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="25"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-[#00407a]"
                />
              </div>

              {/* Brands */}
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">Brands</div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {allBrands.map(({ brand }) => (
                    <button
                      key={brand}
                      onClick={() => handleBrandToggle(brand)}
                      className={`text-left px-2 py-1 rounded text-xs truncate border ${
                        selectedBrands.includes(brand)
                          ? 'bg-[#00407a] text-white border-[#00407a] font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 font-medium'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#00407a] text-white rounded-xl text-xs font-bold hover:bg-[#003366]"
              >
                Apply ({sortedProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
