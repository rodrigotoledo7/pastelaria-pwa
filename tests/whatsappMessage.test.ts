import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, getWhatsAppOrderUrl } from '../src/lib/whatsapp';
import { ItemCarrinho, Produto, Opcional } from '../src/@types/database';

describe('Formatação da Mensagem do WhatsApp', () => {
  const prodCarne: Produto = {
    id: '1',
    categoria_id: 'c1',
    nome: 'Pastel de Carne',
    descricao: '',
    preco: 8.0,
    imagem_url: null,
    disponivel: true,
    ordem: 1,
  };

  const prodQueijo: Produto = {
    id: '2',
    categoria_id: 'c1',
    nome: 'Pastel de Queijo',
    descricao: '',
    preco: 7.0,
    imagem_url: null,
    disponivel: true,
    ordem: 2,
  };

  const opcCatupiry: Opcional = {
    id: 'opc1',
    produto_id: null,
    nome: 'Catupiry',
    preco_adicional: 2.5,
    disponivel: true,
  };

  const itens: ItemCarrinho[] = [
    {
      id: 'i1',
      produto: prodCarne,
      quantidade: 2,
      opcionais: [],
      observacao: 'sem cebola',
      precoUnitario: 8.0,
      precoTotal: 16.0,
    },
    {
      id: 'i2',
      produto: prodQueijo,
      quantidade: 1,
      opcionais: [opcCatupiry],
      observacao: '',
      precoUnitario: 9.5,
      precoTotal: 9.5,
    },
  ];

  it('deve gerar a mensagem de entrega no formato exato solicitado', () => {
    const msg = buildWhatsAppMessage({
      numeroPedido: 42,
      nomePastelaria: 'Pastelaria Pastel Dourado',
      whatsappLoja: '5569999998888',
      clienteNome: 'João Silva',
      clienteTelefone: '69999998888',
      tipo: 'entrega',
      distanciaKm: 3.2,
      endereco: 'Rua X, 123, Bairro Y',
      itens,
      subtotal: 25.5,
      taxaEntrega: 8.0,
      total: 33.5,
      formaPagamento: 'link_whatsapp',
      trocoPara: null,
      observacoesGerais: null,
    });

    expect(msg).toContain('🥟 *PEDIDO #0042* — Pastelaria Pastel Dourado');
    expect(msg).toContain('Cliente: João Silva');
    expect(msg).toContain('Telefone: (69) 99999-8888');
    expect(msg).toContain('Tipo: Entrega (3,2 km)');
    expect(msg).toContain('Endereço: Rua X, 123, Bairro Y');
    expect(msg).toContain('2x Pastel de Carne — R$ 16,00');
    expect(msg).toContain('   • Obs.: sem cebola');
    expect(msg).toContain('1x Pastel de Queijo + Catupiry — R$ 9,50');
    expect(msg).toContain('Subtotal: R$ 25,50');
    expect(msg).toContain('Entrega: R$ 8,00');
    expect(msg).toContain('*Total: R$ 33,50*');
    expect(msg).toContain('Pagamento: Link de pagamento (enviar na conversa)');
  });

  it('deve formatar corretamente para pedido com retirada no balcão (sem taxa e sem endereço)', () => {
    const msg = buildWhatsAppMessage({
      numeroPedido: 5,
      nomePastelaria: 'Pastelaria Pastel Dourado',
      whatsappLoja: '5569999998888',
      clienteNome: 'Maria Santos',
      clienteTelefone: '11988887777',
      tipo: 'retirada',
      distanciaKm: null,
      endereco: null,
      itens: [itens[0]],
      subtotal: 16.0,
      taxaEntrega: 0,
      total: 16.0,
      formaPagamento: 'pix',
      trocoPara: null,
      observacoesGerais: null,
    });

    expect(msg).toContain('Tipo: Retirada no balcão');
    expect(msg).not.toContain('Entrega:');
    expect(msg).toContain('*Total: R$ 16,00*');
    expect(msg).toContain('Pagamento: Pix (pagar na entrega/retirada)');
  });

  it('deve gerar a URL do wa.me devidamente codificada com URIComponent', () => {
    const msg = '🥟 *PEDIDO #0042* — Teste';
    const url = getWhatsAppOrderUrl('69999998888', msg);

    expect(url).toBe('https://wa.me/5569999998888?text=%F0%9F%A5%9F%20*PEDIDO%20%230042*%20%E2%80%94%20Teste');
  });
});
