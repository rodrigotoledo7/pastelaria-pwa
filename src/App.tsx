import React, { useState, useEffect } from 'react';
import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MenuPage } from './pages/MenuPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppContent: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'client' | 'admin'>(() => {
    return window.location.pathname.startsWith('/admin') ? 'admin' : 'client';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(window.location.pathname.startsWith('/admin') ? 'admin' : 'client');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'client' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-500 flex flex-col items-center justify-center text-white">
        <span className="text-6xl animate-bounce mb-3">🥟</span>
        <p className="font-bold text-sm tracking-wide">Carregando Pastelaria...</p>
      </div>
    );
  }

  if (currentView === 'admin') {
    if (!isAdmin) {
      return <AdminLoginPage onBackToMenu={() => navigateTo('client')} />;
    }
    return <AdminDashboardPage onGoToClientMenu={() => navigateTo('client')} />;
  }

  return <MenuPage onOpenAdmin={() => navigateTo('admin')} />;
};

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CartProvider>
    </StoreProvider>
  );
}
