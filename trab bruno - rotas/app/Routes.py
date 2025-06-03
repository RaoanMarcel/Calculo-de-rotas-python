from flask import render_template, request, jsonify, current_app as app
from .services.rota_service import calcular_rota_otimizada

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calcular_rota', methods=['POST'])
def calcular_rota():
    data = request.get_json()
    coordenadas = data.get('coordenadas', [])

    if len(coordenadas) < 2:
        return jsonify({'error': 'Pelo menos duas coordenadas são necessárias'}), 400

    rota_otimizada, distancia = calcular_rota_otimizada(coordenadas)

    return jsonify({
        'rota_otimizada': rota_otimizada,
        'distancia_total_otimizada': round(distancia, 2)
    })
