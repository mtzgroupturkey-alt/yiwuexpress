import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, ChevronRight, ChevronLeft, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { DEPARTMENTS } from '../data/catalogData';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

export interface CatalogChildCategory {
  id: string;
  name: string;
  slug?: string;
  level?: number;
  children?: Array<{ id: string; name: string; slug?: string; level?: number }>;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug?: string;
  itemCount?: number;
  subcategories?: string[];
  children?: CatalogChildCategory[];
}

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (deptName: string, subcategory?: string) => void;
  categories?: CatalogCategory[];
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectDepartment,
  categories,
}) => {
  const { tModals } = useStorefrontTranslation();
  const departmentsList = (categories && categories.length > 0)
    ? categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        itemCount: c.itemCount || 10,
        subcategories: c.subcategories && c.subcategories.length > 0
          ? c.subcategories
          : ['All ' + c.name, 'Best Sellers', 'New Arrivals', 'Special Offers'],
        children: c.children,
      }))
    : DEPARTMENTS.map((d) => ({ ...d, children: undefined as CatalogChildCategory[] | undefined }));

  const [activeDeptId, setActiveDeptId] = useState(departmentsList[0]?.id || DEPARTMENTS[0].id);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Reset mobileView to 'list' whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMobileView('list');
    }
  }, [isOpen]);

  // Sync active dept when list updates
  useEffect(() => {
    if (departmentsList.length > 0 && !departmentsList.some((d) => d.id === activeDeptId)) {
      setActiveDeptId(departmentsList[0].id);
    }
  }, [departmentsList, activeDeptId]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDept = departmentsList.find((d) => d.id === activeDeptId) || departmentsList[0] || DEPARTMENTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 md:p-6 pt-12 md:pt-16">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Catalog Mega Window */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00407a] text-white flex items-center justify-center shadow-xs">
              <LayoutGrid className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {tModals('fullCatalog')}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {tModals('catalogSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close Catalog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Mega Navigation with Mobile Drill-Down */}
        <div className="flex-1 flex overflow-hidden min-h-[380px] sm:min-h-[420px]">
          {/* Left: Department List (visible on desktop or mobile when in 'list' view) */}
          <div className={`${mobileView === 'detail' ? 'hidden md:block' : 'w-full md:w-64 lg:w-72'} bg-slate-50 md:border-r border-slate-200 overflow-y-auto py-2 shrink-0`}>
            {/* View All Products Entry */}
            <button
              onClick={() => {
                onSelectDepartment('All Departments');
                onClose();
              }}
              className="w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer bg-amber-50/80 hover:bg-amber-100 text-amber-950 border-b border-amber-200/60 mb-1 active:scale-[0.99]"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{tModals('allProducts')}</span>
              </span>
              <span className="text-[10px] text-amber-700 font-semibold px-2 py-0.5 rounded bg-amber-200/70 shrink-0">
                &rarr;
              </span>
            </button>

            {departmentsList.map((dept) => {
              const isSelected = dept.id === activeDeptId;
              return (
                <button
                  key={dept.id}
                  onClick={() => {
                    setActiveDeptId(dept.id);
                    setMobileView('detail');
                  }}
                  onMouseEnter={() => setActiveDeptId(dept.id)}
                  className={`w-full px-4 py-3.5 md:py-3 text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer border-b md:border-b-0 border-slate-100 active:bg-slate-100 ${
                    isSelected
                      ? 'bg-white text-[#00407a] md:border-l-4 md:border-[#00407a] shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#00407a]'
                  }`}
                >
                  <span className="truncate text-sm md:text-xs">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] shrink-0 px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-blue-100 text-[#00407a] font-bold' : 'bg-slate-200/70 text-slate-500 font-medium'
                    }`}>
                      {dept.itemCount.toLocaleString()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 md:hidden shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Subcategories & Highlights (visible on desktop or mobile when in 'detail' view) */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 p-4 sm:p-6 overflow-y-auto bg-white flex-col justify-between`}>
            <div>
              {/* Mobile Back Button */}
              <div className="md:hidden pb-3 mb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#00407a] bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Categories</span>
                </button>
              </div>

              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">
                    {currentDept.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tModals('subcategories')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectDepartment(currentDept.name);
                    onClose();
                  }}
                  className="bg-slate-100 hover:bg-[#00407a] text-slate-800 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>{tModals('viewAllDeptGoods', { dept: currentDept.name })}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {currentDept.children && currentDept.children.length > 0 ? (
                  currentDept.children.map((child) => {
                    const hasL3 = child.children && child.children.length > 0;
                    return (
                      <div
                        key={child.id || child.slug || child.name}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-[#00407a] transition-all bg-white hover:bg-slate-50/50 shadow-2xs hover:shadow-xs flex flex-col justify-between group"
                      >
                        {/* Level 2 Department Row */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDepartment(child.name);
                              onClose();
                            }}
                            className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-600 group-hover:scale-125 transition-transform shrink-0" />
                            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00407a] transition-colors truncate">
                              {child.name}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDepartment(child.name);
                              onClose();
                            }}
                            className="text-slate-300 group-hover:text-[#00407a] p-0.5 cursor-pointer shrink-0 transition-colors"
                            title={`View all ${child.name}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Level 3 Children Tags (if any) */}
                        {hasL3 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {child.children!.map((sub) => (
                              <button
                                key={sub.id || sub.slug}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDepartment(sub.name);
                                  onClose();
                                }}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#00407a] hover:font-bold font-medium transition-colors cursor-pointer border border-slate-200/70 hover:border-blue-200 flex items-center gap-1"
                              >
                                <span className="w-1 h-1 rounded-full bg-slate-400" />
                                <span>{sub.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  currentDept.subcategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectDepartment(currentDept.name, sub);
                        onClose();
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-[#00407a] hover:bg-blue-50/60 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#00407a] transition-colors shrink-0" />
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#00407a] transition-colors">
                          {sub}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00407a] transition-colors shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Promo Ribbon inside Catalog */}
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00407a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {currentDept.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tModals('expressAvailable')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectDepartment(currentDept.name);
                  onClose();
                }}
                className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs active:scale-[0.98] text-center"
              >
                {tModals('viewAllDeptGoods', { dept: currentDept.name })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
