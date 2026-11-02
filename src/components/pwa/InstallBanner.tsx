import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detecta se já está rodando instalado como App (Standalone)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInStandaloneMode);
    if (isInStandaloneMode) return;

    // Detecta se é iOS / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // No iOS, se não estiver instalado, mostra o banner de orientação
    if (isIosDevice) {
      setShowBanner(true);
    }

    // No Android / Chrome / Edge, escuta o evento de instalação nativo
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

  if (!showBanner || isStandalone) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md relative z-40 animate-slide-up border-b border-amber-300/30">
      <div className="flex items-center space-x-2 flex-1 pr-2">
        <span className="text-xl">🥟</span>
        <div>
          <p className="font-bold leading-tight">Instale o App da Pastelaria</p>
          <p className="text-[11px] text-amber-100 font-medium">
            {isIOS ? (
              <span className="flex items-center gap-1 mt-0.5">
                Toque em <Share className="w-3.5 h-3.5 inline mx-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong>
              </span>
            ) : (
              'Acesse direto da sua tela inicial, rápido e sem ocupar espaço!'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="bg-white text-red-700 font-black px-3 py-1.5 rounded-xl text-xs hover:bg-amber-50 active:scale-95 transition-all flex items-center space-x-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Instalar</span>
          </button>
        )}
        <button
          onClick={() => setShowBanner(false)}
          className="text-white/80 hover:text-white p-1 rounded-lg"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
