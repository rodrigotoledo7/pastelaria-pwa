// Gerador da Mensagem de WhatsApp para Pastelaria
import { ItemCarrinho } from '../@types/database';
import { formatBRL, formatOrderNumber, formatPhoneNumber, cleanPhoneForWhatsApp } from './formatters';

export interface WhatsAppMessageParams {
  numeroPedido: number;
  nomePastelaria: string;
  whatsappLoja: string;
  clienteNome: string;
  clienteTelefone: string;
  tipo: 'retirada' | 'entrega';
  distanciaKm?: number | null;
  endereco?: string | null;
  itens: ItemCarrinho[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  formaPagamento: string;
  trocoPara?: number | null;
  observacoesGerais?: string | null;
}

export function buildWhatsAppMessage(params: WhatsAppMessageParams): string {
  const lines: string[] = [];

  // Cabeçalho
  lines.push(`🥟 *PEDIDO ${formatOrderNumber(params.numeroPedido)}* — ${params.nomePastelaria}`);
  lines.push(`Cliente: ${params.clienteNome}`);
  lines.push(`Telefone: ${formatPhoneNumber(params.clienteTelefone)}`);

  // Tipo e Endereço
  if (params.tipo === 'entrega') {
    const distText = params.distanciaKm ? ` (${params.distanciaKm.toString().replace('.', ',')} km)` : '';
    lines.push(`Tipo: Entrega${distText}`);
    lines.push(`Endereço: ${params.endereco || 'A combinar'}`);
  } else {
    lines.push(`Tipo: Retirada no balcão`);
  }

  lines.push('');
  lines.push('Itens:');

  params.itens.forEach((item) => {
    // Monta o nome do item com adicionais se houver
    const opcionaisStr = item.opcionais.length > 0
      ? ` + ${item.opcionais.map((o) => o.nome).join(' + ')}`
      : '';
    
    lines.push(`${item.quantidade}x ${item.produto.nome}${opcionaisStr} — ${formatBRL(item.precoTotal)}`);

    if (item.observacao && item.observacao.trim() !== '') {
      lines.push(`   • Obs.: ${item.observacao.trim()}`);
    }
  });

  lines.push('');
  lines.push(`Subtotal: ${formatBRL(params.subtotal)}`);

  if (params.tipo === 'entrega') {
    lines.push(`Entrega: ${formatBRL(params.taxaEntrega)}`);
  }

  lines.push(`*Total: ${formatBRL(params.total)}*`);

  // Pagamento
  let pagamentoStr = '';
  switch (params.formaPagamento) {
    case 'link_whatsapp':
      pagamentoStr = 'Link de pagamento (enviar na conversa)';
      break;
    case 'pix':
      pagamentoStr = 'Pix (pagar na entrega/retirada)';
      break;
    case 'dinheiro':
      if (params.trocoPara && params.trocoPara > 0) {
        pagamentoStr = `Dinheiro (Troco para ${formatBRL(params.trocoPara)})`;
      } else {
        pagamentoStr = 'Dinheiro (Sem troco)';
      }
      break;
    case 'cartao_credito':
      pagamentoStr = 'Cartão de Crédito (levar maquininha)';
      break;
    case 'cartao_debito':
      pagamentoStr = 'Cartão de Débito (levar maquininha)';
      break;
    default:
      pagamentoStr = params.formaPagamento;
  }
  lines.push(`Pagamento: ${pagamentoStr}`);

  if (params.observacoesGerais && params.observacoesGerais.trim() !== '') {
    lines.push(`Observações: ${params.observacoesGerais.trim()}`);
  }

  return lines.join('\n');
}

export function getWhatsAppOrderUrl(whatsappLoja: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(whatsappLoja);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
