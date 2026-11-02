import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { formatBRL } from '../../lib/formatters';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartBarProps {
  onOpenCart: () => void;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ onOpenCart }) => {
  const { totalQuantity, subtotal } = useCart();

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pointer-events-none animate-slide-up">
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 hover:from-amber-600 hover:to-red-700 text-white p-3.5 rounded-2xl shadow-floating flex items-center justify-between border-2 border-amber-300/40 active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {totalQuantity}
              </span>
            </div>

            <div className="text-left">
              <p className="text-[11px] text-amber-100 font-medium leading-none">
                Subtotal
              </p>
              <p className="text-base font-black text-white leading-tight mt-0.5">
                {formatBRL(subtotal)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3.5 py-2 rounded-xl text-xs font-black transition-all">
            <span>Ver Pedido</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
};
