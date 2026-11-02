import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { DeliveryAddressForm } from './DeliveryAddressForm';
import { formatBRL, formatPhoneNumber } from '../../lib/formatters';
import { buildWhatsAppMessage, getWhatsAppOrderUrl } from '../../lib/whatsapp';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { mockStore } from '../../lib/mockStore';
import { X, ArrowRight, Wallet, User, Phone, Loader2, AlertCircle } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderData: {
    numero: number;
    whatsappUrl: string;
    total: number;
    clienteNome: string;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, subtotal, clearCart } = useCart();
  const { config } = useStore();

  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [tipo, setTipo] = useState<'retirada' | 'entrega'>('entrega');
  const [endereco, setEndereco] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [taxaEntrega, setTaxaEntrega] = useState<number>(0);
  const [isDeliverable, setIsDeliverable] = useState(true);

  const [formaPagamento, setFormaPagamento] = useState<string>('pix');
  const [trocoPara, setTrocoPara] = useState<string>('');
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalGeral = subtotal + (tipo === 'entrega' ? taxaEntrega : 0);

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    setClienteTelefone(formatPhoneNumber(raw));
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!clienteNome.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }

    const cleanPhone = clienteTelefone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor, informe um telefone com DDD válido.');
      return;
    }

    if (tipo === 'entrega') {
      if (!endereco.trim()) {
        setErrorMessage('Por favor, informe o endereço completo de entrega.');
        return;
      }
      if (!isDeliverable) {
        setErrorMessage('Endereço fora da área de entrega. Por favor, escolha a opção Retirada no balcão.');
        return;
      }
    }

    if (formaPagamento === 'dinheiro' && trocoPara) {
      const trocoNum = parseFloat(trocoPara.replace(',', '.'));
      if (trocoNum < totalGeral) {
        setErrorMessage(`O valor para troco deve ser maior que o total do pedido (${formatBRL(totalGeral)}).`);
        return;
      }
    }

    setLoading(true);

    try {
      let numeroPedido = 1;
      const trocoNum = trocoPara ? parseFloat(trocoPara.replace(',', '.')) : null;

      if (isSupabaseConfigured && supabase) {
        // Chamada via RPC segura do Supabase
        const payloadItens = items.map((it) => ({
          produto_id: it.produto.id,
          quantidade: it.quantidade,
          opcionais: it.opcionais.map((o) => ({ id: o.id })),
          observacao: it.observacao,
        }));

        const { data: rpcRes, error: rpcErr } = await supabase.rpc('criar_pedido_completo', {
          p_cliente_nome: clienteNome.trim(),
          p_cliente_telefone: cleanPhone,
          p_tipo: tipo,
          p_endereco: tipo === 'entrega' ? endereco.trim() : null,
          p_lat: lat,
          p_lng: lng,
          p_distancia_km: distanciaKm,
          p_forma_pagamento: formaPagamento,
          p_troco_para: trocoNum,
          p_observacoes: observacoesGerais.trim() || null,
          p_itens: payloadItens,
        });

        if (rpcErr) {
          throw new Error(rpcErr.message);
        }

        numeroPedido = rpcRes.numero;
      } else {
        // MockStore fallback
        const mockOrder = mockStore.createPedido({
          cliente_nome: clienteNome.trim(),
          cliente_telefone: cleanPhone,
          tipo,
          endereco: tipo === 'entrega' ? endereco.trim() : null,
          lat,
          lng,
          distancia_km: distanciaKm,
          forma_pagamento: formaPagamento as any,
          troco_para: trocoNum,
          observacoes: observacoesGerais.trim() || null,
          subtotal,
          taxa_entrega: tipo === 'entrega' ? taxaEntrega : 0,
          total: totalGeral,
          itens: items,
        });
        numeroPedido = mockOrder.numero;
      }

      // Monta texto e link do WhatsApp
      const msg = buildWhatsAppMessage({
        numeroPedido,
        nomePastelaria: config.nome_loja,
        whatsappLoja: config.whatsapp_loja,
        clienteNome: clienteNome.trim(),
        clienteTelefone: cleanPhone,
        tipo,
        distanciaKm,
        endereco: tipo === 'entrega' ? endereco.trim() : null,
        itens: items,
        subtotal,
        taxaEntrega: tipo === 'entrega' ? taxaEntrega : 0,
        total: totalGeral,
        formaPagamento,
        trocoPara: trocoNum,
        observacoesGerais,
      });

      const whatsappUrl = getWhatsAppOrderUrl(config.whatsapp_loja, msg);

      // Abre WhatsApp
      window.open(whatsappUrl, '_blank');

      clearCart();
      onClose();
      onOrderSuccess({
        numero: numeroPedido,
        whatsappUrl,
        total: totalGeral,
        clienteNome: clienteNome.trim(),
      });
    } catch (err: any) {
      console.error('Erro ao processar pedido:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao registrar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl shadow-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div>
            <h2 className="font-black text-lg">Finalizar Pedido</h2>
            <p className="text-xs text-amber-100">
              Preencha seus dados para entrega e envio ao WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleConfirmOrder} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dados Pessoais */}
          <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">
              Seus Dados
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Seu Nome Completo *</span>
              </label>
              <input
                type="text"
                required
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Ex.: João da Silva"
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs sm:text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span>Seu WhatsApp (com DDD) *</span>
              </label>
              <input
                type="tel"
                required
                value={clienteTelefone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(69) 99999-9999"
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs sm:text-sm bg-white"
              />
            </div>
          </div>

          {/* Entrega ou Retirada */}
          <DeliveryAddressForm
            tipo={tipo}
            onChangeTipo={setTipo}
            endereco={endereco}
            onChangeEndereco={setEndereco}
            lat={lat}
            lng={lng}
            onChangeCoords={(newLat, newLng, dist, taxa) => {
              setLat(newLat);
              setLng(newLng);
              setDistanciaKm(dist);
              setTaxaEntrega(taxa);
            }}
            distanciaKm={distanciaKm}
            taxaEntrega={taxaEntrega}
            isDeliverable={isDeliverable}
            setIsDeliverable={setIsDeliverable}
          />

          {/* Forma de Pagamento */}
          <div className="space-y-2 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center space-x-1">
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Forma de Pagamento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: 'pix', label: 'Pix (Entrega/Retirada)', icon: '💠' },
                { id: 'link_whatsapp', label: 'Link de Pagamento no Zap', icon: '🔗' },
                { id: 'cartao_credito', label: 'Cartão de Crédito', icon: '💳' },
                { id: 'cartao_debito', label: 'Cartão de Débito', icon: '💳' },
                { id: 'dinheiro', label: 'Dinheiro', icon: '💵' },
              ].map((pag) => (
                <label
                  key={pag.id}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    formaPagamento === pag.id
                      ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="formaPagamento"
                    value={pag.id}
                    checked={formaPagamento === pag.id}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-base">{pag.icon}</span>
                  <span className="text-xs font-semibold text-gray-800">{pag.label}</span>
                </label>
              ))}
            </div>

            {formaPagamento === 'dinheiro' && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Precisa de troco para quanto? (Opcional)
                </label>
                <input
                  type="text"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  placeholder="Ex.: 50,00"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs bg-white"
                />
              </div>
            )}
          </div>

          {/* Observações Gerais */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Observações gerais do pedido (opcional)
            </label>
            <input
              type="text"
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Ex.: Tocar o interfone 202, deixar na portaria..."
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs bg-white"
            />
          </div>

          {/* Resumo Financeiro */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Subtotal dos Itens</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Taxa de Entrega {tipo === 'retirada' ? '(Retirada Grátis)' : ''}</span>
              <span className={tipo === 'retirada' ? 'text-emerald-600 font-bold' : ''}>
                {tipo === 'retirada' ? 'Grátis' : formatBRL(taxaEntrega)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-gray-900 pt-1.5 border-t border-amber-200">
              <span>Total a Pagar</span>
              <span className="text-base text-amber-700">{formatBRL(totalGeral)}</span>
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading || (tipo === 'entrega' && !isDeliverable)}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando pedido...</span>
              </>
            ) : (
              <>
                <span>Enviar Pedido para o WhatsApp</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
