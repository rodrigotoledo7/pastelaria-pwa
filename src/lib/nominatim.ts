// Serviço de Autocomplete e Geocodificação OpenStreetMap (Nominatim gratuito)

export interface AddressSuggestion {
  displayName: string;
  road?: string;
  suburb?: string;
  city?: string;
  lat: number;
  lng: number;
}

export async function searchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const encoded = encodeURIComponent(`${query.trim()}, Brasil`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=br&addressdetails=1&limit=5`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((item: any) => ({
      displayName: item.display_name,
      road: item.address?.road || item.address?.street,
      suburb: item.address?.suburb || item.address?.neighbourhood,
      city: item.address?.city || item.address?.town,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    console.warn('Erro ao consultar Nominatim:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    if (!addr) return data.display_name;

    const parts = [
      addr.road || addr.street,
      addr.house_number ? `nº ${addr.house_number}` : '',
      addr.suburb || addr.neighbourhood,
      addr.city || addr.town,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : data.display_name;
  } catch {
    return null;
  }
}
