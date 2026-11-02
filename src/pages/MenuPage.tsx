import React, { useState } from 'react';
import { useStore } from '../contexts/StoreContext';
import { Produto } from '../@types/database';
import { Header } from '../components/client/Header';
import { CategoryNav } from '../components/client/CategoryNav';
import { ProductCard } from '../components/client/ProductCard';
import { ProductModal } from '../components/client/ProductModal';
import { FloatingCartBar } from '../components/client/FloatingCartBar';
import { CartDrawer } from '../components/client/CartDrawer';
import { CheckoutModal } from '../components/client/CheckoutModal';
import { OrderConfirmationModal } from '../components/client/OrderConfirmationModal';
import { InstallBanner } from '../components/pwa/InstallBanner';
import { OfflineAlert } from '../components/pwa/OfflineAlert';
import { Search, Loader2 } from 'lucide-react';

interface MenuPageProps {
  onOpenAdmin: () => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ onOpenAdmin }) => {
  const { categorias, produtos, opcionais, loading } = useStore();

  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    numero: number;
    whatsappUrl: string;
    total: number;
    clienteNome: string;
  } | null>(null);

  // Inicializa categoria selecionada se ainda vazia
  const activeCatId = selectedCatId || (categorias[0]?.id ?? '');

  const filteredProdutos = produtos.filter((prod) => {
    const matchesSearch =
      !searchQuery ||
      prod.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.descricao && prod.descricao.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = searchQuery ? true : prod.categoria_id === activeCatId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-amber-50/30 flex flex-col pb-24">
      {/* Alerta Offline & Banner PWA */}
      <OfflineAlert />
      <InstallBanner />

      {/* Header com dados da Pastelaria */}
      <Header onOpenAdmin={onOpenAdmin} />

      {/* Barra de Busca rápida */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 w-full">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pastel de carne, queijo, refrigerante..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-amber-200/80 shadow-xs text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Navegação por Categorias (se não estiver buscando texto) */}
      {!searchQuery && categorias.length > 0 && (
        <CategoryNav
          categorias={categorias}
          selectedCategoryId={activeCatId}
          onSelectCategory={(id) => setSelectedCatId(id)}
        />
      )}

      {/* Lista de Produtos do Cardápio */}
      <main className="max-w-4xl mx-auto px-4 py-4 flex-1 w-full">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-amber-600">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs font-bold">Aquecendo o cardápio...</p>
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-amber-100 shadow-xs max-w-sm mx-auto my-8">
            <span className="text-4xl">🔍</span>
            <h3 className="font-bold text-gray-800 text-sm mt-3">
              Nenhum item encontrado
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tente buscar por outro termo ou escolha outra categoria acima.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProdutos.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de Personalização do Produto */}
      <ProductModal
        produto={selectedProduct}
        opcionaisDisponiveis={opcionais}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Barra Inferior Flutuante do Carrinho */}
      <FloatingCartBar onOpenCart={() => setIsCartOpen(true)} />

      {/* Gaveta do Carrinho */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Modal de Checkout / Endereço / Envio ao WhatsApp */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(orderData) => {
          setConfirmedOrder(orderData);
        }}
      />

      {/* Modal de Confirmação com Confetes e Reabrir WhatsApp */}
      <OrderConfirmationModal
        isOpen={Boolean(confirmedOrder)}
        orderData={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
      />
    </div>
  );
};
