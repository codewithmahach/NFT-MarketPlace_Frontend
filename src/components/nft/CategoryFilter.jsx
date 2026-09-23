import React from 'react';
import { CATEGORIES } from '../../config/constants';
import { 
  Sparkles, 
  Car, 
  Clock, 
  Flame, 
  Palette, 
  Briefcase, 
  Footprints, 
  Gem, 
  Boxes, 
  MoreHorizontal 
} from 'lucide-react';

const categoryIcons = {
  All: Sparkles,
  Cars: Car,
  Watches: Clock,
  Perfumes: Flame,
  Art: Palette,
  Handbags: Briefcase,
  Shoes: Footprints,
  Jewelry: Gem,
  Collectibles: Boxes,
  Other: MoreHorizontal
};

const CategoryFilter = ({ selectedCategory, onSelectCategory, counts = {} }) => {
  return (
    <div className="w-full overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
      <div className="flex items-center space-x-2 min-w-max">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const Icon = categoryIcons[cat] || Sparkles;
          const count = counts[cat];

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200 border-transparent scale-105'
                  : 'bg-white/80 text-slate-600 hover:bg-pink-50 hover:text-pink-600 border-pink-100/80 hover:border-pink-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat}</span>
              {count !== undefined && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
