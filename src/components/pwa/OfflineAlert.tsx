import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { WifiOff } from 'lucide-react';

export const OfflineAlert: React.FC = () => {
  const { isOnline } = useStore();

  if (isOnline) return null;

  return (
    <div className="bg-amber-800 text-amber-100 text-xs py-2 px-4 flex items-center justify-center space-x-2 border-b border-amber-900 shadow-sm animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-300" />
      <span>
        Você está offline. O cardápio continua acessível, mas você precisará de internet para finalizar o pedido.
      </span>
    </div>
  );
};
