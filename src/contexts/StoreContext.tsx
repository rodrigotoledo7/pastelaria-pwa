import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Categoria, Produto, Opcional, FaixaEntrega, ConfiguracoesLoja } from '../@types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockStore } from '../lib/mockStore';

interface StoreContextType {
  config: ConfiguracoesLoja;
  categorias: Categoria[];
  produtos: Produto[];
  opcionais: Opcional[];
  faixasEntrega: FaixaEntrega[];
  loading: boolean;
  isOnline: boolean;
  refreshStore: () => Promise<void>;
  updateConfig: (updates: Partial<ConfiguracoesLoja>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracoesLoja>(() => mockStore.getConfig());
  const [categorias, setCategorias] = useState<Categoria[]>(() => mockStore.getCategorias());
  const [produtos, setProdutos] = useState<Produto[]>(() => mockStore.getProdutos());
  const [opcionais, setOpcionais] = useState<Opcional[]>(() => mockStore.getOpcionais());
  const [faixasEntrega, setFaixasEntrega] = useState<FaixaEntrega[]>(() => mockStore.getFaixas());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Busca do Supabase
        const [configRes, catRes, prodRes, opcRes, faixasRes] = await Promise.all([
          supabase.from('configuracoes').select('*').eq('id', 1).single(),
          supabase.from('categorias').select('*').eq('ativo', true).order('ordem', { ascending: true }),
          supabase.from('produtos').select('*').eq('disponivel', true).order('ordem', { ascending: true }),
          supabase.from('opcionais').select('*').eq('disponivel', true),
          supabase.from('faixas_entrega').select('*').eq('ativo', true).order('km_ate', { ascending: true }),
        ]);

        if (configRes.data) setConfig(configRes.data);
        if (catRes.data) setCategorias(catRes.data);
        if (prodRes.data) setProdutos(prodRes.data);
        if (opcRes.data) setOpcionais(opcRes.data);
        if (faixasRes.data) setFaixasEntrega(faixasRes.data);
      } else {
        // Fallback MockStore
        setConfig(mockStore.getConfig());
        setCategorias(mockStore.getCategorias());
        setProdutos(mockStore.getProdutos());
        setOpcionais(mockStore.getOpcionais());
        setFaixasEntrega(mockStore.getFaixas());
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase, utilizando fallback local:', err);
      setConfig(mockStore.getConfig());
      setCategorias(mockStore.getCategorias());
      setProdutos(mockStore.getProdutos());
      setOpcionais(mockStore.getOpcionais());
      setFaixasEntrega(mockStore.getFaixas());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Eventos customizados locais para atualização imediata
    const handleMenuChanged = () => loadData();
    window.addEventListener('pastelaria_menu_changed', handleMenuChanged);
    window.addEventListener('pastelaria_config_changed', handleMenuChanged);
    window.addEventListener('pastelaria_faixas_changed', handleMenuChanged);

    return () => {
      window.removeEventListener('pastelaria_menu_changed', handleMenuChanged);
      window.removeEventListener('pastelaria_config_changed', handleMenuChanged);
      window.removeEventListener('pastelaria_faixas_changed', handleMenuChanged);
    };
  }, [loadData]);

  const updateConfig = async (updates: Partial<ConfiguracoesLoja>) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('configuracoes')
        .update(updates)
        .eq('id', 1)
        .select()
        .single();
      if (!error && data) {
        setConfig(data);
      }
    } else {
      const updated = mockStore.updateConfig(updates);
      setConfig(updated);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        config,
        categorias,
        produtos,
        opcionais,
        faixasEntrega,
        loading,
        isOnline,
        refreshStore: loadData,
        updateConfig,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore deve ser utilizado dentro de um StoreProvider');
  }
  return context;
}
