// Utilitários de Cálculo Geográfico e Faixas de Entrega
import { FaixaEntrega } from '../@types/database';

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDistance = R * c;

  // Multiplicador estimado de rotas urbanas (+25% sobre a linha reta)
  const adjusted = rawDistance * 1.25;
  return Math.round(adjusted * 10) / 10;
}

export function matchDeliveryFee(
  distanceKm: number,
  faixas: FaixaEntrega[]
): { entregavel: boolean; taxa: number; maxKm: number } {
  const activeFaixas = faixas
    .filter((f) => f.ativo)
    .sort((a, b) => a.km_ate - b.km_ate);

  if (activeFaixas.length === 0) {
    return { entregavel: false, taxa: 0, maxKm: 0 };
  }

  const maxKm = activeFaixas[activeFaixas.length - 1].km_ate;
  const match = activeFaixas.find((f) => distanceKm <= f.km_ate);

  if (!match) {
    return { entregavel: false, taxa: 0, maxKm };
  }

  return { entregavel: true, taxa: Number(match.valor), maxKm };
}
