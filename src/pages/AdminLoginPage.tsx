import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToMenu: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToMenu }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email.trim(), password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Falha ao autenticar.');
    }
  };

  const handleUseDemo = () => {
    setEmail('admin@pastelaria.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 relative">
        <button
          onClick={onBackToMenu}
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 p-1 rounded-lg transition-colors flex items-center space-x-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cardápio</span>
        </button>

        <div className="text-center mt-4 mb-6">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Painel do Proprietário
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Acesso exclusivo para gerenciar pedidos, cardápio e taxas
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              E-mail do Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pastelaria.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold shadow-md shadow-amber-500/30 flex items-center justify-center space-x-2 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 mb-2">
            Em ambiente de testes local ou modo de demonstração:
          </p>
          <button
            type="button"
            onClick={handleUseDemo}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
          >
            Preencher Credenciais Demo
          </button>
        </div>
      </div>
    </div>
  );
};
