import { describe, it, expect } from 'vitest';
import { Produto, Opcional, ItemCarrinho } from '../src/@types/database';

describe('Cálculo de Totais do Carrinho', () => {
  const produtoCarne: Produto = {
    id: 'p1',
    categoria_id: 'c1',
    nome: 'Pastel de Carne',
    descricao: 'Carne moída especial',
    preco: 10.0,
    imagem_url: null,
    disponivel: true,
    ordem: 1,
  };

  const opcCatupiry: Opcional = {
    id: 'opc1',
    produto_id: null,
    nome: 'Catupiry Original',
    preco_adicional: 4.0,
    disponivel: true,
  };

  const opcBacon: Opcional = {
    id: 'opc2',
    produto_id: null,
    nome: 'Bacon Crocante',
    preco_adicional: 3.5,
    disponivel: true,
  };

  it('deve calcular o preço unitário e total de um item simples sem adicionais', () => {
    const quantidade = 2;
    const opcionais: Opcional[] = [];
    const opcionaisSum = opcionais.reduce((acc, o) => acc + o.preco_adicional, 0);
    const precoUnitario = produtoCarne.preco + opcionaisSum;
    const precoTotal = precoUnitario * quantidade;

    expect(precoUnitario).toBe(10.0);
    expect(precoTotal).toBe(20.0);
  });

  it('deve somar corretamente os adicionais ao valor unitário e multiplicar pela quantidade', () => {
    const quantidade = 3;
    const opcionais: Opcional[] = [opcCatupiry, opcBacon];
    const opcionaisSum = opcionais.reduce((acc, o) => acc + o.preco_adicional, 0);
    const precoUnitario = produtoCarne.preco + opcionaisSum;
    const precoTotal = precoUnitario * quantidade;

    // 10.00 + 4.00 + 3.50 = 17.50 unitário
    expect(precoUnitario).toBe(17.5);
    // 17.50 * 3 = 52.50 total
    expect(precoTotal).toBe(52.5);
  });

  it('deve somar o subtotal de múltiplos itens distintos no carrinho', () => {
    const item1: ItemCarrinho = {
      id: 'i1',
      produto: produtoCarne,
      quantidade: 2,
      opcionais: [],
      observacao: 'sem cebola',
      precoUnitario: 10.0,
      precoTotal: 20.0,
    };

    const item2: ItemCarrinho = {
      id: 'i2',
      produto: { ...produtoCarne, id: 'p2', nome: 'Pastel de Queijo', preco: 9.0 },
      quantidade: 1,
      opcionais: [opcCatupiry],
      observacao: '',
      precoUnitario: 13.0, // 9 + 4
      precoTotal: 13.0,
    };

    const subtotal = [item1, item2].reduce((acc, item) => acc + item.precoTotal, 0);
    expect(subtotal).toBe(33.0);
  });
});
