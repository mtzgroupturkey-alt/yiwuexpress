import React, { useState, useMemo, useEffect } from 'react';
import { 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutList, 
  ChevronRight, 
  ChevronDown,
  X, 
  Search, 
  Star, 
  Zap, 
  Check, 
  RotateCcw, 
  Heart, 
  Plus, 
  Minus, 
  Sparkles,
  ShoppingBag,
  Folder,
  Layers
} from 'lucide-react';
import { Product, Category } from '../types';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import { useCurrency } from '@/hooks/useCurrency';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { mapDbCategoryToDesign3 } from '@/lib/adapters/design3ProductAdapter';

interface ShopProductsPageProps {
  products: Product[];
  categories?: Category[];
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
  categories: propCategories,
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
  const locale = useLocale();
  const { tShop, tPdp, tBadge } = useStorefrontTranslation();
  const { formatPrice } = useCurrency();

  // If categories prop is not passed or empty, fetch via React Query
  const { data: categoriesQueryData } = useQuery({
    queryKey: ['categories', 'shop-page-filter', locale],
    queryFn: async () => {
      const res = await fetch(`/api/categories?locale=${locale}&includeChildren=true`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !propCategories || propCategories.length === 0,
    staleTime: 10 * 60 * 1000,
  });

  const rawCategories: Category[] = useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories;
    }
    const rawList = categoriesQueryData?.data || categoriesQueryData || [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map(mapDbCategoryToDesign3);
    }
    return [];
  }, [propCategories, categoriesQueryData]);

  // Compute dynamic min and max price from products catalog
  const { minCatalogPrice, maxCatalogPrice } = useMemo(() => {
    if (!products || products.length === 0) return { minCatalogPrice: 0, maxCatalogPrice: 2000 };
    const validPrices = products
      .map((p) => p.price)
      .filter((pr) => typeof pr === 'number' && !isNaN(pr));
    if (validPrices.length === 0) return { minCatalogPrice: 0, maxCatalogPrice: 2000 };
    const min = Math.floor(Math.min(...validPrices));
    const max = Math.ceil(Math.max(...validPrices));
    return {
      minCatalogPrice: Math.max(0, min),
      maxCatalogPrice: Math.max(min + 1, max),
    };
  }, [products]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartment || 'all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([minCatalogPrice, maxCatalogPrice]);
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [expressOnly, setExpressOnly] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating' | 'discount'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Mobile filter drawer
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Accordion expanded department IDs
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Build recursive Category Tree with live product counts and lookup map
  interface CategoryTreeNode {
    id: string;
    name: string;
    slug: string;
    level: number;
    parentId?: string | null;
    icon?: string;
    count: number;
    children: CategoryTreeNode[];
    matchKeys: Set<string>;
  }

  const { departmentTree, categoryLookupMap } = useMemo(() => {
    const lookup = new Map<string, CategoryTreeNode>();

    const collectSubtreeKeys = (cat: Category): Set<string> => {
      const keys = new Set<string>();
      if (cat.id) keys.add(cat.id);
      if (cat.slug) keys.add(cat.slug.toLowerCase());
      if (cat.name) keys.add(cat.name.toLowerCase());
      if (Array.isArray(cat.children)) {
        for (const child of cat.children) {
          const childKeys = collectSubtreeKeys(child);
          for (const k of childKeys) keys.add(k);
        }
      }
      return keys;
    };

    const buildNode = (cat: Category): CategoryTreeNode => {
      const matchKeys = collectSubtreeKeys(cat);
      let count = 0;
      for (const p of products) {
        const catIdMatch = p.categoryId && matchKeys.has(p.categoryId);
        const catSlugMatch = p.categorySlug && matchKeys.has(p.categorySlug.toLowerCase());
        const catNameMatch = p.category && matchKeys.has(p.category.toLowerCase());
        const deptIdMatch = p.departmentId && matchKeys.has(p.departmentId);
        const deptSlugMatch = p.departmentSlug && matchKeys.has(p.departmentSlug.toLowerCase());
        const deptNameMatch = p.department && matchKeys.has(p.department.toLowerCase());
        if (catIdMatch || catSlugMatch || catNameMatch || deptIdMatch || deptSlugMatch || deptNameMatch) {
          count++;
        }
      }

      const childNodes: CategoryTreeNode[] = Array.isArray(cat.children)
        ? cat.children.map(buildNode)
        : [];

      const node: CategoryTreeNode = {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.id,
        level: cat.level || 1,
        parentId: cat.parentId || null,
        icon: cat.icon,
        count,
        children: childNodes,
        matchKeys,
      };

      lookup.set(node.id, node);
      lookup.set(node.slug.toLowerCase(), node);
      lookup.set(node.name.toLowerCase(), node);

      return node;
    };

    let roots = rawCategories.filter((c) => !c.parentId);
    if (roots.length === 0 && rawCategories.length > 0) {
      roots = rawCategories;
    }

    const tree: CategoryTreeNode[] = roots.map(buildNode);

    rawCategories.forEach((c) => {
      if (!lookup.has(c.id)) {
        const n = buildNode(c);
        lookup.set(n.id, n);
      }
    });

    return { departmentTree: tree, categoryLookupMap: lookup };
  }, [rawCategories, products]);

  // Resolve current active department node and localized name
  const currentDepartmentNode = useMemo(() => {
    if (selectedDepartment === 'all') return null;
    return categoryLookupMap.get(selectedDepartment) || 
           categoryLookupMap.get(selectedDepartment.toLowerCase()) || 
           null;
  }, [selectedDepartment, categoryLookupMap]);

  const currentDepartmentName = currentDepartmentNode 
    ? currentDepartmentNode.name 
    : (selectedDepartment !== 'all' ? selectedDepartment : null);

  // Resolve current active category node and localized name
  const currentCategoryNode = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categoryLookupMap.get(selectedCategory) || 
           categoryLookupMap.get(selectedCategory.toLowerCase()) || 
           null;
  }, [selectedCategory, categoryLookupMap]);

  const currentCategoryName = currentCategoryNode 
    ? currentCategoryNode.name 
    : (selectedCategory !== 'all' ? selectedCategory : null);

  // Sync initial props when changed externally (e.g. clicking 'All Home Products' or switching categories)
  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
    setSelectedDepartment(initialDepartment || 'all');
    setCatalogSearch(initialSearch || '');
    if (!initialCategory && !initialDepartment && !initialSearch) {
      setSelectedBrands([]);
      setMinRating(0);
      setInStockOnly(false);
      setOnSaleOnly(false);
      setExpressOnly(false);
      setCurrentPage(1);
    }
  }, [initialCategory, initialDepartment, initialSearch]);

  // Sync price bounds when products catalog loads
  useEffect(() => {
    setPriceRange([minCatalogPrice, maxCatalogPrice]);
  }, [minCatalogPrice, maxCatalogPrice]);

  // Auto-expand department when selected or when its subcategory is selected
  useEffect(() => {
    if (selectedDepartment !== 'all') {
      const node = categoryLookupMap.get(selectedDepartment) || categoryLookupMap.get(selectedDepartment.toLowerCase());
      if (node) {
        setExpandedDepts((prev) => new Set([...prev, node.id]));
      }
    }
    if (selectedCategory !== 'all') {
      const catNode = categoryLookupMap.get(selectedCategory) || categoryLookupMap.get(selectedCategory.toLowerCase());
      if (catNode && catNode.parentId) {
        let curr = catNode;
        while (curr.parentId) {
          const parent = categoryLookupMap.get(curr.parentId);
          if (parent) {
            setExpandedDepts((prev) => new Set([...prev, parent.id]));
            curr = parent;
          } else {
            break;
          }
        }
      }
    }
  }, [selectedDepartment, selectedCategory, categoryLookupMap]);

  const toggleDeptExpanded = (deptId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  // Extract all unique brands with item count
  const allBrands = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    products.forEach((p) => {
      const b = (p.brand || '').trim();
      if (b) {
        brandCounts[b] = (brandCounts[b] || 0) + 1;
      }
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
    setPriceRange([minCatalogPrice, maxCatalogPrice]);
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
    if (priceRange[0] > minCatalogPrice || priceRange[1] < maxCatalogPrice) count++;
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
    minCatalogPrice,
    maxCatalogPrice,
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
      if (selectedCategory !== 'all') {
        const catNode = categoryLookupMap.get(selectedCategory) || categoryLookupMap.get(selectedCategory.toLowerCase());
        if (catNode) {
          const match =
            (item.categoryId && catNode.matchKeys.has(item.categoryId)) ||
            (item.categorySlug && catNode.matchKeys.has(item.categorySlug.toLowerCase())) ||
            (item.category && catNode.matchKeys.has(item.category.toLowerCase())) ||
            (item.departmentId && catNode.matchKeys.has(item.departmentId)) ||
            (item.departmentSlug && catNode.matchKeys.has(item.departmentSlug.toLowerCase())) ||
            (item.department && catNode.matchKeys.has(item.department.toLowerCase()));
          if (!match) return false;
        } else {
          const q = selectedCategory.toLowerCase();
          const match =
            item.category.toLowerCase() === q ||
            item.categoryId === selectedCategory ||
            item.categorySlug?.toLowerCase() === q ||
            (item.department && item.department.toLowerCase() === q);
          if (!match) return false;
        }
      }

      // 3. Department Filter
      if (selectedDepartment !== 'all') {
        const deptNode = categoryLookupMap.get(selectedDepartment) || categoryLookupMap.get(selectedDepartment.toLowerCase());
        if (deptNode) {
          const match =
            (item.departmentId && deptNode.matchKeys.has(item.departmentId)) ||
            (item.departmentSlug && deptNode.matchKeys.has(item.departmentSlug.toLowerCase())) ||
            (item.department && deptNode.matchKeys.has(item.department.toLowerCase())) ||
            (item.categoryId && deptNode.matchKeys.has(item.categoryId)) ||
            (item.categorySlug && deptNode.matchKeys.has(item.categorySlug.toLowerCase())) ||
            (item.category && deptNode.matchKeys.has(item.category.toLowerCase()));
          if (!match) return false;
        } else {
          const q = selectedDepartment.toLowerCase();
          const match =
            (item.department && item.department.toLowerCase() === q) ||
            item.departmentId === selectedDepartment ||
            item.departmentSlug?.toLowerCase() === q ||
            item.category.toLowerCase() === q;
          if (!match) return false;
        }
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
    categoryLookupMap,
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

  const scrollToGridTop = () => {
    const el = document.getElementById('shop-products-main-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

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
              {tPdp('home')}
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
              {tPdp('catalog')}
            </button>
            {selectedDepartment !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className="font-semibold text-slate-800 hover:text-[#00407a] transition-colors cursor-pointer"
                >
                  {currentDepartmentName || selectedDepartment}
                </button>
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
                    {currentCategoryName || currentDepartmentName || tPdp('catalog')}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {tShop('showingProducts', { count: sortedProducts.length })}
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
                <span>{tShop('filters')}</span>
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
                <span>{tShop('filters')}</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> {tShop('resetAll')}
                </button>
              )}
            </div>

            {/* 1. Quick Deals & Express Delivery Switches */}
            <div className="py-4 border-b border-slate-100 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                {tShop('specialOffers')}
              </div>
              <label className="flex items-center justify-between cursor-pointer group select-none">
                <span className="text-xs text-slate-700 group-hover:text-slate-900 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {tShop('onSaleOnly')}
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
                  {tShop('expressOnly')}
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
                  {tShop('inStockOnly')}
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

            {/* 2. Department & Multi-Level Category Filter */}
            <div className="py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {tShop('categoriesDepts')}
                </div>
                {(selectedDepartment !== 'all' || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedDepartment('all');
                      setSelectedCategory('all');
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-[#00407a] hover:underline font-bold cursor-pointer"
                  >
                    {tShop('resetAll')}
                  </button>
                )}
              </div>

              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {/* All Departments Option */}
                <button
                  onClick={() => {
                    setSelectedDepartment('all');
                    setSelectedCategory('all');
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedDepartment === 'all' && selectedCategory === 'all'
                      ? 'bg-blue-50 text-[#00407a] font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tShop('allDepartments')}</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                    {products.length}
                  </span>
                </button>

                {/* Root Departments */}
                {departmentTree.map((dept) => {
                  const isDeptSelected =
                    selectedDepartment === dept.id ||
                    selectedDepartment === dept.name ||
                    selectedDepartment === dept.slug;
                  const isExpanded = expandedDepts.has(dept.id) || isDeptSelected;
                  const hasChildren = dept.children && dept.children.length > 0;

                  return (
                    <div key={dept.id} className="space-y-0.5">
                      {/* Department Row */}
                      <div
                        className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isDeptSelected && selectedCategory === 'all'
                            ? 'bg-blue-50 text-[#00407a] font-bold border border-blue-200'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (isDeptSelected && selectedCategory === 'all') {
                              setSelectedDepartment('all');
                            } else {
                              setSelectedDepartment(dept.id);
                              setSelectedCategory('all');
                              setExpandedDepts((prev) => new Set([...prev, dept.id]));
                            }
                            setCurrentPage(1);
                          }}
                          className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                        >
                          <span className="truncate">{dept.name}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100">
                            {dept.count}
                          </span>
                          {hasChildren && (
                            <button
                              onClick={(e) => toggleDeptExpanded(dept.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded cursor-pointer transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180 text-[#00407a]' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Level 2 Subcategories */}
                      {hasChildren && isExpanded && (
                        <div className="border-l-2 border-slate-200 ml-3.5 pl-2 my-1 space-y-1 animate-in slide-in-from-top-1 duration-150">
                          {dept.children.map((sub) => {
                            const isSubSelected =
                              selectedCategory === sub.id ||
                              selectedCategory === sub.name ||
                              selectedCategory === sub.slug;
                            const hasLevel3 = sub.children && sub.children.length > 0;

                            return (
                              <div key={sub.id} className="space-y-0.5">
                                <div
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                                    isSubSelected
                                      ? 'bg-blue-50 text-[#00407a] font-bold'
                                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      if (isSubSelected) {
                                        setSelectedCategory('all');
                                      } else {
                                        setSelectedCategory(sub.id);
                                        setSelectedDepartment(dept.id);
                                      }
                                      setCurrentPage(1);
                                    }}
                                    className="flex-1 text-left truncate cursor-pointer flex items-center gap-1.5"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="truncate">{sub.name}</span>
                                  </button>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {sub.count}
                                  </span>
                                </div>

                                {/* Level 3 Child Items */}
                                {hasLevel3 && (
                                  <div className="border-l border-slate-200 ml-3 pl-2 space-y-0.5 my-0.5">
                                    {sub.children.map((k3) => {
                                      const isK3Selected =
                                        selectedCategory === k3.id ||
                                        selectedCategory === k3.name ||
                                        selectedCategory === k3.slug;
                                      return (
                                        <button
                                          key={k3.id}
                                          onClick={() => {
                                            if (isK3Selected) {
                                              setSelectedCategory(sub.id);
                                            } else {
                                              setSelectedCategory(k3.id);
                                              setSelectedDepartment(dept.id);
                                            }
                                            setCurrentPage(1);
                                          }}
                                          className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
                                            isK3Selected
                                              ? 'bg-blue-100 text-[#00407a] font-bold'
                                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                          }`}
                                        >
                                          <span className="truncate">{k3.name}</span>
                                          <span className="text-[9px] text-slate-400 shrink-0">
                                            {k3.count}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Price Range Slider & Inputs */}
            <div className="py-4 border-b border-slate-100">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                {tShop('priceRange')}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold">{tShop('minPrice')}</div>
                  <input
                    type="number"
                    min={minCatalogPrice}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Math.max(minCatalogPrice, Number(e.target.value) || minCatalogPrice);
                      setPriceRange([val, priceRange[1]]);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <div className="text-[10px] text-slate-400 font-semibold">{tShop('maxPrice')}</div>
                  <input
                    type="number"
                    min={priceRange[0]}
                    max={maxCatalogPrice}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.min(maxCatalogPrice, Number(e.target.value) || maxCatalogPrice);
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
                min={minCatalogPrice}
                max={maxCatalogPrice}
                step={Math.max(1, Math.round((maxCatalogPrice - minCatalogPrice) / 100))}
                value={priceRange[1]}
                onChange={(e) => {
                  setPriceRange([priceRange[0], Number(e.target.value)]);
                  setCurrentPage(1);
                }}
                className="w-full accent-[#00407a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>{formatPrice(minCatalogPrice)}</span>
                <span>{formatPrice(maxCatalogPrice)}</span>
              </div>
            </div>

            {/* 4. Brand Multi-Select */}
            {allBrands.length > 0 && (
              <div className="py-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  {tShop('brands')} ({allBrands.length})
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {allBrands.map(({ brand, count }) => {
                    const isChecked = selectedBrands.includes(brand);
                    return (
                      <label
                        key={brand}
                        className="flex items-center justify-between text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleBrandToggle(brand)}
                            className="w-3.5 h-3.5 accent-[#00407a] rounded cursor-pointer"
                          />
                          <span className={`truncate ${isChecked ? 'font-bold text-[#00407a]' : 'font-medium'}`}>
                            {brand}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{count}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. Customer Rating Filter */}
            <div className="pt-4">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                {tShop('rating')}
              </div>
              <div className="space-y-1.5">
                {[
                  { stars: 4.8, label: tShop('ratingAndUp', { stars: '4.8' }) },
                  { stars: 4.5, label: tShop('ratingAndUp', { stars: '4.5' }) },
                  { stars: 4.0, label: tShop('ratingAndUp', { stars: '4.0' }) },
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
          <div id="shop-products-main-grid" className="flex-1 min-w-0">
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
                    placeholder={tShop('searchInFiltered')}
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
                    <span className="text-slate-500 font-medium hidden sm:inline">{tShop('sortBy')}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#00407a] cursor-pointer"
                    >
                      <option value="popular">{tShop('sortPopular')}</option>
                      <option value="price-asc">{tShop('sortPriceAsc')}</option>
                      <option value="price-desc">{tShop('sortPriceDesc')}</option>
                      <option value="rating">{tShop('sortRating')}</option>
                      <option value="discount">{tShop('sortDiscount')}</option>
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
                      title={tShop('gridView')}
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
                      title={tShop('listView')}
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">{tShop('activeFilters')}</span>

                  {selectedDepartment !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00407a] border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {currentDepartmentName || selectedDepartment}
                      <button onClick={() => setSelectedDepartment('all')} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00407a] border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {currentCategoryName}
                      <button onClick={() => setSelectedCategory('all')} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedBrands.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {b}
                      <button onClick={() => handleBrandToggle(b)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {(priceRange[0] > minCatalogPrice || priceRange[1] < maxCatalogPrice) && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                      <button onClick={() => setPriceRange([minCatalogPrice, maxCatalogPrice])} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {onSaleOnly && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {tShop('onSaleOnly')}
                      <button onClick={() => setOnSaleOnly(false)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {expressOnly && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {tShop('express60min')}
                      <button onClick={() => setExpressOnly(false)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {minRating > 0 && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {tShop('ratingAndUp', { stars: String(minRating) })}
                      <button onClick={() => setMinRating(0)} className="cursor-pointer hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold underline ml-1 cursor-pointer"
                  >
                    {tShop('clearAll')}
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
                  {tShop('noProducts')}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  {tShop('noProductsSub')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-[#00407a] hover:bg-[#003366] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> {tShop('resetAll')}
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
                              {tBadge(product.tagBadge.text, product.tagBadge.type)}
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
                              <Zap className="w-2.5 h-2.5 fill-emerald-600" /> {tBadge('EXPRESS')}
                            </span>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="mt-auto pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2">
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.oldPrice && (
                              <span className="text-xs text-slate-400 line-through font-semibold">
                                {formatPrice(product.oldPrice)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product, 1);
                            }}
                            className="w-full bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{tShop('addToCart')}</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(product.id, qty - 1);
                              }}
                              className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-900 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-[#00407a] px-2">
                              {tShop('inCart', { count: qty })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateQuantity(product.id, qty + 1);
                              }}
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
                        {product.tagBadge && (
                          <span className="absolute top-2 right-2 bg-[#00407a] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs z-10">
                            {tBadge(product.tagBadge.text, product.tagBadge.type)}
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
                              {tBadge('EXPRESS')}
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
                            {tShop('customerReviews', { count: product.reviewsCount })}
                          </span>
                          {product.stockLeft && product.stockLeft < 15 && (
                            <span className="text-amber-700 text-[11px] font-semibold">
                              {tShop('onlyUnitsLeft', { count: product.stockLeft })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price & Action button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <div className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                            {formatPrice(product.price)}
                          </div>
                          {product.oldPrice && (
                            <div className="text-xs text-slate-400 line-through font-semibold">
                              {formatPrice(product.oldPrice)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(product);
                            }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(product, 1);
                              }}
                              className="bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                            >
                              {tShop('addToCart')}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, qty - 1);
                                }}
                                className="w-7 h-7 bg-white text-slate-900 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-[#00407a] px-1">
                                {qty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(product.id, qty + 1);
                                }}
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
                  {tShop('showingItems', {
                    start: (currentPage - 1) * itemsPerPage + 1,
                    end: Math.min(currentPage * itemsPerPage, sortedProducts.length),
                    total: sortedProducts.length,
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      scrollToGridTop();
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    {tShop('previous')}
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((pg, index) => (
                      <button
                        key={index}
                        disabled={pg === '...'}
                        onClick={() => {
                          if (typeof pg === 'number') {
                            setCurrentPage(pg);
                            scrollToGridTop();
                          }
                        }}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-colors ${
                          pg === '...'
                            ? 'cursor-default text-slate-400 bg-transparent'
                            : currentPage === pg
                              ? 'bg-[#00407a] text-white shadow-xs cursor-pointer'
                              : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
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
                      scrollToGridTop();
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    {tShop('next')}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{tShop('perPage')}</span>
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
                <span>{tShop('filters')} ({activeFiltersCount})</span>
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
                <div className="text-xs font-bold text-slate-900 uppercase">{tShop('perksAndStock')}</div>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>{tShop('onSaleOnly')}</span>
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={(e) => setOnSaleOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00407a]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>{tShop('expressOnly')}</span>
                  <input
                    type="checkbox"
                    checked={expressOnly}
                    onChange={(e) => setExpressOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#00407a]"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span>{tShop('inStockOnly')}</span>
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
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">{tShop('categoriesDepts')}</div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedCategory('all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">{tShop('allDepartments')}</option>
                  {departmentTree.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Categories */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">{tShop('allCategories')}</div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">{tShop('allCategories')}</option>
                  {currentDepartmentNode ? (
                    currentDepartmentNode.children.map((sub) => (
                      <optgroup key={sub.id} label={`${sub.name} (${sub.count})`}>
                        <option value={sub.id}>{sub.name} ({sub.count})</option>
                        {sub.children.map((k3) => (
                          <option key={k3.id} value={k3.id}>
                            &nbsp;&nbsp;↳ {k3.name} ({k3.count})
                          </option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    departmentTree.map((dept) => (
                      <optgroup key={dept.id} label={`${dept.name} (${dept.count})`}>
                        {dept.children.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.count})
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              {/* Price range */}
              <div className="pb-4 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">
                  {tShop('maxPriceLabel', { price: formatPrice(priceRange[1]) })}
                </div>
                <input
                  type="range"
                  min={minCatalogPrice}
                  max={maxCatalogPrice}
                  step={Math.max(1, Math.round((maxCatalogPrice - minCatalogPrice) / 100))}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full accent-[#00407a]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>{formatPrice(minCatalogPrice)}</span>
                  <span>{formatPrice(maxCatalogPrice)}</span>
                </div>
              </div>

              {/* Brands */}
              <div>
                <div className="text-xs font-bold text-slate-900 uppercase mb-2">{tShop('brands')}</div>
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
                {tShop('resetAll')}
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#00407a] text-white rounded-xl text-xs font-bold hover:bg-[#003366]"
              >
                {tShop('apply', { count: sortedProducts.length })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
