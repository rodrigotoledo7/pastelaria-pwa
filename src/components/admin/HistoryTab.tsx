import React, { useState } from 'react';
import { Pedido } from '../../@types/database';
import { formatBRL, formatOrderNumber, formatPhoneNumber, formatStatusLabel, formatPaymentMethod } from '../../lib/formatters';
import { Search, Download, TrendingUp, ShoppingBag, DollarSign, Calendar } from 'lucide-react';

interface HistoryTabProps {
  pedidos: Pedido[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ pedidos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filtros
  const filtered = pedidos.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente_telefone.includes(searchTerm) ||
      p.numero.toString().includes(searchTerm);

    const matchesDate = !dateFilter || p.data_pedido === dateFilter;

    return matchesSearch && matchesDate;
  });

  // Métricas
  const totalFaturado = filtered
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + Number(p.total), 0);

  const totalPedidosValidos = filtered.filter((p) => p.status !== 'cancelado').length;
  const ticketMedio = totalPedidosValidos > 0 ? totalFaturado / totalPedidosValidos : 0;

  // Itens mais vendidos
  const itensCountMap: { [nome: string]: number } = {};
  filtered
    .filter((p) => p.status !== 'cancelado')
    .forEach((p) => {
      p.itens?.forEach((it) => {
        itensCountMap[it.nome_snapshot] = (itensCountMap[it.nome_snapshot] || 0) + it.quantidade;
      });
    });

  const topItens = Object.entries(itensCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'Numero',
      'Data',
      'Cliente',
      'Telefone',
      'Tipo',
      'Endereco',
      'Distancia_Km',
      'Pagamento',
      'Subtotal',
      'Taxa_Entrega',
      'Total',
      'Status',
    ];

    const rows = filtered.map((p) => [
      formatOrderNumber(p.numero),
      p.data_pedido,
      `"${p.cliente_nome.replace(/"/g, '""')}"`,
      p.cliente_telefone,
      p.tipo,
      `"${(p.endereco || '').replace(/"/g, '""')}"`,
      p.distancia_km || 0,
      p.forma_pagamento,
      p.subtotal.toFixed(2),
      p.taxa_entrega.toFixed(2),
      p.total.toFixed(2),
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pedidos_pastelaria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-xs sm:text-sm">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Faturamento Total</p>
            <p className="text-xl font-black text-gray-900">{formatBRL(totalFaturado)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pedidos Realizados</p>
            <p className="text-xl font-black text-gray-900">{totalPedidosValidos}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Ticket Médio</p>
            <p className="text-xl font-black text-gray-900">{formatBRL(ticketMedio)}</p>
          </div>
        </div>
      </div>

      {/* Top Pastéis Mais Vendidos */}
      {topItens.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
            🥟 Pastéis & Itens Mais Pedidos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {topItens.map(([nome, qtd], idx) => (
              <div
                key={idx}
                className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/70 text-center"
              >
                <span className="font-black text-amber-700 text-sm">{qtd} un</span>
                <p className="text-xs font-semibold text-gray-800 line-clamp-1 mt-0.5">
                  {nome}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtro e Exportação */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, telefone ou número..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 outline-none text-xs"
            />
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 rounded-xl border border-gray-200 outline-none text-xs"
            />
          </div>

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-amber-700 hover:underline font-semibold"
            >
              Limpar data
            </button>
          )}
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
              <th className="p-3">Nº</th>
              <th className="p-3">Data/Hora</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Itens</th>
              <th className="p-3">Pagamento</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((pedido) => {
              const status = formatStatusLabel(pedido.status);
              return (
                <tr key={pedido.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 font-black text-gray-900">
                    {formatOrderNumber(pedido.numero)}
                  </td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {pedido.data_pedido}
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{pedido.cliente_nome}</p>
                    <p className="text-[11px] text-gray-500">
                      {formatPhoneNumber(pedido.cliente_telefone)}
                    </p>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {pedido.tipo === 'entrega' ? '🛵 Entrega' : '🏬 Retirada'}
                  </td>
                  <td className="p-3 max-w-[220px]">
                    <p className="line-clamp-2 text-gray-700">
                      {pedido.itens?.map((i) => `${i.quantidade}x ${i.nome_snapshot}`).join(', ') ||
                        'Ver itens'}
                    </p>
                  </td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">
                    {formatPaymentMethod(pedido.forma_pagamento)}
                  </td>
                  <td className="p-3 font-black text-amber-700 whitespace-nowrap">
                    {formatBRL(pedido.total)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
