import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL } from '../../lib/formatters';
import { mockStore } from '../../lib/mockStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  createAdminUser,
  getLocalAdminUsers,
  removeAdminUser,
  AdminUserRecord,
} from '../../lib/userManagement';
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
  Users,
  UserPlus,
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { config, faixasEntrega, updateConfig, refreshStore } = useStore();
  const { user: currentUser } = useAuth();

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

  // Estados de Gerenciamento de Usuários
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => getLocalAdminUsers());
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFeedback, setUserFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFeedback(null);
    setIsCreatingUser(true);

    const res = await createAdminUser(newUserEmail, newUserPassword);
    setIsCreatingUser(false);

    if (res.success) {
      setUserFeedback({
        type: 'success',
        message: `Usuário ${newUserEmail} cadastrado com sucesso!`,
      });
      setAdminUsers(getLocalAdminUsers());
      setNewUserEmail('');
      setNewUserPassword('');
      setTimeout(() => setUserFeedback(null), 4000);
    } else {
      setUserFeedback({
        type: 'error',
        message: res.error || 'Falha ao cadastrar usuário.',
      });
    }
  };

  const handleRemoveAdminUser = (id: string, email: string) => {
    if (!confirm(`Deseja remover o usuário ${email} da lista de administradores?`)) return;
    removeAdminUser(id);
    setAdminUsers(getLocalAdminUsers());
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

      {/* Seção: Gerenciamento de Usuários do Painel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Usuários & Acessos do Painel</span>
            </h2>
            <p className="text-xs text-gray-500">
              Cadastre novos administradores (gerente, funcionários) para gerenciar pedidos e cardápio
            </p>
          </div>
        </div>

        {userFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2 animate-fade-in ${
              userFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            {userFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{userFeedback.message}</span>
          </div>
        )}

        {/* Formulário Rápido de Novo Usuário */}
        <form
          onSubmit={handleCreateAdminUser}
          className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3"
        >
          <div className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            <span>Cadastrar Novo Administrador</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                E-mail do Novo Usuário
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="gerente@pastelaria.com"
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 outline-none text-xs bg-white focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Senha Inicial (Mín. 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 outline-none text-xs bg-white focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isCreatingUser}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isCreatingUser ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>{isCreatingUser ? 'Cadastrando...' : 'Criar Usuário'}</span>
            </button>
          </div>
        </form>

        {/* Lista de Administradores Registrados */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-gray-700">Administradores com Acesso:</div>
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {/* Usuário Atual Logado */}
            <div className="p-3 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-gray-800 flex items-center space-x-1.5">
                    <span>{currentUser?.email || 'admin@pastelaria.com'}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                      Você (Atual)
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400">Acesso total ao painel</div>
                </div>
              </div>
            </div>

            {/* Usuários Cadastrados */}
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-800">{user.email}</div>
                    <div className="text-[10px] text-gray-400">
                      Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                  <button
                    onClick={() => handleRemoveAdminUser(user.id, user.email)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                    title="Remover acesso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
