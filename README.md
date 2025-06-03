📍 Visão Geral

Este projeto implementa uma aplicação web de roteirização em Flask + Leaflet, que utiliza o algoritmo de Vizinho Mais Próximo para encontrar uma rota aproximada entre vários pontos e, em seguida, desenha cada segmento “pela rua” no mapa usando o OpenRouteService (ORS). Além disso, há botões “Anterior” e “Próximo” que permitem navegar por cada trecho individual da rota otimizada, exibindo marcadores de início e fim de segmento e destacando, de forma fixa, o ponto inicial absoluto da rota.
⚙️ Funcionalidades Principais

    Backend em Flask (Python)

        Recebe um JSON com coordenadas [[lat, lon], …].

        Calcula a rota sem otimização (ordem original + volta).

        Executa o Nearest Neighbor (Vizinho Mais Próximo) para gerar a rota otimizada e a distância total otimizada.

        Retorna JSON contendo:

            rota_sem_otimizacao

            distancia_total_sem_otimizacao

            rota_otimizada

            distancia_total_otimizada

    Front-end em HTML + CSS + JavaScript (Leaflet)

        Campo <textarea> para colar JSON de coordenadas.

        Botão “Calcular Rota”: dispara requisição ao Flask e exibe resultados.

        Área de resultado exibe:

            Rota e distância sem otimização (em <pre> e <span>).

            Rota e distância otimizada (em <pre> e <span>).

            Mapa Leaflet onde será desenhado cada trecho do segmento.

            Botões “Anterior” e “Próximo” para navegar entre segmentos individuais.

        Fluxo de visualização de um segmento por vez:

            Desenha somente o trecho entre ponto i → i+1.

            Insere três marcadores:

                Marcador fixo no primeiro ponto absoluto da rota otimizada (popup “Ponto Inicial da Rota”).

                Marcador de início do segmento (popup “Início do Segmento”).

                Marcador de fim do segmento (popup “Fim do Segmento”).

            Botões habilitam/desabilitam conforme posição no roteiro:

                btnAnterior desabilitado em índiceAtual = 0.

                btnProximo desabilitado em índiceAtual = rotaPontos.length - 2.

        A cada clique em “Anterior” ou “Próximo”, remove-se o polyline e os marcadores de segmento, desenha-se o novo segmento com ORS e reposiciona o mapa via map.fitBounds().

    Integração com OpenRouteService (ORS)

        Para cada par de pontos adjacentes, faz um POST a /v2/directions/driving-car/geojson, recebendo o polilinha “pela rua”.

        Converte coordenadas [lon, lat] ↔ [lat, lon] conforme necessário.

        Desenha cada segmento via L.polyline(coords, { color: "blue", weight: 5, opacity: 0.7 }).

📝 Pré-requisitos

    Python 3.8+

    Pip (gerenciador de pacotes Python)

    Conta gratuita no OpenRouteService para obter ORS_API_KEY

    (Opcional) Ambiente virtual (venv, virtualenv, etc.)

🚀 Instalação e Configuração

    Clone este repositório

git clone https://github.com/SEU_USUARIO/nome-do-projeto.git
cd nome-do-projeto

Crie e ative um ambiente virtual (recomendado)

python3 -m venv venv
source venv/bin/activate   # Linux / macOS
venv\Scripts\activate      # Windows

Instale as dependências

pip install -r requirements.txt

O requirements.txt deve incluir:

Flask==2.3.2
geopy==2.4.0
Flask-Cors==3.0.10

Obtenha a chave ORS

    Cadastre-se em https://openrouteservice.org/

    Crie uma nova chave (API Key) e copie o valor.

Configure sua ORS_API_KEY
No arquivo static/js/app.js, localize:

const ORS_API_KEY = "INSIRA_SUA_API_KEY_AQUI";

e substitua pelo valor da sua chave ORS.
Alternativamente, para não deixar diretamente no código, você pode criar um arquivo .env e ajustar o Flask para ler de variáveis de ambiente (ex.: export ORS_API_KEY=…), mas, para simplicidade, mantemos hard-coded no JS.

Verifique a estrutura de pastas

    seu_projeto/
    ├── app.py
    ├── requirements.txt
    ├── templates/
    │   └── index.html
    └── static/
        ├── css/
        │   └── style.css
        └── js/
            └── app.js

▶️ Executando a Aplicação

    Inicie o servidor Flask

    python app.py

    Por padrão, o Flask roda em http://127.0.0.1:5000/ no modo debug.

    Abra o navegador em http://127.0.0.1:5000/.

    Teste rápido

        Insira um JSON qualquer (ex.: 10 pontos de São Paulo, ou coord aleatórias) dentro do <textarea>.

        Clique em “Calcular Rota”.

        A página exibirá:

            A rota sem otimização e a distância total (em km).

            A rota otimizada (array de [lat,lon] e a distância total otimizada).

            O mapa (Leaflet) com o marcador fixo no ponto inicial absoluto, e desenhando somente o primeiro trecho (0→1) via ORS.

            Os botões “Anterior” (desabilitado) e “Próximo” (habilitado se houver ≥1 segmento).

        Ao clicar em “Próximo”, a rota antiga (polyline + marcadores de segmento) é removida, e o sistema desenha o próximo trecho (1→2), inserindo dois marcadores: “Início do Segmento” e “Fim do Segmento”. O marcador fixo do ponto absoluto inicial permanece.

        Botões se habilitam/desabilitam corretamente conforme índice do segmento atual.

📂 Estrutura de Arquivos

seu_projeto/
│
├── app.py                  # Back-end Flask
├── requirements.txt        # Dependências do Python
│
├── templates/              # HTML
│   └── index.html          # Página principal (JS e CSS externos)
│
└── static/
    ├── css/
    │   └── style.css       # Estilos (altura do #map, botões etc.)
    │
    └── js/
        └── app.js          # Lógica Leaflet + ORS + Navegação de Segmentos

    app.py

        Contém a lógica Flask: endpoints / (renderiza index.html) e /calcular_rota (POST).

        Em /calcular_rota, recebe JSON { "coordenadas": [[lat,lon], …] }, aplica o Nearest Neighbor e retorna JSON com rotas e distâncias.

    index.html

        Carrega Leaflet CSS/JS, o próprio app.js e define a interface: textarea, botão, área de resultados, controles e <div id="map">.

    style.css

        Define estilo geral da página e garante #map { height: 400px; }.

        Estiliza botões “Anterior”/“Próximo” (modo habilitado/desabilitado) e área de resultados.

    app.js

        Controla o fluxo: parseia JSON, faz fetch em /calcular_rota, recebe rota_otimizada.

        Inicializa Leaflet (se ainda não existir), recria marcadores e desenha apenas um segmento de cada vez via ORS.

        Insere marcador fixo no primeiro ponto de toda a rota (popup “Ponto Inicial da Rota”).

        Insere, a cada segmento, marcadores de “Início do Segmento” e “Fim do Segmento”.

        Habilita/desabilita os botões de navegação conforme indiceAtual.

🚧 Possíveis Ajustes e Informações Adicionais

    Limites da API ORS

        A conta free do OpenRouteService possui cota diária limitada (normalmente algumas centenas de requests). Cada avanço/volta faz uma requisição ao ORS para obter o trecho daquele segmento. Se exceder a cota, o ORS retornará status 403 ou similar, e o mapa ficará sem polylines para os segmentos que não puderam ser obtidos.

        Para minimizar chamadas, você pode implementar cache local dos resultados de cada par de pontos (por exemplo, um objeto JS cujo key seja "lat1,lon1|lat2,lon2" e o value seja o array de [lat,lon] retornado). Assim, ao voltar a um segmento já visitado, não é necessário chamar de novo o ORS.

    Estilização e Responsividade

        O CSS define max-width: 700px para a página, mas você pode ajustar conforme desejar.

        O mapa tem height: 400px; para torná-lo responsivo em full-screen, use height: calc(100vh - 200px) ou similar.

    Melhorias de UX

        Adicionar botões para “Zoom no início absoluto” ou “Mostrar rota completa” (traçando todas as polylines sem segmentação).

        Personalizar ícones de marcador (por exemplo, ícone distinto para “Início da Rota” vs. “Início do Segmento”).

        Mostrar, ao passar o mouse no polylinha, a distância aproximada daquele trecho (pode ser extraída de geojson.features[0].properties.summary.distance se habilitar esse parâmetro na chamada ORS).

    Possíveis erros comuns

        ORS retornou status 403: excedeu a cota ORS ou chave inválida.

        L is not defined: Leaflet não carregou antes do app.js. Verifique a ordem das <script> em index.html.

        Mapa não aparece (div height 0): confira se #map { height: 500px; } está presente e não foi sobrescrito.

        Botões não clicam: cheque se os IDs btnAnterior / btnProximo correspondem exatamente ao que está no JS (getElementById).

    Extensões e Futuras Funcionalidades

        Permitir importar coordenadas via upload de arquivo .json em vez de colar no textarea.

        Integrar outro algoritmo de otimização (ex.: Branch-and-Bound, Simulated Annealing) para rotas maiores ou mais precisas.

        Exportar a rota otimizada em GeoJSON ou GPX para uso em GPS.

📝 Licença

Este projeto está disponível sob a MIT License.
👨‍💻 Contribuições

Pull requests são bem-vindos! Sinta-se à vontade para:

    Ajustar estilos CSS.

    Melhorar a lógica de navegação de segmentos (cache, taxa de atualização, exibir info de distância de cada segmento).

    Suporte a múltiplos perfis de transporte (ex.: walking, cycling no ORS).

    Documentar problemas conhecidos e soluções alternativas no GitHub Issues.
