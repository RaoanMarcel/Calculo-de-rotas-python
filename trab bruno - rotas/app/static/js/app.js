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

  let mapaLeaflet    = null;
  let camadaRota     = null;
  let marcadorInicio = null; 
  let marcadorIniSeg  = null; 
  let marcadorFimSeg  = null; 

  let rotaPontos = [];
  let indiceAtual = 0; 

  const ORS_API_KEY = "5b3ce3597851110001cf6248bb53f01c97f740689fd72f394157dd07";

  btnCalcular.addEventListener("click", async () => {
    erroDiv.textContent = "";
    resultadoDiv.style.display = "none";

    rotaSemOptElem.textContent = "";
    distSemOptElem.textContent = "";
    rotaOtimElem.textContent   = "";
    distOtimElem.textContent   = "";

    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }
    if (marcadorInicio) {
      marcadorInicio.remove();
      marcadorInicio = null;
    }
    if (marcadorIniSeg) {
      marcadorIniSeg.remove();
      marcadorIniSeg = null;
    }
    if (marcadorFimSeg) {
      marcadorFimSeg.remove();
      marcadorFimSeg = null;
    }

    rotaPontos = [];
    indiceAtual = 0;
    btnAnterior.disabled = true;
    btnProximo.disabled  = true;

    let payload;
    try {
      payload = JSON.parse(textareaInput.value);
    } catch (e) {
      erroDiv.textContent = "JSON inválido. Verifique a formatação e tente novamente.";
      return;
    }

    if (
      !payload.coordenadas ||
      !Array.isArray(payload.coordenadas) ||
      payload.coordenadas.length < 2
    ) {
      erroDiv.textContent = 'O JSON precisa conter a chave "coordenadas" com pelo menos 2 pontos.';
      return;
    }

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

    rotaSemOptElem.textContent = JSON.stringify(data.rota_sem_otimizacao, null, 2);
    distSemOptElem.textContent = data.distancia_total_sem_otimizacao.toFixed(2);
    rotaOtimElem.textContent   = JSON.stringify(data.rota_otimizada, null, 2);
    distOtimElem.textContent   = data.distancia_total_otimizada.toFixed(2);

    resultadoDiv.style.display = "block"; 

    rotaPontos = data.rota_otimizada;

    if (!mapaLeaflet) {
      const primeira = rotaPontos[0]; 
      mapaLeaflet = L.map("map").setView(primeira, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapaLeaflet);
    }

    const primeira = rotaPontos[0];
    marcadorInicio = L.marker(primeira)
      .addTo(mapaLeaflet)
      .bindPopup("Ponto Inicial da Rota")
      .openPopup();

    await desenharSegmentoORS(0);

    btnAnterior.disabled = true;
    btnProximo.disabled  = rotaPontos.length - 1 <= 0;
  });

  btnProximo.addEventListener("click", async () => {
    if (indiceAtual >= rotaPontos.length - 2) return;

    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }
    if (marcadorIniSeg) {
      marcadorIniSeg.remove();
      marcadorIniSeg = null;
    }
    if (marcadorFimSeg) {
      marcadorFimSeg.remove();
      marcadorFimSeg = null;
    }

    indiceAtual++;
    await desenharSegmentoORS(indiceAtual);

    btnAnterior.disabled = false;
    btnProximo.disabled  = indiceAtual >= rotaPontos.length - 2;
  });

  btnAnterior.addEventListener("click", async () => {
    if (indiceAtual <= 0) return;

    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }
    if (marcadorIniSeg) {
      marcadorIniSeg.remove();
      marcadorIniSeg = null;
    }
    if (marcadorFimSeg) {
      marcadorFimSeg.remove();
      marcadorFimSeg = null;
    }

    indiceAtual--;
    await desenharSegmentoORS(indiceAtual);

    btnAnterior.disabled = indiceAtual <= 0;
    btnProximo.disabled  = false;
  });

  /**
   * Também coloca marcadores no início e no fim deste segmento.
   *
   * @param {number} idx 
   */
  async function desenharSegmentoORS(idx) {
    const origem  = rotaPontos[idx];     
    const destino = rotaPontos[idx + 1]; 

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

      const coordsRota = geojson.features[0].geometry.coordinates.map((c) => [
        c[1],
        c[0],
      ]);

      camadaRota = L.polyline(coordsRota, {
        color: "blue",
        weight: 5,
        opacity: 0.7,
      }).addTo(mapaLeaflet);

      marcadorIniSeg = L.marker(origem)
        .addTo(mapaLeaflet)
        .bindPopup("Início do Segmento")
        .openPopup();

      marcadorFimSeg = L.marker(destino)
        .addTo(mapaLeaflet)
        .bindPopup("Fim do Segmento");

      mapaLeaflet.fitBounds(camadaRota.getBounds(), { padding: [20, 20] });
    } catch (err) {
      console.error("Erro ao desenhar trecho ORS:", err);
      alert("Erro ao obter trecho da rota: " + err.message);
    }
  }
});
