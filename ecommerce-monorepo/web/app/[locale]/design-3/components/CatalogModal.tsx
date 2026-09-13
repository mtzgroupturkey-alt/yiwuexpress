import React, { useState, useEffect } from 'react';
import { X, LayoutGrid, ChevronRight, Zap, ArrowRight } from 'lucide-react';
import { DEPARTMENTS } from '../data/catalogData';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDepartment: (deptName: string, subcategory?: string) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectDepartment,
}) => {
  const [activeDeptId, setActiveDeptId] = useState(DEPARTMENTS[0].id);

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

  const currentDept = DEPARTMENTS.find((d) => d.id === activeDeptId) || DEPARTMENTS[0];

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
                  Hypermarket Catalog
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                  28 Departments
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Over 250,000 SKUs with express 60-min delivery & verified quality
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

        {/* 2-Column Mega Navigation */}
        <div className="flex-1 flex overflow-hidden min-h-[420px]">
          {/* Left: Department List with Hover & Click */}
          <div className="w-64 sm:w-72 bg-slate-50 border-r border-slate-200 overflow-y-auto py-2 shrink-0">
            {DEPARTMENTS.map((dept) => {
              const isSelected = dept.id === activeDeptId;
              return (
                <button
                  key={dept.id}
                  onClick={() => setActiveDeptId(dept.id)}
                  onMouseEnter={() => setActiveDeptId(dept.id)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#00407a] border-l-4 border-[#00407a] shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#00407a]'
                  }`}
                >
                  <span className="truncate">{dept.name}</span>
                  <span className={`text-[10px] ml-2 shrink-0 px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-blue-100 text-[#00407a] font-bold' : 'text-slate-400 font-normal'
                  }`}>
                    {dept.itemCount.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Subcategories & Highlights */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-xl font-black text-slate-900">
                    {currentDept.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Browse verified items in this department
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectDepartment(currentDept.name);
                    onClose();
                  }}
                  className="bg-slate-100 hover:bg-[#00407a] text-slate-800 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Open all {currentDept.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {currentDept.subcategories.map((sub, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectDepartment(currentDept.name, sub);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#00407a] hover:bg-blue-50/60 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#00407a] transition-colors">
                        {sub}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Express 60 min courier available
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00407a] transition-colors shrink-0" />
                  </button>
                ))}
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
                    Flash Mega Deals in {currentDept.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Discounts up to -45% on imported and domestic selections
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
                Browse All in {currentDept.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
