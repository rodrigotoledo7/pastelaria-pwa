import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
      <div className="flex items-center space-x-2">
        <span className="text-base">🥟</span>
        <span className="font-semibold">
          Instale nosso app na sua tela inicial para pedir mais rápido!
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleInstall}
          className="bg-white text-red-700 font-bold px-3 py-1 rounded-lg text-xs hover:bg-amber-50 active:scale-95 transition-all flex items-center space-x-1 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="text-white/80 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
