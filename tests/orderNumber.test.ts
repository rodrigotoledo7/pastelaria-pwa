import { describe, it, expect } from 'vitest';
import { formatOrderNumber } from '../src/lib/formatters';

describe('Geração e Formatação do Número do Pedido', () => {
  it('deve formatar números menores que 10 com 4 dígitos padronizados (#0001)', () => {
    expect(formatOrderNumber(1)).toBe('#0001');
    expect(formatOrderNumber(7)).toBe('#0007');
  });

  it('deve formatar número 42 exatamente como o exemplo da especificação (#0042)', () => {
    expect(formatOrderNumber(42)).toBe('#0042');
  });

  it('deve formatar números de 3 e 4 dígitos corretamente', () => {
    expect(formatOrderNumber(150)).toBe('#0150');
    expect(formatOrderNumber(1250)).toBe('#1250');
  });

  it('deve simular incremento sequencial diário do dia', () => {
    const pedidosHoje = [
      { numero: 1, data: '2026-11-01' },
      { numero: 2, data: '2026-11-01' },
      { numero: 3, data: '2026-11-01' },
    ];

    const maxNumero = pedidosHoje.reduce((max, p) => Math.max(max, p.numero), 0);
    const proximoNumero = maxNumero + 1;

    expect(proximoNumero).toBe(4);
    expect(formatOrderNumber(proximoNumero)).toBe('#0004');
  });

  it('deve reiniciar para 1 quando o dia for novo e não houver pedidos na data', () => {
    const pedidosOntem = [
      { numero: 58, data: '2026-10-31' },
      { numero: 59, data: '2026-10-31' },
    ];

    const hoje = '2026-11-01';
    const pedidosHoje = pedidosOntem.filter((p) => p.data === hoje);
    const proximoNumero = pedidosHoje.length > 0
      ? pedidosHoje.reduce((max, p) => Math.max(max, p.numero), 0) + 1
      : 1;

    expect(proximoNumero).toBe(1);
    expect(formatOrderNumber(proximoNumero)).toBe('#0001');
  });
});
