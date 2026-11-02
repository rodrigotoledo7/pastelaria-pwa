import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout';
import { OrdersRealtimeTab } from '../components/admin/OrdersRealtimeTab';
import { MenuManagerTab } from '../components/admin/MenuManagerTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { HistoryTab } from '../components/admin/HistoryTab';
import { useStore } from '../contexts/StoreContext';
import { useSoundNotification } from '../hooks/useSoundNotification';
import { Pedido, StatusPedido } from '../@types/database';
import { mockStore } from '../lib/mockStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AdminDashboardPageProps {
  onGoToClientMenu: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onGoToClientMenu,
}) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('orders');
  const [pedidos, setPedidos] = useState<Pedido[]>(() => mockStore.getPedidos());
  const { categorias, produtos, opcionais, refreshStore } = useStore();
  const { playNewOrderSound } = useSoundNotification();

  const loadPedidos = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, itens:pedido_itens(*)')
        .order('criado_em', { ascending: false });

      if (!error && data) {
        setPedidos(data as Pedido[]);
      }
    } else {
      setPedidos(mockStore.getPedidos());
    }
  }, []);

  useEffect(() => {
    loadPedidos();

    // 1. Escuta Realtime do Supabase caso configurado
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('pedidos-realtime-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'pedidos' },
          (payload) => {
            console.log('Novo pedido via Supabase Realtime!', payload);
            playNewOrderSound();
            loadPedidos();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pedidos' },
          () => {
            loadPedidos();
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    } else {
      // 2. Escuta eventos Mock em desenvolvimento
      const handleMockNewOrder = () => {
        playNewOrderSound();
        loadPedidos();
      };

      const handleMockOrderUpdate = () => {
        loadPedidos();
      };

      window.addEventListener('pastelaria_new_order', handleMockNewOrder);
      window.addEventListener('pastelaria_order_status_updated', handleMockOrderUpdate);

      return () => {
        window.removeEventListener('pastelaria_new_order', handleMockNewOrder);
        window.removeEventListener('pastelaria_order_status_updated', handleMockOrderUpdate);
      };
    }
  }, [loadPedidos, playNewOrderSound]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: StatusPedido) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
    } else {
      mockStore.updateOrderStatus(pedidoId, novoStatus);
    }
    await loadPedidos();
  };

  const newOrdersCount = pedidos.filter((p) => p.status === 'novo').length;

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onGoToClientMenu={onGoToClientMenu}
      newOrdersCount={newOrdersCount}
    >
      {currentTab === 'orders' && (
        <OrdersRealtimeTab
          pedidos={pedidos}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {currentTab === 'menu' && (
        <MenuManagerTab
          categorias={categorias}
          produtos={produtos}
          opcionais={opcionais}
          onRefresh={refreshStore}
        />
      )}

      {currentTab === 'settings' && <SettingsTab />}

      {currentTab === 'history' && <HistoryTab pedidos={pedidos} />}
    </AdminLayout>
  );
};
