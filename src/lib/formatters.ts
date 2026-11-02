// Utilitários de Formatação para Pastelaria PWA

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(valor)
    .replace(/\u00A0/g, ' ');
}

export function formatPhoneNumber(telefone: string): string {
  const clean = telefone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return telefone;
}

export function cleanPhoneForWhatsApp(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  // Adiciona 55 se o usuário digitou sem o DDI do Brasil
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function formatOrderNumber(numero: number): string {
  return `#${numero.toString().padStart(4, '0')}`;
}

export function formatPaymentMethod(method: string, trocoPara?: number | null): string {
  switch (method) {
    case 'dinheiro':
      if (trocoPara && trocoPara > 0) {
        return `Dinheiro (Troco para ${formatBRL(trocoPara)})`;
      }
      return 'Dinheiro (Sem troco)';
    case 'pix':
      return 'Pix (Pagar na entrega/retirada)';
    case 'cartao_credito':
      return 'Cartão de Crédito (Máquina)';
    case 'cartao_debito':
      return 'Cartão de Débito (Máquina)';
    case 'link_whatsapp':
      return 'Link de pagamento (enviar na conversa)';
    default:
      return method;
  }
}

export function formatStatusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'novo':
      return { label: 'Novo Pedido', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'em_preparo':
      return { label: 'Em Preparo 🍳', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'pronto':
      return { label: 'Pronto / Embalado ✅', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'saiu_para_entrega':
      return { label: 'Saiu para Entrega 🛵', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    case 'entregue':
      return { label: 'Entregue / Concluído 🎉', color: 'bg-green-100 text-green-800 border-green-300' };
    case 'cancelado':
      return { label: 'Cancelado ❌', color: 'bg-red-100 text-red-800 border-red-300' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  }
}
