// Mock Store local e persistente no LocalStorage (fallback para testes offline e sem Supabase)
import { Categoria, Produto, Opcional, FaixaEntrega, ConfiguracoesLoja, Pedido, ItemCarrinho } from '../@types/database';

const DEFAULT_CONFIG: ConfiguracoesLoja = {
  id: 1,
  nome_loja: 'Pastelaria Pastel Dourado',
  whatsapp_loja: '5569999998888',
  endereco_loja: 'Av. Jorge Teixeira, 1200 - Porto Velho - RO',
  lat_loja: -8.7611605,
  lng_loja: -63.9004303,
  valor_minimo: 15.00,
  loja_aberta: true,
  horario_funcionamento: 'Terça a Domingo: 18:00 às 23:30',
  mensagem_fechada: 'Estamos fechados no momento. Nosso tacho acende às 18:00!',
};

const DEFAULT_FAIXAS: FaixaEntrega[] = [
  { id: 'fx-1', km_ate: 2.5, valor: 5.00, ativo: true },
  { id: 'fx-2', km_ate: 5.0, valor: 8.50, ativo: true },
  { id: 'fx-3', km_ate: 7.5, valor: 12.00, ativo: true },
  { id: 'fx-4', km_ate: 10.0, valor: 16.00, ativo: true },
];

const DEFAULT_CATEGORIAS: Categoria[] = [
  { id: 'cat-1', nome: 'Pastéis Salgados', ordem: 1, ativo: true },
  { id: 'cat-2', nome: 'Pastéis Doces', ordem: 2, ativo: true },
  { id: 'cat-3', nome: 'Combos Promocionais', ordem: 3, ativo: true },
  { id: 'cat-4', nome: 'Bebidas & Caldos', ordem: 4, ativo: true },
];

const DEFAULT_OPCIONAIS: Opcional[] = [
  { id: 'opc-1', produto_id: null, nome: 'Catupiry Original Extra', preco_adicional: 4.00, disponivel: true },
  { id: 'opc-2', produto_id: null, nome: 'Bacon Crocante em Cubos', preco_adicional: 4.50, disponivel: true },
  { id: 'opc-3', produto_id: null, nome: 'Cheddar Cremoso', preco_adicional: 3.50, disponivel: true },
  { id: 'opc-4', produto_id: null, nome: 'Vinagrete Especial da Casa (50ml)', preco_adicional: 2.50, disponivel: true },
  { id: 'opc-5', produto_id: null, nome: 'Pimenta Caseira Especial (30ml)', preco_adicional: 2.00, disponivel: true },
  { id: 'opc-6', produto_id: null, nome: 'Queijo Muçarela Extra', preco_adicional: 4.00, disponivel: true },
];

const DEFAULT_PRODUTOS: Produto[] = [
  {
    id: 'prod-1',
    categoria_id: 'cat-1',
    nome: 'Pastel de Carne Especial',
    descricao: 'Carne moída fresca de primeira bem temperadinha com azeitonas fatiadas e ovos cozidos.',
    preco: 12.00,
    imagem_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 1,
  },
  {
    id: 'prod-2',
    categoria_id: 'cat-1',
    nome: 'Pastel de Queijo Muçarela',
    descricao: 'Muito queijo muçarela derretido com orégano fresco em massa super crocante.',
    preco: 11.00,
    imagem_url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 2,
  },
  {
    id: 'prod-3',
    categoria_id: 'cat-1',
    nome: 'Pastel de Pizza Paulista',
    descricao: 'Muçarela farta, presunto magro selecionado, rodelas de tomate fresco e orégano.',
    preco: 13.00,
    imagem_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 3,
  },
  {
    id: 'prod-4',
    categoria_id: 'cat-1',
    nome: 'Pastel Frango com Catupiry',
    descricao: 'Peito de frango desfiado com tempero caseiro especial e Catupiry cremoso autêntico.',
    preco: 14.50,
    imagem_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 4,
  },
  {
    id: 'prod-5',
    categoria_id: 'cat-1',
    nome: 'Pastel Gigante da Casa (30cm)',
    descricao: 'O campeão de vendas: Carne moída, muçarela, bacon em cubos, presunto, ovo, azeitona e catupiry.',
    preco: 24.00,
    imagem_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 5,
  },
  {
    id: 'prod-6',
    categoria_id: 'cat-2',
    nome: 'Pastel Nutella com Banana',
    descricao: 'Nutella original pura recheando banana fatiada fresca com um leve toque de canela.',
    preco: 15.00,
    imagem_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 1,
  },
  {
    id: 'prod-7',
    categoria_id: 'cat-2',
    nome: 'Pastel Romeu e Julieta',
    descricao: 'Goiabada cascão cremosa combinada com queijo minas frescal derretido.',
    preco: 13.00,
    imagem_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 2,
  },
  {
    id: 'prod-8',
    categoria_id: 'cat-3',
    nome: 'Combo Dupla Feliz',
    descricao: '1 Pastel Especial de Carne + 1 Pastel Tradicional de Queijo + 1 Caldo de Cana 500ml.',
    preco: 28.00,
    imagem_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 1,
  },
  {
    id: 'prod-9',
    categoria_id: 'cat-4',
    nome: 'Caldo de Cana Gelado (500ml)',
    descricao: 'Moído na hora no balcão, geladíssimo! Opções com limão taiti ou abacaxi.',
    preco: 8.00,
    imagem_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 1,
  },
  {
    id: 'prod-10',
    categoria_id: 'cat-4',
    nome: 'Coca-Cola Lata 350ml',
    descricao: 'Refrigerante lata trincando de gelada.',
    preco: 6.00,
    imagem_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    disponivel: true,
    ordem: 2,
  },
];

class MockStore {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`pastelaria_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`pastelaria_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  }

  // Configurações
  getConfig(): ConfiguracoesLoja {
    return this.getStorage<ConfiguracoesLoja>('config', DEFAULT_CONFIG);
  }

  updateConfig(updates: Partial<ConfiguracoesLoja>): ConfiguracoesLoja {
    const current = this.getConfig();
    const updated = { ...current, ...updates, atualizado_em: new Date().toISOString() };
    this.setStorage('config', updated);
    window.dispatchEvent(new CustomEvent('pastelaria_config_changed', { detail: updated }));
    return updated;
  }

  // Categorias
  getCategorias(): Categoria[] {
    return this.getStorage<Categoria[]>('categorias', DEFAULT_CATEGORIAS).sort((a, b) => a.ordem - b.ordem);
  }

  saveCategorias(cats: Categoria[]): void {
    this.setStorage('categorias', cats);
    window.dispatchEvent(new CustomEvent('pastelaria_menu_changed'));
  }

  // Produtos
  getProdutos(): Produto[] {
    return this.getStorage<Produto[]>('produtos', DEFAULT_PRODUTOS).sort((a, b) => a.ordem - b.ordem);
  }

  saveProdutos(prods: Produto[]): void {
    this.setStorage('produtos', prods);
    window.dispatchEvent(new CustomEvent('pastelaria_menu_changed'));
  }

  // Opcionais
  getOpcionais(): Opcional[] {
    return this.getStorage<Opcional[]>('opcionais', DEFAULT_OPCIONAIS);
  }

  saveOpcionais(opcs: Opcional[]): void {
    this.setStorage('opcionais', opcs);
    window.dispatchEvent(new CustomEvent('pastelaria_menu_changed'));
  }

  // Faixas de Entrega
  getFaixas(): FaixaEntrega[] {
    return this.getStorage<FaixaEntrega[]>('faixas', DEFAULT_FAIXAS).sort((a, b) => a.km_ate - b.km_ate);
  }

  saveFaixas(faixas: FaixaEntrega[]): void {
    this.setStorage('faixas', faixas);
    window.dispatchEvent(new CustomEvent('pastelaria_faixas_changed'));
  }

  // Pedidos
  getPedidos(): Pedido[] {
    return this.getStorage<Pedido[]>('pedidos', []).sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    );
  }

  getNextOrderNumber(hojeStr: string): number {
    const pedidos = this.getPedidos();
    const pedidosHoje = pedidos.filter((p) => p.data_pedido === hojeStr);
    const max = pedidosHoje.reduce((acc, curr) => Math.max(acc, curr.numero), 0);
    return max + 1;
  }

  createPedido(pedidoData: {
    cliente_nome: string;
    cliente_telefone: string;
    tipo: 'retirada' | 'entrega';
    endereco: string | null;
    lat: number | null;
    lng: number | null;
    distancia_km: number | null;
    forma_pagamento: any;
    troco_para: number | null;
    observacoes: string | null;
    subtotal: number;
    taxa_entrega: number;
    total: number;
    itens: ItemCarrinho[];
  }): Pedido {
    const hojeStr = new Date().toISOString().split('T')[0];
    const numero = this.getNextOrderNumber(hojeStr);

    const novoPedido: Pedido = {
      id: 'ped-' + Math.random().toString(36).substring(2, 9),
      numero,
      data_pedido: hojeStr,
      cliente_nome: pedidoData.cliente_nome,
      cliente_telefone: pedidoData.cliente_telefone,
      tipo: pedidoData.tipo,
      endereco: pedidoData.endereco,
      lat: pedidoData.lat,
      lng: pedidoData.lng,
      distancia_km: pedidoData.distancia_km,
      forma_pagamento: pedidoData.forma_pagamento,
      troco_para: pedidoData.troco_para,
      subtotal: pedidoData.subtotal,
      taxa_entrega: pedidoData.taxa_entrega,
      total: pedidoData.total,
      observacoes: pedidoData.observacoes,
      status: 'novo',
      criado_em: new Date().toISOString(),
      itens: pedidoData.itens.map((it) => ({
        produto_id: it.produto.id,
        nome_snapshot: it.produto.nome,
        preco_snapshot: it.produto.preco,
        quantidade: it.quantidade,
        opcionais_json: it.opcionais.map((o) => ({ nome: o.nome, preco: o.preco_adicional })),
        observacao: it.observacao,
      })),
    };

    const pedidos = this.getPedidos();
    pedidos.unshift(novoPedido);
    this.setStorage('pedidos', pedidos);

    // Dispara evento Realtime local
    window.dispatchEvent(new CustomEvent('pastelaria_new_order', { detail: novoPedido }));
    return novoPedido;
  }

  updateOrderStatus(pedidoId: string, status: any): Pedido | null {
    const pedidos = this.getPedidos();
    const index = pedidos.findIndex((p) => p.id === pedidoId);
    if (index === -1) return null;
    pedidos[index].status = status;
    this.setStorage('pedidos', pedidos);
    window.dispatchEvent(new CustomEvent('pastelaria_order_status_updated', { detail: pedidos[index] }));
    return pedidos[index];
  }
}

export const mockStore = new MockStore();
