import React from 'react';
import { Produto } from '../../@types/database';
import { formatBRL } from '../../lib/formatters';
import { Plus, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  produto: Produto;
  onSelect: (produto: Produto) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ produto, onSelect }) => {
  const isAvailable = produto.disponivel;

  return (
    <div
      onClick={() => isAvailable && onSelect(produto)}
      className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isAvailable
          ? 'border-amber-100 shadow-sm hover:shadow-md hover:border-amber-300 active:scale-[0.99] cursor-pointer'
          : 'border-gray-200 opacity-60 cursor-not-allowed bg-gray-50'
      }`}
    >
      <div className="flex p-3 sm:p-4 gap-3">
        {/* Imagem do Produto */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-amber-50 border border-amber-100/60">
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-amber-100 text-amber-500">
              🥟
            </div>
          )}

          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white text-[11px] font-bold p-1 text-center">
              <AlertCircle className="w-4 h-4 text-red-400 mb-0.5" />
              Esgotado
            </div>
          )}
        </div>

        {/* Informações de Texto */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
              {produto.nome}
            </h3>
            {produto.descricao && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {produto.descricao}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-50">
            <span className="text-base sm:text-lg font-black text-amber-600">
              {formatBRL(produto.preco)}
            </span>

            {isAvailable ? (
              <button
                type="button"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/30 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Adicionar</span>
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Indisponível
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
