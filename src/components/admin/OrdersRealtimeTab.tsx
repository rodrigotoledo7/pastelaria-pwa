import React, { useState } from 'react';
import { Pedido, StatusPedido } from '../../@types/database';
import { formatBRL, formatOrderNumber, formatPhoneNumber, formatStatusLabel, formatPaymentMethod } from '../../lib/formatters';
import { cleanPhoneForWhatsApp } from '../../lib/formatters';
import {
  MessageCircle,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  XCircle,
  Filter,
} from 'lucide-react';

interface OrdersRealtimeTabProps {
  pedidos: Pedido[];
  onUpdateStatus: (pedidoId: string, novoStatus: StatusPedido) => Promise<void>;
}

export const OrdersRealtimeTab: React.FC<OrdersRealtimeTabProps> = ({
  pedidos,
  onUpdateStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filtra apenas os pedidos relevantes (ou todos)
  const filteredPedidos = pedidos.filter((p) => {
    if (statusFilter === 'todos') return p.status !== 'cancelado';
    return p.status === statusFilter;
  });

  const handleOpenClientWhatsApp = (pedido: Pedido) => {
    const cleanPhone = cleanPhoneForWhatsApp(pedido.cliente_telefone);
    let msg = `Olá, ${pedido.cliente_nome}! Aqui é da Pastelaria. Sobre o seu pedido ${formatOrderNumber(pedido.numero)}: `;

    if (pedido.status === 'em_preparo') {
      msg += 'Seus pastéis já estão no tacho sendo preparados quentinhos! 🥟🔥';
    } else if (pedido.status === 'saiu_para_entrega') {
      msg += 'Seu pedido acabou de sair com o nosso entregador e logo chega aí! 🛵💨';
    } else if (pedido.forma_pagamento === 'link_whatsapp') {
      msg += `Aqui está a chave Pix ou link de pagamento no valor de ${formatBRL(pedido.total)}: `;
    } else {
      msg += 'Estamos à disposição caso precise de algo!';
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const getNextStatus = (current: StatusPedido): StatusPedido | null => {
    switch (current) {
      case 'novo':
        return 'em_preparo';
      case 'em_preparo':
        return 'pronto';
      case 'pronto':
        return 'saiu_para_entrega';
      case 'saiu_para_entrega':
        return 'entregue';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (current: StatusPedido): string => {
    switch (current) {
      case 'novo':
        return 'Iniciar Preparo 🍳';
      case 'em_preparo':
        return 'Marcar como Pronto ✅';
      case 'pronto':
        return 'Despachar Entrega 🛵';
      case 'saiu_para_entrega':
        return 'Confirmar Entrega 🎉';
      default:
        return 'Avançar';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros rápidos de visualização */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700">
          <Filter className="w-4 h-4 text-amber-600" />
          <span>Filtrar por Status:</span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'todos', label: 'Ativos' },
            { id: 'novo', label: 'Novos' },
            { id: 'em_preparo', label: 'Em Preparo' },
            { id: 'pronto', label: 'Prontos' },
            { id: 'saiu_para_entrega', label: 'Na Rua' },
            { id: 'entregue', label: 'Entregues' },
            { id: 'cancelado', label: 'Cancelados' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === f.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Pedidos */}
      {filteredPedidos.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
          <span className="text-5xl">🛎️</span>
          <h3 className="font-bold text-gray-900 text-lg mt-3">
            Nenhum pedido encontrado nesta categoria
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Assim que um cliente enviar um pedido pelo PWA, ele aparecerá aqui instantaneamente com alerta sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPedidos.map((pedido) => {
            const statusInfo = formatStatusLabel(pedido.status);
            const next = getNextStatus(pedido.status);
            const isNew = pedido.status === 'novo';

            return (
              <div
                key={pedido.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isNew
                    ? 'border-amber-400 ring-2 ring-amber-300/40 bg-amber-50/20'
                    : 'border-gray-200'
                }`}
              >
                {/* Topo do Card */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-lg text-gray-900">
                      {formatOrderNumber(pedido.numero)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="font-bold text-gray-900 flex items-center space-x-1">
                      <span>👤 {pedido.cliente_nome}</span>
                    </p>
                    <p className="flex items-center space-x-1 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{formatPhoneNumber(pedido.cliente_telefone)}</span>
                    </p>
                    <p className="flex items-center space-x-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {new Date(pedido.criado_em).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>

                  {/* Endereço ou Retirada */}
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                    {pedido.tipo === 'entrega' ? (
                      <div className="flex items-start space-x-1 text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Entrega {pedido.distancia_km ? `(${pedido.distancia_km} km)` : ''}
                          </p>
                          <p className="text-[11px] text-gray-700">{pedido.endereco}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-emerald-800 bg-emerald-50 p-2 rounded-xl font-bold border border-emerald-200">
                        🏬 Retirada no Balcão
                      </div>
                    )}
                  </div>
                </div>

                {/* Itens do Pedido */}
                <div className="p-4 bg-gray-50/50 flex-1 space-y-2 text-xs">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Itens ({pedido.itens?.length || 0})
                  </p>

                  <div className="space-y-1.5 divide-y divide-gray-100">
                    {pedido.itens?.map((it, idx) => (
                      <div key={idx} className="pt-1.5 first:pt-0">
                        <div className="flex justify-between font-semibold text-gray-900">
                          <span>
                            {it.quantidade}x {it.nome_snapshot}
                          </span>
                          <span>{formatBRL(it.preco_snapshot * it.quantidade)}</span>
                        </div>

                        {it.opcionais_json && it.opcionais_json.length > 0 && (
                          <p className="text-[10px] text-amber-800 font-medium">
                            + {it.opcionais_json.map((o) => o.nome).join(', ')}
                          </p>
                        )}

                        {it.observacao && (
                          <p className="text-[10px] text-gray-500 italic">
                            Obs: "{it.observacao}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {pedido.observacoes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-900 text-[11px]">
                      <strong>Obs. Geral:</strong> {pedido.observacoes}
                    </div>
                  )}
                </div>

                {/* Rodapé com Valores e Ações */}
                <div className="p-4 border-t border-gray-100 bg-white space-y-2.5">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Pagamento:</span>
                      <span className="font-semibold text-gray-800">
                        {formatPaymentMethod(pedido.forma_pagamento, pedido.troco_para)}
                      </span>
                    </div>

                    <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t border-gray-100">
                      <span>Total:</span>
                      <span className="text-amber-700 text-base">{formatBRL(pedido.total)}</span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-1.5 pt-1">
                    {next && (
                      <button
                        onClick={() => onUpdateStatus(pedido.id, next)}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                      >
                        <span>{getNextStatusLabel(pedido.status)}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenClientWhatsApp(pedido)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-1.5 border border-emerald-200 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chamar no Zap</span>
                      </button>

                      {pedido.status !== 'cancelado' && pedido.status !== 'entregue' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja cancelar o pedido ${formatOrderNumber(pedido.numero)}?`)) {
                              onUpdateStatus(pedido.id, 'cancelado');
                            }
                          }}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors"
                          title="Cancelar Pedido"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
