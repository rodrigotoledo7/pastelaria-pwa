import React, { useState, useEffect } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { calculateHaversineDistanceKm, matchDeliveryFee } from '../../lib/distance';
import { searchAddressSuggestions, reverseGeocode, AddressSuggestion } from '../../lib/nominatim';
import { formatBRL } from '../../lib/formatters';
import { MapPin, Navigation, Bike, Store, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DeliveryAddressFormProps {
  tipo: 'retirada' | 'entrega';
  onChangeTipo: (tipo: 'retirada' | 'entrega') => void;
  endereco: string;
  onChangeEndereco: (end: string) => void;
  lat: number | null;
  lng: number | null;
  onChangeCoords: (lat: number | null, lng: number | null, distancia: number | null, taxa: number) => void;
  distanciaKm: number | null;
  taxaEntrega: number;
  isDeliverable: boolean;
  setIsDeliverable: (deliverable: boolean) => void;
}

export const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  tipo,
  onChangeTipo,
  endereco,
  onChangeEndereco,
  lat,
  lng,
  onChangeCoords,
  distanciaKm,
  taxaEntrega,
  isDeliverable,
  setIsDeliverable,
}) => {
  const { config, faixasEntrega } = useStore();
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [addressInput, setAddressInput] = useState(endereco);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sincroniza input com prop
  useEffect(() => {
    setAddressInput(endereco);
  }, [endereco]);

  // Busca sugestões quando o usuário digita
  useEffect(() => {
    if (tipo !== 'entrega') return;
    if (addressInput.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingSuggestions(true);
      const res = await searchAddressSuggestions(addressInput);
      setSuggestions(res);
      setSearchingSuggestions(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [addressInput, tipo]);

  // Recalcula taxa sempre que as coordenadas mudam
  const updateDeliveryCalculations = (newLat: number, newLng: number) => {
    const dist = calculateHaversineDistanceKm(
      config.lat_loja,
      config.lng_loja,
      newLat,
      newLng
    );

    const { entregavel, taxa, maxKm } = matchDeliveryFee(dist, faixasEntrega);

    setIsDeliverable(entregavel);
    onChangeCoords(newLat, newLng, dist, taxa);

    if (entregavel) {
      setStatusMessage(`Distância: ${dist.toString().replace('.', ',')} km até a pastelaria.`);
    } else {
      setStatusMessage(`Endereço a ${dist.toString().replace('.', ',')} km (máximo atendido: ${maxKm} km). Que tal optar por Retirada?`);
    }
  };

  // Geolocalização pelo GPS do dispositivo
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setSearchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;

        const street = await reverseGeocode(currentLat, currentLng);
        const resolvedAddress = street || `Localização GPS (${currentLat.toFixed(5)}, ${currentLng.toFixed(5)})`;

        setAddressInput(resolvedAddress);
        onChangeEndereco(resolvedAddress);
        updateDeliveryCalculations(currentLat, currentLng);
        setSearchingLocation(false);
        setSuggestions([]);
      },
      (err) => {
        console.warn('Erro ao obter localização:', err);
        alert('Não foi possível obter sua localização. Por favor, digite o endereço manualmente.');
        setSearchingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const formatted = suggestion.displayName;
    setAddressInput(formatted);
    onChangeEndereco(formatted);
    setSuggestions([]);
    updateDeliveryCalculations(suggestion.lat, suggestion.lng);
  };

  return (
    <div className="space-y-4">
      {/* Seletor Tipo: Entrega ou Retirada */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Como deseja receber seu pedido?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onChangeTipo('entrega');
              if (lat && lng) {
                updateDeliveryCalculations(lat, lng);
              }
            }}
            className={`p-3 rounded-2xl border flex items-center justify-center space-x-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
              tipo === 'entrega'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-300'
                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-200'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Entrega em Casa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeTipo('retirada');
              setIsDeliverable(true);
              onChangeCoords(null, null, null, 0);
              setStatusMessage(null);
            }}
            className={`p-3 rounded-2xl border flex items-center justify-center space-x-2 font-bold text-xs sm:text-sm transition-all active:scale-95 ${
              tipo === 'retirada'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-300'
                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Retirar no Balcão</span>
          </button>
        </div>
      </div>

      {/* Seção de Endereço se for Entrega */}
      {tipo === 'entrega' && (
        <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Endereço de Entrega</span>
            </label>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={searchingLocation}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1 bg-amber-100 px-2 py-1 rounded-lg active:scale-95 transition-all"
            >
              {searchingLocation ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-700" />
              ) : (
                <Navigation className="w-3 h-3 text-amber-700" />
              )}
              <span>Usar minha localização</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => {
                setAddressInput(e.target.value);
                onChangeEndereco(e.target.value);
              }}
              placeholder="Digite sua rua, número, bairro..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
            />

            {searchingSuggestions && (
              <div className="absolute right-3 top-3.5">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              </div>
            )}

            {/* Lista suspensa de sugestões */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 divide-y divide-gray-100 overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left p-2.5 text-xs hover:bg-amber-50 transition-colors flex items-start space-x-2 text-gray-700"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{s.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resultado do Cálculo da Taxa */}
          {distanciaKm !== null && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                isDeliverable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isDeliverable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold">
                    {isDeliverable ? 'Entrega disponível!' : 'Fora da área de entrega'}
                  </p>
                  <p className="text-[11px] opacity-90">{statusMessage}</p>
                </div>
              </div>

              {isDeliverable && (
                <span className="text-sm font-black text-emerald-700">
                  {formatBRL(taxaEntrega)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {tipo === 'retirada' && (
        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
          <Store className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Retirada grátis no balcão da pastelaria:</p>
            <p className="text-gray-700 mt-0.5">{config.endereco_loja}</p>
            <p className="text-emerald-700 font-semibold mt-1">
              ✨ Seu pedido fica pronto quentinho em cerca de 15 a 25 minutos!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
