import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { formatBRL, formatOrderNumber } from '../../lib/formatters';
import { CheckCircle2, MessageCircle, Home } from 'lucide-react';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  orderData: {
    numero: number;
    whatsappUrl: string;
    total: number;
    clienteNome: string;
  } | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  orderData,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Dispara confetes comemorativos
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#dc2626', '#10b981', '#fbbf24'],
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center animate-slide-up border border-amber-100">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs tracking-wider mb-2">
          PEDIDO REGISTRADO COM SUCESSO!
        </span>

        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {formatOrderNumber(orderData.numero)}
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Obrigado, <strong className="text-gray-800">{orderData.clienteNome}</strong>! Seu pedido já foi registrado no nosso sistema.
        </p>

        <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-2xl my-4 text-xs space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Valor Total</span>
            <span className="font-bold text-gray-900">{formatBRL(orderData.total)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Canal de Atendimento</span>
            <span className="font-bold text-emerald-700">WhatsApp da Loja</span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          Se o aplicativo do WhatsApp não abriu automaticamente, toque no botão verde abaixo para enviar sua mensagem:
        </p>

        <div className="space-y-2">
          <a
            href={orderData.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Reabrir WhatsApp</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Voltar ao Cardápio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
