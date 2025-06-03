from geopy.distance import geodesic

def calcular_distancia(p1, p2):
    """
    Retorna a distância geodésica (em quilômetros) entre p1 e p2,
    onde p1 e p2 são tuplas/arrays [lat, lon].
    """
    return geodesic(p1, p2).kilometers

def encontrar_rota_vizinho_mais_proximo(pontos):
    """
    Aplica o algoritmo do Vizinho Mais Próximo (Nearest Neighbor) para TSP:
    - pontos: lista de [lat, lon] (por exemplo, [[-23.55052, -46.633308], ...])
    - retorna: (rota_otimizada, distancia_total_otimizada),
      onde rota_otimizada é a lista de pontos visitados em ordem, incluindo o retorno ao início,
      e distancia_total_otimizada é a soma das distâncias em km.
    """
    n = len(pontos)
    if n == 0:
        return [], 0.0

    nao_visitados = set(range(1, n))
    rota_indices = [0]  # sempre começamos pelo índice 0
    while nao_visitados:
        ultimo = rota_indices[-1]
        proximo = min(
            nao_visitados,
            key=lambda i: calcular_distancia(pontos[ultimo], pontos[i])
        )
        rota_indices.append(proximo)
        nao_visitados.remove(proximo)

    rota_indices.append(0)

    distancia_total = 0.0
    for i in range(len(rota_indices) - 1):
        a = pontos[rota_indices[i]]
        b = pontos[rota_indices[i + 1]]
        distancia_total += calcular_distancia(a, b)

    rota_otimizada = [pontos[i] for i in rota_indices]
    return rota_otimizada, distancia_total

def calcular_rota_otimizada(coordenadas):
    """
    Função principal chamada pela rota Flask:
    1) Recebe `coordenadas` no formato [[lat, lon], [lat, lon], ...]
    2) Calcula a distância “sem otimização” (somando seqüencialmente e voltando ao início)
    3) Aplica o NN (Nearest Neighbor) para obter rota e distância “otimizadas”
    4) Retorna: 
       rota_sem_otimizacao, distancia_sem_otimizacao, 
       rota_otimizada, distancia_otimizada
    """
    rota_sem_otim = coordenadas[:] + [coordenadas[0]] 
    distancia_sem_otim = 0.0
    for i in range(len(rota_sem_otim) - 1):
        distancia_sem_otim += calcular_distancia(rota_sem_otim[i], rota_sem_otim[i + 1])

    rota_otimizada, distancia_otimizada = encontrar_rota_vizinho_mais_proximo(coordenadas)

    return rota_sem_otim, distancia_sem_otim, rota_otimizada, distancia_otimizada
