from flask import Blueprint, render_template, request, jsonify
from .services.rota_service import calcular_rota_otimizada

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """
    Renderiza o template index.html, que contém o formulário para o usuário
    colar o JSON de coordenadas e o botão para calcular a rota.
    """
    return render_template('index.html')


@main_bp.route('/calcular_rota', methods=['POST'])
def calcular_rota():
    """
    Recebe JSON no formato:
    {
      "coordenadas": [
        [lat1, lon1],
        [lat2, lon2],
        ...
      ]
    }
    —> Retorna um JSON com:
    {
      "rota_sem_otimizacao": [...],
      "distancia_total_sem_otimizacao": x.xx,
      "rota_otimizada": [...],
      "distancia_total_otimizada": y.yy
    }
    """
    data = request.get_json()

    # Validações básicas
    if data is None or 'coordenadas' not in data:
        return jsonify({'error': 'Coordenadas não fornecidas'}), 400

    coordenadas = data['coordenadas']
    if not isinstance(coordenadas, list) or len(coordenadas) < 2:
        return jsonify({'error': 'Pelo menos duas coordenadas são necessárias'}), 400

    # Invoca o serviço que faz o cálculo de rota otimizada
    rota_sem_otim, dist_sem_otim, rota_otimizada, dist_otimizada = calcular_rota_otimizada(coordenadas)

    return jsonify({
        'rota_sem_otimizacao': rota_sem_otim,
        'distancia_total_sem_otimizacao': round(dist_sem_otim, 2),
        'rota_otimizada': rota_otimizada,
        'distancia_total_otimizada': round(dist_otimizada, 2)
    })
