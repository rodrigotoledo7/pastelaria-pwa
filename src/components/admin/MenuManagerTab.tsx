import React, { useState, useRef } from 'react';
import { Categoria, Produto, Opcional } from '../../@types/database';
import { formatBRL } from '../../lib/formatters';
import { mockStore } from '../../lib/mockStore';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { uploadProductImage } from '../../lib/imageUpload';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  X,
  Camera,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';

interface MenuManagerTabProps {
  categorias: Categoria[];
  produtos: Produto[];
  opcionais: Opcional[];
  onRefresh: () => Promise<void>;
}

export const MenuManagerTab: React.FC<MenuManagerTabProps> = ({
  categorias,
  produtos,
  opcionais,
  onRefresh,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categorias[0]?.id || '');
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Estados do formulário de produto
  const [prodNome, setProdNome] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPreco, setProdPreco] = useState('');
  const [prodCategoria, setProdCategoria] = useState('');
  const [prodImagem, setProdImagem] = useState('');
  const [prodDisponivel, setProdDisponivel] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de nova categoria
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatNome, setNewCatNome] = useState('');

  // Estados de novos opcionais
  const [isOpcModalOpen, setIsOpcModalOpen] = useState(false);
  const [newOpcNome, setNewOpcNome] = useState('');
  const [newOpcPreco, setNewOpcPreco] = useState('');

  // Importação CSV
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdNome('');
    setProdDesc('');
    setProdPreco('');
    setProdCategoria(selectedCatId || categorias[0]?.id || '');
    setProdImagem('');
    setProdDisponivel(true);
    setIsUploadingImage(false);
    setShowUrlInput(false);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Produto) => {
    setEditingProduct(p);
    setProdNome(p.nome);
    setProdDesc(p.descricao || '');
    setProdPreco(p.preco.toString());
    setProdCategoria(p.categoria_id);
    setProdImagem(p.imagem_url || '');
    setProdDisponivel(p.disponivel);
    setIsUploadingImage(false);
    setShowUrlInput(false);
    setIsProductModalOpen(true);
  };

  const handleProcessImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setIsUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      setProdImagem(url);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Não foi possível processar a imagem. Tente novamente.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessImageFile(file);
    }
  };

  const handleToggleProductAvailability = async (produto: Produto) => {
    const novoStatus = !produto.disponivel;
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('produtos')
        .update({ disponivel: novoStatus })
        .eq('id', produto.id);
    } else {
      const all = mockStore.getProdutos();
      const updated = all.map((p) =>
        p.id === produto.id ? { ...p, disponivel: novoStatus } : p
      );
      mockStore.saveProdutos(updated);
    }
    await onRefresh();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoNum = parseFloat(prodPreco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum < 0) {
      alert('Por favor, insira um preço válido.');
      return;
    }

    if (editingProduct) {
      // Atualizar
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('produtos')
          .update({
            nome: prodNome.trim(),
            descricao: prodDesc.trim() || null,
            preco: precoNum,
            categoria_id: prodCategoria,
            imagem_url: prodImagem.trim() || null,
            disponivel: prodDisponivel,
          })
          .eq('id', editingProduct.id);
      } else {
        const all = mockStore.getProdutos();
        const updated = all.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                nome: prodNome.trim(),
                descricao: prodDesc.trim() || null,
                preco: precoNum,
                categoria_id: prodCategoria,
                imagem_url: prodImagem.trim() || null,
                disponivel: prodDisponivel,
              }
            : p
        );
        mockStore.saveProdutos(updated);
      }
    } else {
      // Criar Novo
      if (isSupabaseConfigured && supabase) {
        await supabase.from('produtos').insert({
          nome: prodNome.trim(),
          descricao: prodDesc.trim() || null,
          preco: precoNum,
          categoria_id: prodCategoria,
          imagem_url: prodImagem.trim() || null,
          disponivel: prodDisponivel,
          ordem: produtos.length + 1,
        });
      } else {
        const all = mockStore.getProdutos();
        all.push({
          id: 'prod-' + Math.random().toString(36).substring(2, 9),
          categoria_id: prodCategoria,
          nome: prodNome.trim(),
          descricao: prodDesc.trim() || null,
          preco: precoNum,
          imagem_url: prodImagem.trim() || null,
          disponivel: prodDisponivel,
          ordem: all.length + 1,
        });
        mockStore.saveProdutos(all);
      }
    }

    setIsProductModalOpen(false);
    await onRefresh();
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto do cardápio?')) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('produtos').delete().eq('id', prodId);
    } else {
      const all = mockStore.getProdutos().filter((p) => p.id !== prodId);
      mockStore.saveProdutos(all);
    }
    await onRefresh();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNome.trim()) return;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('categorias').insert({
        nome: newCatNome.trim(),
        ordem: categorias.length + 1,
        ativo: true,
      });
    } else {
      const all = mockStore.getCategorias();
      all.push({
        id: 'cat-' + Math.random().toString(36).substring(2, 9),
        nome: newCatNome.trim(),
        ordem: all.length + 1,
        ativo: true,
      });
      mockStore.saveCategorias(all);
    }

    setNewCatNome('');
    setIsCatModalOpen(false);
    await onRefresh();
  };

  const handleAddOpcional = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoNum = parseFloat(newOpcPreco.replace(',', '.'));
    if (!newOpcNome.trim() || isNaN(precoNum)) return;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('opcionais').insert({
        nome: newOpcNome.trim(),
        preco_adicional: precoNum,
        produto_id: null,
        disponivel: true,
      });
    } else {
      const all = mockStore.getOpcionais();
      all.push({
        id: 'opc-' + Math.random().toString(36).substring(2, 9),
        produto_id: null,
        nome: newOpcNome.trim(),
        preco_adicional: precoNum,
        disponivel: true,
      });
      mockStore.saveOpcionais(all);
    }

    setNewOpcNome('');
    setNewOpcPreco('');
    setIsOpcModalOpen(false);
    await onRefresh();
  };

  const handleToggleOpcionalAvailability = async (opc: Opcional) => {
    const novoStatus = !opc.disponivel;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('opcionais').update({ disponivel: novoStatus }).eq('id', opc.id);
    } else {
      const all = mockStore.getOpcionais().map((o) =>
        o.id === opc.id ? { ...o, disponivel: novoStatus } : o
      );
      mockStore.saveOpcionais(all);
    }
    await onRefresh();
  };

  const handleDeleteOpcional = async (opcId: string) => {
    if (!confirm('Deseja excluir este opcional?')) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('opcionais').delete().eq('id', opcId);
    } else {
      const all = mockStore.getOpcionais().filter((o) => o.id !== opcId);
      mockStore.saveOpcionais(all);
    }
    await onRefresh();
  };

  // Importação CSV
  const handleImportCsv = async () => {
    if (!csvContent.trim()) return;

    // Formato esperado: Categoria,Nome,Descricao,Preco,ImagemUrl
    const lines = csvContent.trim().split('\n');
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 4) {
        const [catName, nome, desc, precoStr, imgUrl] = parts;
        const preco = parseFloat(precoStr);
        let cat = categorias.find((c) => c.nome.toLowerCase() === catName.trim().toLowerCase());

        let targetCatId = cat?.id;
        if (!targetCatId) {
          // Cria categoria se não existir
          const newCat: Categoria = {
            id: 'cat-' + Math.random().toString(36).substring(2, 9),
            nome: catName.trim(),
            ordem: categorias.length + 1,
            ativo: true,
          };
          const allCats = mockStore.getCategorias();
          allCats.push(newCat);
          mockStore.saveCategorias(allCats);
          targetCatId = newCat.id;
        }

        const allProds = mockStore.getProdutos();
        allProds.push({
          id: 'prod-' + Math.random().toString(36).substring(2, 9),
          categoria_id: targetCatId,
          nome: nome.trim(),
          descricao: desc.trim() || null,
          preco: isNaN(preco) ? 10.0 : preco,
          imagem_url: imgUrl ? imgUrl.trim() : null,
          disponivel: true,
          ordem: allProds.length + 1,
        });
        mockStore.saveProdutos(allProds);
        importedCount++;
      }
    }

    alert(`Sucesso! ${importedCount} produtos importados do CSV.`);
    setIsCsvModalOpen(false);
    setCsvContent('');
    await onRefresh();
  };

  const filteredProdutos = produtos.filter(
    (p) => !selectedCatId || p.categoria_id === selectedCatId
  );

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Cardápio */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-gray-900 text-lg">Cardápio & Estoque</h2>
          <p className="text-xs text-gray-500">
            Adicione pastéis, altere preços e ative/desative a disponibilidade imediatamente
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pastel / Item</span>
          </button>
        </div>
      </div>

      {/* Seletor de Categorias */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCatId('')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            selectedCatId === ''
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Todos os Produtos ({produtos.length})
        </button>

        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCatId(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedCatId === c.id
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {c.nome} (
            {produtos.filter((p) => p.categoria_id === c.id).length})
          </button>
        ))}
      </div>

      {/* Tabela / Grid de Produtos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100">
          {filteredProdutos.map((prod) => (
            <div
              key={prod.id}
              className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-amber-50 border border-gray-200 flex-shrink-0">
                  {prod.imagem_url ? (
                    <img
                      src={prod.imagem_url}
                      alt={prod.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🥟
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900">{prod.nome}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">{prod.descricao}</p>
                  <span className="font-black text-amber-700 text-xs sm:text-sm mt-0.5 inline-block">
                    {formatBRL(prod.preco)}
                  </span>
                </div>
              </div>

              {/* Controles de Disponibilidade e Ações */}
              <div className="flex items-center space-x-3 self-end sm:self-center">
                {/* Botão Rápido Disponível / Indisponível */}
                <button
                  onClick={() => handleToggleProductAvailability(prod)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    prod.disponivel
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                  title="Clique para alternar disponibilidade no app"
                >
                  {prod.disponivel ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disponível</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Esgotado</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEditProduct(prod)}
                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Editar dados do produto"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir produto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seção de Opcionais & Adicionais */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Opcionais & Adicionais Globais
            </h3>
            <p className="text-xs text-gray-500">
              Itens como Catupiry, Bacon, Cheddar ou Potes de Molho que o cliente pode somar aos pastéis
            </p>
          </div>

          <button
            onClick={() => setIsOpcModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Opcional</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {opcionais.map((opc) => (
            <div
              key={opc.id}
              className="p-3 rounded-xl border border-gray-200 flex items-center justify-between bg-gray-50/50"
            >
              <div>
                <p className="font-bold text-xs text-gray-800">{opc.nome}</p>
                <p className="text-xs font-black text-amber-700">
                  + {formatBRL(opc.preco_adicional)}
                </p>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleToggleOpcionalAvailability(opc)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    opc.disponivel
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {opc.disponivel ? 'Ativo' : 'Esgotado'}
                </button>

                <button
                  onClick={() => handleDeleteOpcional(opc.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Adicionar/Editar Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                {editingProduct ? 'Editar Pastel / Produto' : 'Cadastrar Novo Item'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nome do Pastel / Produto *
                </label>
                <input
                  type="text"
                  required
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  placeholder="Ex.: Pastel de Carne com Queijo"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodPreco}
                    onChange={(e) => setProdPreco(e.target.value)}
                    placeholder="12.00"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-amber-500 bg-white"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Descrição dos Ingredientes
                </label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  placeholder="Ex.: Carne moída refogada, ovo cozido e orégano..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-gray-700">
                    Foto do Produto
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center space-x-1 font-medium"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Ocultar URL' : 'Ou colar link direto'}</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {prodImagem ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2">
                    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={prodImagem}
                        alt="Prévia do produto"
                        className="w-full h-full object-cover"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1" />
                          <span className="text-xs font-semibold">Enviando nova foto...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100 px-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center space-x-1 py-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Trocar foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdImagem('')}
                        disabled={isUploadingImage}
                        className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 py-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      isDraggingOver
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="py-3 flex flex-col items-center text-amber-600">
                        <Loader2 className="w-7 h-7 animate-spin mb-2" />
                        <span className="font-bold text-xs">Processando e enviando foto...</span>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center text-gray-500">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-2 shadow-xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-800 text-xs">
                          Clique para escolher ou arraste a foto
                        </span>
                        <span className="text-[11px] text-gray-400 mt-0.5">
                          PNG, JPG ou WEBP (câmera ou galeria)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {showUrlInput && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      Ou informe uma URL externa da foto:
                    </label>
                    <input
                      type="url"
                      value={prodImagem}
                      onChange={(e) => setProdImagem(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2 rounded-xl border border-gray-200 outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="prodDisp"
                  checked={prodDisponivel}
                  onChange={(e) => setProdDisponivel(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="prodDisp" className="font-semibold text-gray-800">
                  Produto Disponível no Cardápio
                </label>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage}
                  className={`px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20 flex items-center space-x-1.5 ${
                    isUploadingImage ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Salvar Produto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5">
            <h3 className="font-bold text-base mb-3">Nova Categoria</h3>
            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={newCatNome}
                onChange={(e) => setNewCatNome(e.target.value)}
                placeholder="Ex.: Sobremesas Especiais"
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Opcional */}
      {isOpcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5">
            <h3 className="font-bold text-base mb-3">Novo Opcional / Adicional</h3>
            <form onSubmit={handleAddOpcional} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={newOpcNome}
                onChange={(e) => setNewOpcNome(e.target.value)}
                placeholder="Ex.: Catupiry Extra"
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none"
              />
              <input
                type="text"
                required
                value={newOpcPreco}
                onChange={(e) => setNewOpcPreco(e.target.value)}
                placeholder="Preço (ex: 4.50)"
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpcModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold"
                >
                  Criar Opcional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 space-y-3">
            <h3 className="font-bold text-base">Importação de Cardápio via CSV</h3>
            <p className="text-xs text-gray-500">
              Cole o conteúdo CSV no formato: <code>Categoria,Nome,Descricao,Preco,ImagemUrl</code>
            </p>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={`Categoria,Nome,Descricao,Preco,ImagemUrl\nPastéis Salgados,Pastel de Palmito,Palmito refogado com ervas,12.00,https://...\nPastéis Doces,Pastel de Doce de Leite,Doce de leite cremoso,11.50,https://...`}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs font-mono outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-3 py-2 rounded-xl text-gray-600 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Importar Itens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
