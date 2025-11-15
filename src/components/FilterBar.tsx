import React from 'react';
import { TrendingUp, Clock, Heart, MessageCircle, Share2 } from 'lucide-react';
import { SortOption } from '../types';

interface FilterBarProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeSort, onSortChange }) => {
  const filters: { label: string; value: SortOption; icon: React.ElementType }[] = [
    { label: 'Popular', value: 'popular', icon: TrendingUp },
    { label: 'Latest', value: 'latest', icon: Clock },
    { label: 'Likes', value: 'likes', icon: Heart },
    { label: 'Comments', value: 'comments', icon: MessageCircle },
    { label: 'Shares', value: 'shares', icon: Share2 },
  ];

  return (
    <div className="relative inline-block">
      <select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 font-medium text-gray-800 cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      >
        {filters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
        {filters.find(f => f.value === activeSort)?.icon &&
          React.createElement(filters.find(f => f.value === activeSort)!.icon, { className: "w-4 h-4" })
        }
      </div>
    </div>
  );
};

export default FilterBar;