import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { FaixaEntrega } from '../../@types/database';
import { formatBRL } from '../../lib/formatters';
import { mockStore } from '../../lib/mockStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  Save,
  Plus,
  Trash2,
  Bike,
  Store,
  Clock,
  Phone,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { config, faixasEntrega, updateConfig, refreshStore } = useStore();

  const [nomeLoja, setNomeLoja] = useState(config.nome_loja);
  const [whatsappLoja, setWhatsappLoja] = useState(config.whatsapp_loja);
  const [enderecoLoja, setEnderecoLoja] = useState(config.endereco_loja);
  const [latLoja, setLatLoja] = useState(config.lat_loja.toString());
  const [lngLoja, setLngLoja] = useState(config.lng_loja.toString());
  const [horario, setHorario] = useState(config.horario_funcionamento);
  const [valorMinimo, setValorMinimo] = useState(config.valor_minimo.toString());
  const [mensagemFechada, setMensagemFechada] = useState(config.mensagem_fechada);

  const [newKmAte, setNewKmAte] = useState('');
  const [newValor, setNewValor] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveGeneralConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig({
      nome_loja: nomeLoja.trim(),
      whatsapp_loja: whatsappLoja.trim(),
      endereco_loja: enderecoLoja.trim(),
      lat_loja: parseFloat(latLoja) || config.lat_loja,
      lng_loja: parseFloat(lngLoja) || config.lng_loja,
      horario_funcionamento: horario.trim(),
      valor_minimo: parseFloat(valorMinimo.replace(',', '.')) || 0,
      mensagem_fechada: mensagemFechada.trim(),
    });

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const handleAddFaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    const km = parseFloat(newKmAte.replace(',', '.'));
    const val = parseFloat(newValor.replace(',', '.'));
    if (isNaN(km) || isNaN(val)) return;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('faixas_entrega').insert({
        km_ate: km,
        valor: val,
        ativo: true,
      });
    } else {
      const all = mockStore.getFaixas();
      all.push({
        id: 'fx-' + Math.random().toString(36).substring(2, 9),
        km_ate: km,
        valor: val,
        ativo: true,
      });
      mockStore.saveFaixas(all);
    }

    setNewKmAte('');
    setNewValor('');
    await refreshStore();
  };

  const handleDeleteFaixa = async (faixaId: string) => {
    if (!confirm('Deseja excluir esta faixa de entrega?')) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('faixas_entrega').delete().eq('id', faixaId);
    } else {
      const all = mockStore.getFaixas().filter((f) => f.id !== faixaId);
      mockStore.saveFaixas(all);
    }
    await refreshStore();
  };

  return (
    <div className="space-y-6">
      {savedFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Configurações da pastelaria salvas com sucesso!</span>
        </div>
      )}

      {/* Formulário Geral */}
      <form onSubmit={handleSaveGeneralConfig} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center space-x-1.5">
              <Store className="w-4 h-4 text-amber-600" />
              <span>Dados da Pastelaria</span>
            </h2>
            <p className="text-xs text-gray-500">
              Informações públicas exibidas no app do cliente e no cabeçalho do WhatsApp
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Nome da Pastelaria
            </label>
            <input
              type="text"
              required
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>WhatsApp da Loja (DDI + DDD + Número)</span>
            </label>
            <input
              type="text"
              required
              value={whatsappLoja}
              onChange={(e) => setWhatsappLoja(e.target.value)}
              placeholder="5569999998888"
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              Endereço Físico Completo (Para Retirada)
            </label>
            <input
              type="text"
              required
              value={enderecoLoja}
              onChange={(e) => setEnderecoLoja(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Latitude da Loja (Base de Cálculo de Entrega)
            </label>
            <input
              type="text"
              required
              value={latLoja}
              onChange={(e) => setLatLoja(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Longitude da Loja
            </label>
            <input
              type="text"
              required
              value={lngLoja}
              onChange={(e) => setLngLoja(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Horário de Funcionamento Exibido</span>
            </label>
            <input
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="Terça a Domingo: 18:00 às 23:30"
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center space-x-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Valor Mínimo para Pedidos (R$)</span>
            </label>
            <input
              type="text"
              value={valorMinimo}
              onChange={(e) => setValorMinimo(e.target.value)}
              placeholder="15.00"
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-gray-700 mb-1">
              Mensagem quando a pastelaria estiver fechada
            </label>
            <input
              type="text"
              value={mensagemFechada}
              onChange={(e) => setMensagemFechada(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      </form>

      {/* Faixas de Entrega */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center space-x-1.5">
              <Bike className="w-4 h-4 text-amber-600" />
              <span>Faixas de Entrega por Distância</span>
            </h2>
            <p className="text-xs text-gray-500">
              Defina o valor da taxa de acordo com os quilômetros de distância até o cliente
            </p>
          </div>
        </div>

        {/* Adicionar Nova Faixa */}
        <form onSubmit={handleAddFaixa} className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Distância Até (km)
            </label>
            <input
              type="text"
              required
              value={newKmAte}
              onChange={(e) => setNewKmAte(e.target.value)}
              placeholder="Ex: 3.0"
              className="p-2 rounded-lg border border-gray-200 outline-none text-xs w-28 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Valor da Taxa (R$)
            </label>
            <input
              type="text"
              required
              value={newValor}
              onChange={(e) => setNewValor(e.target.value)}
              placeholder="Ex: 7.00"
              className="p-2 rounded-lg border border-gray-200 outline-none text-xs w-28 bg-white"
            />
          </div>

          <button
            type="submit"
            className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Faixa</span>
          </button>
        </form>

        {/* Tabela de Faixas Cadastradas */}
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {faixasEntrega.map((faixa) => (
            <div
              key={faixa.id}
              className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-xs text-gray-800">
                  De 0 até {faixa.km_ate} km
                </span>
                <span className="font-black text-amber-700 text-xs">
                  {formatBRL(faixa.valor)}
                </span>
              </div>

              <button
                onClick={() => handleDeleteFaixa(faixa.id)}
                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                title="Excluir faixa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-500 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <span>
            Pedidos com distância superior à maior faixa cadastrada (
            {faixasEntrega[faixasEntrega.length - 1]?.km_ate || 0} km) serão considerados fora da
            área de entrega, e o app sugerirá a opção Retirada no balcão.
          </span>
        </div>
      </div>
    </div>
  );
};
