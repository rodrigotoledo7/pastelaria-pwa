import React from 'react';
import { Categoria } from '../../@types/database';

interface CategoryNavProps {
  categorias: Categoria[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categorias,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm py-2.5 px-4 overflow-x-auto no-scrollbar">
      <div className="max-w-4xl mx-auto flex items-center space-x-2">
        {categorias.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all transform active:scale-95 ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                  : 'bg-amber-50/80 text-amber-900 hover:bg-amber-100/80 border border-amber-200/50'
              }`}
            >
              {cat.nome}
            </button>
          );
        })}
      </div>
    </div>
  );
};
