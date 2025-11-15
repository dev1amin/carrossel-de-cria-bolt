import React, { useState } from 'react';
import { Clock, Layers, ChevronDown } from 'lucide-react';

interface GalleryFiltersProps {
  onSortChange: (sort: 'recent' | 'template') => void;
  activeSort: 'recent' | 'template';
}

const GalleryFilters: React.FC<GalleryFiltersProps> = ({ onSortChange, activeSort }) => {
  const [isOpen, setIsOpen] = useState(false);

  const filters: { label: string; value: 'recent' | 'template'; icon: React.ElementType }[] = [
    { label: 'Mais recentes', value: 'recent', icon: Clock },
    { label: 'Por template', value: 'template', icon: Layers },
  ];

  const activeFilter = filters.find(f => f.value === activeSort);
  const ActiveIcon = activeFilter?.icon;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border-2 border-blue-500 rounded-lg px-4 py-2.5 font-medium text-gray-800 cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[180px]"
      >
        {ActiveIcon && <ActiveIcon className="w-5 h-5 text-blue-500" />}
        <span className="flex-1 text-left">{activeFilter?.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full bg-white border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden z-[61]">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = filter.value === activeSort;
              return (
                <button
                  key={filter.value}
                  onClick={() => {
                    onSortChange(filter.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-blue-50 text-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                  <span className="font-medium">{filter.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default GalleryFilters;
