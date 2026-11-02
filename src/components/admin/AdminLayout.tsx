import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStore } from '../../contexts/StoreContext';
import { useSoundNotification } from '../../hooks/useSoundNotification';
import {
  Bell,
  UtensilsCrossed,
  Settings,
  BarChart3,
  LogOut,
  Volume2,
  ExternalLink,
  Power,
} from 'lucide-react';

export type AdminTab = 'orders' | 'menu' | 'settings' | 'history';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onGoToClientMenu: () => void;
  newOrdersCount: number;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onGoToClientMenu,
  newOrdersCount,
  children,
}) => {
  const { logout } = useAuth();
  const { config, updateConfig } = useStore();
  const { playNewOrderSound } = useSoundNotification();

  const handleToggleStoreOpen = () => {
    updateConfig({ loja_aberta: !config.loja_aberta });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🥟</span>
            <div>
              <h1 className="text-sm sm:text-base font-black text-gray-900 leading-none">
                {config.nome_loja}
              </h1>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                Painel de Controle
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Toggle Aberto / Fechado */}
            <button
              onClick={handleToggleStoreOpen}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                config.loja_aberta
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
              title="Clique para abrir ou fechar a loja para pedidos"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{config.loja_aberta ? 'Loja Aberta' : 'Loja Fechada'}</span>
            </button>

            {/* Teste de Som */}
            <button
              onClick={playNewOrderSound}
              className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Testar som de notificação de pedidos"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Ver App Cliente */}
            <button
              onClick={onGoToClientMenu}
              className="hidden sm:flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Cardápio</span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="max-w-6xl mx-auto px-4 flex space-x-1 overflow-x-auto no-scrollbar">
          {[
            {
              id: 'orders',
              label: 'Pedidos em Tempo Real',
              icon: Bell,
              badge: newOrdersCount > 0 ? newOrdersCount : null,
            },
            { id: 'menu', label: 'Cardápio & Estoque', icon: UtensilsCrossed },
            { id: 'settings', label: 'Entrega & Configurações', icon: Settings },
            { id: 'history', label: 'Histórico & Relatórios', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as AdminTab)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-amber-500 text-amber-800 bg-amber-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Conteúdo da Aba */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
