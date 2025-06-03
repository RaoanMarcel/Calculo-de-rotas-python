// static/js/app.js

document.addEventListener("DOMContentLoaded", () => {
  const btnCalcular   = document.getElementById("btnCalcular");
  const textareaInput = document.getElementById("jsonInput");
  const erroDiv       = document.getElementById("erro");
  const resultadoDiv  = document.getElementById("resultado");

  const rotaSemOptElem = document.getElementById("rotaSemOpt");
  const distSemOptElem = document.getElementById("distSemOpt");
  const rotaOtimElem   = document.getElementById("rotaOtimizada");
  const distOtimElem   = document.getElementById("distOtim");

  const btnAnterior   = document.getElementById("btnAnterior");
  const btnProximo    = document.getElementById("btnProximo");

  // Leaflet
  let mapaLeaflet    = null;
  let camadaRota     = null;
  let marcadorInicio = null; // <--- marcador para o primeiro ponto

  // Rota otimizada do backend: array de [lat, lon]
  let rotaPontos = [];
  let indiceAtual = 0;

  // Sua chave do OpenRouteService
  const ORS_API_KEY = "5b3ce3597851110001cf6248bb53f01c97f740689fd72f394157dd07";

  // ---- 1) Botão “Calcular Rota” ----
  btnCalcular.addEventListener("click", async () => {
    // Limpa mensagens e oculta resultado
    erroDiv.textContent = "";
    resultadoDiv.style.display = "none";

    // Limpa textos anteriores
    rotaSemOptElem.textContent = "";
    distSemOptElem.textContent = "";
    rotaOtimElem.textContent   = "";
    distOtimElem.textContent   = "";

    // Remove camada de rota antiga
    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }
    // Remove marcador inicial antigo
    if (marcadorInicio) {
      marcadorInicio.remove();
      marcadorInicio = null;
    }

    // Reseta controle de rota
    rotaPontos = [];
    indiceAtual = 0;
    btnAnterior.disabled = true;
    btnProximo.disabled  = true;

    // 1.1) Parseia JSON do textarea
    let payload;
    try {
      payload = JSON.parse(textareaInput.value);
    } catch (e) {
      erroDiv.textContent = "JSON inválido. Verifique a formatação e tente novamente.";
      return;
    }

    // 1.2) Validação de coordenadas
    if (
      !payload.coordenadas ||
      !Array.isArray(payload.coordenadas) ||
      payload.coordenadas.length < 2
    ) {
      erroDiv.textContent = 'O JSON precisa conter a chave "coordenadas" com pelo menos 2 pontos.';
      return;
    }

    // 1.3) Fetch ao backend Flask
    let data;
    try {
      const response = await fetch("/calcular_rota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const erroJSON = await response.json();
        throw new Error(erroJSON.error || "Erro desconhecido no servidor");
      }
      data = await response.json();
    } catch (err) {
      erroDiv.textContent = "Erro: " + err.message;
      return;
    }

    // 1.4) Exibe textos de rota e distâncias
    rotaSemOptElem.textContent = JSON.stringify(data.rota_sem_otimizacao, null, 2);
    distSemOptElem.textContent = data.distancia_total_sem_otimizacao.toFixed(2);
    rotaOtimElem.textContent   = JSON.stringify(data.rota_otimizada, null, 2);
    distOtimElem.textContent   = data.distancia_total_otimizada.toFixed(2);

    resultadoDiv.style.display = "block"; // agora mostra a div de resultados

    // 1.5) Guarda rota otimizada
    rotaPontos = data.rota_otimizada;

    // 1.6) Inicializa o Leaflet se não existir
    if (!mapaLeaflet) {
      const primeira = rotaPontos[0]; // [lat, lon]
      mapaLeaflet = L.map("map").setView(primeira, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapaLeaflet);
    }

    // 1.7) Adiciona marcador no primeiro ponto (sempre que calcular rota)
    const primeira = rotaPontos[0];
    marcadorInicio = L.marker(primeira)
      .addTo(mapaLeaflet)
      .bindPopup("Início")
      .openPopup();

    // 1.8) Desenha o primeiro segmento (índiceAtual = 0)
    await desenharSegmentoORS(0);

    // 1.9) Ajusta botões
    btnAnterior.disabled = true;
    btnProximo.disabled  = rotaPontos.length - 1 <= 0;
  });

  // ---- 2) Botão “Próximo” ----
  btnProximo.addEventListener("click", async () => {
    if (indiceAtual >= rotaPontos.length - 2) return;

    // Remove polyline antiga
    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }

    // Avança o índice e desenha próximo segmento
    indiceAtual++;
    await desenharSegmentoORS(indiceAtual);

    // Ajusta botões
    btnAnterior.disabled = false;
    btnProximo.disabled  = indiceAtual >= rotaPontos.length - 2;
  });

  // ---- 3) Botão “Anterior” ----
  btnAnterior.addEventListener("click", async () => {
    if (indiceAtual <= 0) return;

    // Remove polyline antiga
    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }

    // Volta o índice e desenha segmento
    indiceAtual--;
    await desenharSegmentoORS(indiceAtual);

    // Ajusta botões
    btnAnterior.disabled = indiceAtual <= 0;
    btnProximo.disabled  = false;
  });

  /**
   * Desenha o segmento idx → idx+1 usando ORS e adiciona ao mapa.
   * @param {number} idx Índice do ponto de partida
   */
  async function desenharSegmentoORS(idx) {
    const origem  = rotaPontos[idx];     // [lat, lon]
    const destino = rotaPontos[idx + 1]; // [lat, lon]

    // Converte para [lon, lat] que o ORS espera
    const coordsORS = [
      [origem[1], origem[0]],
      [destino[1], destino[0]],
    ];

    try {
      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ coordinates: coordsORS }),
        }
      );
      if (!response.ok) {
        throw new Error("ORS retornou status " + response.status);
      }
      const geojson = await response.json();

      // Extrai [lon, lat] → converte para [lat, lon]
      const coordsRota = geojson.features[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      // Desenha a polyline do segmento
      camadaRota = L.polyline(coordsRota, {
        color: "blue",
        weight: 5,
        opacity: 0.7,
      }).addTo(mapaLeaflet);

      // Ajusta o mapa para mostrar este trecho
      mapaLeaflet.fitBounds(camadaRota.getBounds(), { padding: [20, 20] });
    } catch (err) {
      console.error("Erro ao desenhar trecho ORS:", err);
      alert("Erro ao obter trecho da rota: " + err.message);
    }
  }
});
