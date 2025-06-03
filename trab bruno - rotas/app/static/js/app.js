
document.addEventListener('DOMContentLoaded', () => {
  const btnCalcular     = document.getElementById('btnCalcular');
  const textareaInput   = document.getElementById('jsonInput');
  const erroDiv         = document.getElementById('erro');
  const resultadoDiv    = document.getElementById('resultado');

  const rotaSemOptElem  = document.getElementById('rotaSemOpt');
  const distSemOptElem  = document.getElementById('distSemOpt');
  const rotaOtimElem    = document.getElementById('rotaOtimizada');
  const distOtimElem    = document.getElementById('distOtim');

  let mapaLeaflet = null;
  let camadaRota  = null;

  btnCalcular.addEventListener('click', async () => {
    erroDiv.textContent = '';
    resultadoDiv.style.display = 'none';
    rotaSemOptElem.textContent = '';
    distSemOptElem.textContent = '';
    rotaOtimElem.textContent = '';
    distOtimElem.textContent = '';

    if (camadaRota) {
      camadaRota.remove();
      camadaRota = null;
    }

    let payload;
    try {
      payload = JSON.parse(textareaInput.value);
    } catch (e) {
      erroDiv.textContent = 'JSON inválido. Verifique a formatação e tente novamente.';
      return;
    }

    if (!payload.coordenadas || !Array.isArray(payload.coordenadas) || payload.coordenadas.length < 2) {
      erroDiv.textContent = 'O JSON precisa conter a chave "coordenadas" com pelo menos 2 pontos.';
      return;
    }

    try {
      const response = await fetch('/calcular_rota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const erroJSON = await response.json();
        throw new Error(erroJSON.error || 'Erro desconhecido no servidor');
      }

      const data = await response.json();

      rotaSemOptElem.textContent = JSON.stringify(data.rota_sem_otimizacao, null, 2);
      distSemOptElem.textContent = data.distancia_total_sem_otimizacao.toFixed(2);
      rotaOtimElem.textContent = JSON.stringify(data.rota_otimizada, null, 2);
      distOtimElem.textContent = data.distancia_total_otimizada.toFixed(2);

      resultadoDiv.style.display = 'block';

      if (!mapaLeaflet) {
        const primeiraCoord = data.rota_otimizada[0]; // [lat, lon]
        mapaLeaflet = L.map('map').setView(primeiraCoord, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapaLeaflet);
      }

      const coordsLeaflet = data.rota_otimizada.map(c => [c[0], c[1]]);
      camadaRota = L.polyline(coordsLeaflet, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(mapaLeaflet);
      mapaLeaflet.fitBounds(camadaRota.getBounds(), { padding: [20, 20] });

      const inicio = data.rota_otimizada[0];
      const fim    = data.rota_otimizada[data.rota_otimizada.length - 1];
      L.marker(inicio).addTo(mapaLeaflet).bindPopup('Início').openPopup();
      L.marker(fim).addTo(mapaLeaflet).bindPopup('Fim');
    } catch (e) {
      erroDiv.textContent = 'Erro: ' + e.message;
    }
  });
});
