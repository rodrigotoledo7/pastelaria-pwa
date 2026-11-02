// Supabase Edge Function: calculate-delivery
// Deno runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeliveryRequest {
  lat: number;
  lng: number;
  address?: string;
}

// Cálculo Haversine em Km (Linha Reta / Fallback)
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;
  // Multiplicador estimado de tráfego/ruas urbanas (+25%) para linha reta
  return Math.round(straightDistance * 1.25 * 10) / 10;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lat, lng } = (await req.json()) as DeliveryRequest;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "Coordenadas lat e lng são obrigatórias." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Busca coordenadas da loja
    const { data: config, error: configError } = await supabase
      .from("configuracoes")
      .select("lat_loja, lng_loja, nome_loja, loja_aberta")
      .eq("id", 1)
      .single();

    if (configError || !config) {
      throw new Error("Não foi possível carregar as configurações da pastelaria.");
    }

    // 2. Cálculo da distância
    let distanceKm = 0;
    const orsApiKey = Deno.env.get("OPENROUTESERVICE_API_KEY");

    if (orsApiKey) {
      try {
        // Tenta API de rotas
        const routeRes = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${orsApiKey}&start=${config.lng_loja},${config.lat_loja}&end=${lng},${lat}`
        );
        if (routeRes.ok) {
          const routeData = await routeRes.json();
          const meters = routeData.features?.[0]?.properties?.summary?.distance;
          if (meters) {
            distanceKm = Math.round((meters / 1000) * 10) / 10;
          }
        }
      } catch (err) {
        console.warn("Fallback para Haversine devido a falha na rota externa:", err);
      }
    }

    // Fallback: Haversine caso não haja chave ou a API falhe
    if (distanceKm === 0) {
      distanceKm = calculateHaversineKm(config.lat_loja, config.lng_loja, lat, lng);
    }

    // 3. Busca faixas de entrega ativas
    const { data: faixas, error: faixasError } = await supabase
      .from("faixas_entrega")
      .select("km_ate, valor")
      .eq("ativo", true)
      .order("km_ate", { ascending: true });

    if (faixasError || !faixas || faixas.length === 0) {
      throw new Error("Nenhuma faixa de entrega configurada.");
    }

    const matchedTier = faixas.find((f: { km_ate: number; valor: number }) => distanceKm <= f.km_ate);

    if (!matchedTier) {
      const maxDistance = faixas[faixas.length - 1].km_ate;
      return new Response(
        JSON.stringify({
          entregavel: false,
          distancia_km: distanceKm,
          taxa_entrega: 0,
          mensagem: `Endereço fora da nossa área de entrega (máximo ${maxDistance} km). Que tal retirar no balcão?`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        entregavel: true,
        distancia_km: distanceKm,
        taxa_entrega: Number(matchedTier.valor),
        mensagem: `Taxa calculada para ${distanceKm} km.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
