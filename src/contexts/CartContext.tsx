import React, { createContext, useContext, useState, useEffect } from 'react';
import { ItemCarrinho, Produto, Opcional } from '../@types/database';

interface CartContextType {
  items: ItemCarrinho[];
  addItem: (produto: Produto, quantidade: number, opcionais: Opcional[], observacao: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, novaQuantidade: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'pastelaria_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ItemCarrinho[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Erro ao sincronizar carrinho:', err);
    }
  }, [items]);

  const addItem = (
    produto: Produto,
    quantidade: number,
    opcionais: Opcional[],
    observacao: string
  ) => {
    const sortedOpcionais = [...opcionais].sort((a, b) => a.id.localeCompare(b.id));
    const opcionaisSum = sortedOpcionais.reduce((acc, o) => acc + Number(o.preco_adicional), 0);
    const precoUnitario = Number(produto.preco) + opcionaisSum;

    // Gera uma chave única baseada no produto, nos opcionais e na observação
    const opcKey = sortedOpcionais.map((o) => o.id).join(',');
    const itemKey = `${produto.id}_${opcKey}_${observacao.trim().toLowerCase()}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === itemKey);
      if (existingIndex > -1) {
        const copy = [...prev];
        const newQty = copy[existingIndex].quantidade + quantidade;
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantidade: newQty,
          precoTotal: precoUnitario * newQty,
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: itemKey,
          produto,
          quantidade,
          opcionais: sortedOpcionais,
          observacao,
          precoUnitario,
          precoTotal: precoUnitario * quantidade,
        },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantidade: novaQuantidade,
            precoTotal: item.precoUnitario * novaQuantidade,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((acc, item) => acc + item.precoTotal, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider');
  }
  return context;
}
