const apiKey = '5b3ce3597851110001cf6248bb53f01c97f740689fd72f394157dd07';

const pontos = [
  [-26.176944, -50.390833],
  [-26.177222, -50.391944],
  [-26.183500, -50.388000],
  [-26.2275, -51.0875],
  [-26.183500, -50.388000],
  [-26.177222, -50.391944],
  [-26.176944, -50.390833]
];

let mapa = L.map('map').setView(pontos[0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(mapa);

let marcadorInicio, marcadorFim, rotaLinha;
let indiceAtual = 0;

async function desenharRota(origem, destino) {
  if (marcadorInicio) mapa.removeLayer(marcadorInicio);
  if (marcadorFim) mapa.removeLayer(marcadorFim);
  if (rotaLinha) mapa.removeLayer(rotaLinha);

  marcadorInicio = L.marker(origem).addTo(mapa).bindPopup("Início").openPopup();
  marcadorFim = L.marker(destino).addTo(mapa).bindPopup("Destino");

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [
          [origem[1], origem[0]],
          [destino[1], destino[0]]
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status}`);
    }

    const data = await response.json();

    const coordsRota = data.features[0].geometry.coordinates.map(c => [c[1], c[0]]);
    rotaLinha = L.polyline(coordsRota, { color: 'blue' }).addTo(mapa);
    mapa.fitBounds(rotaLinha.getBounds());

  } catch (error) {
    alert('Erro ao carregar rota: ' + error.message);
    console.error(error);
  }
}

function iniciarRota() {
  indiceAtual = 0;
  if (pontos.length > 1) {
    desenharRota(pontos[indiceAtual], pontos[indiceAtual + 1]);
  }
}

function proximaRota() {
  if (indiceAtual < pontos.length - 2) {
    indiceAtual++;
    desenharRota(pontos[indiceAtual], pontos[indiceAtual + 1]);
  } else {
    alert("Último trecho da rota.");
  }
}

function anteriorRota() {
  if (indiceAtual > 0) {
    indiceAtual--;
    desenharRota(pontos[indiceAtual], pontos[indiceAtual + 1]);
  } else {
    alert("Primeiro trecho da rota.");
  }
}
