export type StatusPedido = 'novo' | 'em_preparo' | 'pronto' | 'saiu_para_entrega' | 'entregue' | 'cancelado';
export type TipoPedido = 'retirada' | 'entrega';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'link_whatsapp';

export interface Categoria {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  criado_em?: string;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  disponivel: boolean;
  ordem: number;
  criado_em?: string;
}

export interface Opcional {
  id: string;
  produto_id: string | null;
  nome: string;
  preco_adicional: number;
  disponivel: boolean;
  criado_em?: string;
}

export interface FaixaEntrega {
  id: string;
  km_ate: number;
  valor: number;
  ativo: boolean;
  criado_em?: string;
}

export interface ConfiguracoesLoja {
  id: number;
  nome_loja: string;
  whatsapp_loja: string;
  endereco_loja: string;
  lat_loja: number;
  lng_loja: number;
  valor_minimo: number;
  loja_aberta: boolean;
  horario_funcionamento: string;
  mensagem_fechada: string;
  atualizado_em?: string;
}

export interface ItemOpcionalSnapshot {
  nome: string;
  preco: number;
}

export interface PedidoItemSnapshot {
  id?: string;
  pedido_id?: string;
  produto_id: string | null;
  nome_snapshot: string;
  preco_snapshot: number;
  quantidade: number;
  opcionais_json: ItemOpcionalSnapshot[];
  observacao?: string | null;
}

export interface Pedido {
  id: string;
  numero: number;
  data_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo: TipoPedido;
  endereco: string | null;
  lat: number | null;
  lng: number | null;
  distancia_km: number | null;
  forma_pagamento: FormaPagamento;
  troco_para: number | null;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  observacoes: string | null;
  status: StatusPedido;
  criado_em: string;
  itens?: PedidoItemSnapshot[];
}

export interface ItemCarrinho {
  id: string; // id único da linha no carrinho (ex: produto_id + hash opcionais)
  produto: Produto;
  quantidade: number;
  opcionais: Opcional[];
  observacao: string;
  precoUnitario: number;
  precoTotal: number;
}
