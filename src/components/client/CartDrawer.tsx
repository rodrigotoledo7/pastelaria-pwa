import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { formatBRL } from '../../lib/formatters';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalQuantity } = useCart();
  const { config } = useStore();

  if (!isOpen) return null;

  const isBelowMinimum = config.valor_minimo > 0 && subtotal < config.valor_minimo;
  const missingForMinimum = config.valor_minimo - subtotal;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Seu Carrinho</h2>
              <p className="text-xs text-gray-500">
                {totalQuantity} {totalQuantity === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                title="Esvaziar carrinho"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <span className="text-5xl mb-3">🥟</span>
              <p className="font-bold text-gray-700 text-base">Seu carrinho está vazio</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                Adicione pastéis crocantes e bebidas refrescantes ao seu pedido!
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-sm text-gray-900">
                      {item.produto.nome}
                    </h4>

                    {/* Opcionais */}
                    {item.opcionais.length > 0 && (
                      <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                        + {item.opcionais.map((o) => o.nome).join(', ')}
                      </p>
                    )}

                    {/* Observação */}
                    {item.observacao && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                        "{item.observacao}"
                      </p>
                    )}

                    <span className="text-xs font-black text-amber-700 block mt-1">
                      {formatBRL(item.precoTotal)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                        className="w-7 h-7 rounded bg-white shadow-xs flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                      >
                        {item.quantidade === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-gray-900">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        className="w-7 h-7 rounded bg-white shadow-xs flex items-center justify-center text-gray-600 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Subtotal e Checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
            {isBelowMinimum && (
              <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pedido mínimo: {formatBRL(config.valor_minimo)}</p>
                  <p className="text-[11px] text-amber-800">
                    Falta {formatBRL(missingForMinimum)} em itens para atingir o valor mínimo.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="font-black text-gray-900 text-base">
                {formatBRL(subtotal)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              disabled={isBelowMinimum || !config.loja_aberta}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
            >
              <span>Avançar para Entrega e Pagamento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
