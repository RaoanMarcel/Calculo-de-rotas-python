from flask import Flask, request, jsonify, render_template
from geopy.distance import geodesic

app = Flask(__name__)

def calcular_distancia(p1, p2):
    return geodesic(p1, p2).kilometers

def encontrar_rota_vizinho_mais_proximo(pontos):
    n = len(pontos)
    nao_visitados = set(range(1, n))
    rota = [0]

    while nao_visitados:
        ultimo_ponto = rota[-1]
        proximo_ponto = min(nao_visitados, key=lambda i: calcular_distancia(pontos[ultimo_ponto], pontos[i]))
        rota.append(proximo_ponto)
        nao_visitados.remove(proximo_ponto)

    rota.append(0)
    distancia_total = sum(calcular_distancia(pontos[rota[i]], pontos[rota[i+1]]) for i in range(n))

    return [pontos[i] for i in rota], distancia_total

@app.route('/')
def index():
    return render_template('index.html')  # Agora o HTML vem do Flask

@app.route('/calcular_rota', methods=['POST'])
def calcular_rota():
    data = request.get_json()

    if 'coordenadas' not in data:
        return jsonify({'error': 'Coordenadas não fornecidas'}), 400

    coordenadas = data['coordenadas']

    if len(coordenadas) < 2:
        return jsonify({'error': 'Pelo menos duas coordenadas são necessárias'}), 400

    distancia_sem_otimizacao = sum(calcular_distancia(coordenadas[i], coordenadas[i+1]) for i in range(len(coordenadas)-1))
    distancia_sem_otimizacao += calcular_distancia(coordenadas[-1], coordenadas[0])

    rota_otimizada, distancia = encontrar_rota_vizinho_mais_proximo(coordenadas)

    return jsonify({
        'rota_sem_otimizacao': coordenadas,
        'distancia_total_sem_otimizacao': round(distancia_sem_otimizacao, 2),
        'rota_otimizada': rota_otimizada,
        'distancia_total_otimizada': round(distancia, 2)
    })

if __name__ == '__main__':
    app.run(debug=True)
