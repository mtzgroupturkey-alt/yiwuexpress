'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface CategoryTabSliderProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  layoutId?: string;
}

export const CategoryTabSlider: React.FC<CategoryTabSliderProps> = ({
  tabs,
  activeTab,
  onChange,
  layoutId = 'activeCategoryPill',
}) => {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto no-scrollbar border border-slate-200/70">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer z-10 flex items-center gap-1.5 ${
              isActive ? 'text-[#00407a]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {/* Sliding active pill indicator */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/80 -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-blue-50 text-[#00407a] font-black' : 'bg-slate-200/60 text-slate-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
