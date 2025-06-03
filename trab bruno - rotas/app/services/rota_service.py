from geopy.distance import geodesic

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

def calcular_rota_otimizada(coordenadas):
    return encontrar_rota_vizinho_mais_proximo(coordenadas)
