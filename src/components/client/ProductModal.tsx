import React, { useState } from 'react';
import { Produto, Opcional } from '../../@types/database';
import { useCart } from '../../contexts/CartContext';
import { formatBRL } from '../../lib/formatters';
import { X, Plus, Minus, Check, MessageSquare } from 'lucide-react';

interface ProductModalProps {
  produto: Produto | null;
  opcionaisDisponiveis: Opcional[];
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  produto,
  opcionaisDisponiveis,
  onClose,
}) => {
  if (!produto) return null;

  const { addItem } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [selectedOpcionais, setSelectedOpcionais] = useState<Opcional[]>([]);
  const [observacao, setObservacao] = useState('');

  // Filtra opcionais aplicáveis a este produto ou globais (produto_id === null)
  const opcionaisFiltrados = opcionaisDisponiveis.filter(
    (o) => o.produto_id === null || o.produto_id === produto.id
  );

  const toggleOpcional = (opcional: Opcional) => {
    setSelectedOpcionais((prev) => {
      const exists = prev.some((o) => o.id === opcional.id);
      if (exists) {
        return prev.filter((o) => o.id !== opcional.id);
      }
      return [...prev, opcional];
    });
  };

  const opcionaisTotal = selectedOpcionais.reduce(
    (acc, o) => acc + Number(o.preco_adicional),
    0
  );
  const precoUnitario = Number(produto.preco) + opcionaisTotal;
  const precoTotal = precoUnitario * quantidade;

  const handleAdd = () => {
    addItem(produto, quantidade, selectedOpcionais, observacao);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Cabeçalho do Modal com Botão Fechar */}
        <div className="relative h-44 sm:h-52 bg-amber-100 flex-shrink-0 overflow-hidden">
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🥟
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl font-black drop-shadow-md leading-tight">
              {produto.nome}
            </h2>
            <p className="text-amber-300 font-bold text-lg mt-0.5">
              {formatBRL(produto.preco)}
            </p>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {produto.descricao && (
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              {produto.descricao}
            </p>
          )}

          {/* Opcionais / Adicionais */}
          {opcionaisFiltrados.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Deseja algum adicional?
                </label>
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  Opcional
                </span>
              </div>

              <div className="space-y-2">
                {opcionaisFiltrados.map((opc) => {
                  const isChecked = selectedOpcionais.some((o) => o.id === opc.id);
                  return (
                    <div
                      key={opc.id}
                      onClick={() => toggleOpcional(opc)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                          : 'border-gray-200 hover:border-amber-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                          {opc.nome}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-amber-700">
                        + {formatBRL(opc.preco_adicional)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observação Livre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Alguma observação para o preparo?</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Sem cebola, massa bem tostadinha, corte ao meio..."
              rows={2}
              maxLength={150}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none text-gray-700"
            />
          </div>
        </div>

        {/* Rodapé com Quantidade e Botão Adicionar */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button
              onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
              disabled={quantidade <= 1}
              className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 disabled:opacity-40 active:scale-95 transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-gray-900">
              {quantidade}
            </span>
            <button
              onClick={() => setQuantidade((q) => q + 1)}
              className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/30 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <span>Adicionar ao Pedido</span>
            <span>{formatBRL(precoTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
