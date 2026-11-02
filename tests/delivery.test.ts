import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceKm, matchDeliveryFee } from '../src/lib/distance';
import { FaixaEntrega } from '../src/@types/database';

describe('Cálculo de Entrega por Distância', () => {
  const faixasPadrao: FaixaEntrega[] = [
    { id: '1', km_ate: 2.0, valor: 5.0, ativo: true },
    { id: '2', km_ate: 4.0, valor: 8.0, ativo: true },
    { id: '3', km_ate: 7.0, valor: 12.0, ativo: true },
  ];

  it('deve aplicar a primeira faixa para distâncias curtas (ex: 1.5 km -> R$ 5,00)', () => {
    const res = matchDeliveryFee(1.5, faixasPadrao);
    expect(res.entregavel).toBe(true);
    expect(res.taxa).toBe(5.0);
  });

  it('deve aplicar a segunda faixa para distâncias intermediárias (ex: 3.2 km -> R$ 8,00)', () => {
    const res = matchDeliveryFee(3.2, faixasPadrao);
    expect(res.entregavel).toBe(true);
    expect(res.taxa).toBe(8.0);
  });

  it('deve rejeitar entregas que ultrapassem a maior faixa cadastrada (ex: 8.5 km)', () => {
    const res = matchDeliveryFee(8.5, faixasPadrao);
    expect(res.entregavel).toBe(false);
    expect(res.maxKm).toBe(7.0);
  });

  it('deve calcular distância coerente usando coordenadas Haversine', () => {
    // Ponto 1: Marco Zero SP (-23.550520, -46.633308)
    // Ponto 2: Avenida Paulista (-23.561414, -46.655881) (~2.5 a 3.5 km com fator urbano)
    const dist = calculateHaversineDistanceKm(-23.55052, -46.633308, -23.561414, -46.655881);
    expect(dist).toBeGreaterThan(2.0);
    expect(dist).toBeLessThan(4.5);
  });
});
