import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import { Clock, MapPin, Shield, Phone, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdmin }) => {
  const { config } = useStore();

  return (
    <header className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 text-white shadow-md overflow-hidden">
      {/* Detalhe de fundo decorativo */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 pt-5 pb-6 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center text-3xl transform -rotate-3 border-2 border-amber-300">
              🥟
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm text-white">
                  {config.nome_loja}
                </h1>
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse hidden sm:inline" />
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Massa artesanal frita na hora, sequinha e crocante!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdmin}
            className="flex items-center space-x-1 text-xs bg-black/20 hover:bg-black/30 text-amber-100 px-2.5 py-1.5 rounded-lg border border-white/20 transition-all backdrop-blur-sm active:scale-95"
            title="Acessar Painel do Proprietário"
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline font-semibold">Painel Admin</span>
          </button>
        </div>

        {/* Status de funcionamento e detalhes */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold shadow-sm ${
              config.loja_aberta
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300/40 animate-pulse'
                : 'bg-red-800 text-red-100 ring-2 ring-red-400/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white mr-1.5 inline-block" />
            {config.loja_aberta ? 'Aberto Agora' : 'Fechado no Momento'}
          </div>

          <div className="flex items-center text-amber-100/90 space-x-1 bg-black/15 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5 text-amber-200" />
            <span>{config.horario_funcionamento}</span>
          </div>

          <div className="flex items-center text-amber-100/90 space-x-1 bg-black/15 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-200" />
            <span className="truncate max-w-[200px]">{config.endereco_loja}</span>
          </div>

          {config.whatsapp_loja && (
            <div className="flex items-center text-amber-100/90 space-x-1 bg-black/15 px-2 py-0.5 rounded-md backdrop-blur-sm">
              <Phone className="w-3.5 h-3.5 text-amber-200" />
              <span>WhatsApp da Pastelaria</span>
            </div>
          )}
        </div>

        {!config.loja_aberta && (
          <div className="mt-3 bg-red-950/80 border border-red-500/50 text-red-200 text-xs p-2.5 rounded-xl flex items-center space-x-2">
            <span>ℹ️</span>
            <span>{config.mensagem_fechada}</span>
          </div>
        )}
      </div>
    </header>
  );
};
