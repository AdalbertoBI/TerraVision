# TerraVision – System Overview

## Visão Geral do Projeto

**Propósito:** TerraVision cria uma interface ocular que transforma o olhar em música terapêutica, oferecendo sessões sonoras sem necessidade de contato físico.

**Funcionalidades principais:**

- Rastreamento do olhar via webcam utilizando WebGazer.js.
- Calibração gamificada com a "pizza colorida" para mapear zonas de interação.
- Acionamento de áudio terapêutico por meio da Web Audio API com notas e sequências relaxantes.
- Detecção de piscadas enriquecida com MediaPipe Face Mesh para ações confiáveis.
- Feedback visual duplo: cursor de gaze em tempo real e heatmap terapêutico acumulativo.

**Público-alvo:** Pessoas em terapias de relaxamento, indivíduos com deficiências motoras que precisam de interfaces hands-free, terapeutas e pesquisadores em reabilitação sensorial.

## Arquitetura Técnica

TerraVision é uma aplicação client-side em HTML5, CSS3 e JavaScript modular. O navegador hospeda todo o processamento, permitindo sessões imediatas sem backend dedicado.

### Stack tecnológica

- **HTML5:** estrutura a interface principal (`index.html`, `docs.html`).
- **CSS3:** define a identidade visual terapêutica (`style.css`, `css/*.css`).
- **JavaScript ES6:** organiza lógicas de captura de vídeo, rastreamento, áudio e UI (`js/`, `src/`).
- **WebGazer.js:** biblioteca de eye-tracking para browsers.
- **MediaPipe Face Mesh:** landmarks faciais de alta resolução usados para piscadas e métricas oculares.
- **Web Audio API:** geração e mixagem de sons terapêuticos.
- **Pipeline de câmera resiliente:** captura com `getUserMedia` assíncrono, verificação de metadata e fallback por mouse quando permissões falham.
- **Refino ocular híbrido:** coordenadas do WebGazer suavizadas com centros de íris do MediaPipe Face Mesh.
- **Cursor acessível de gaze:** visualização contínua com `#gazeCursor` e heatmap com decaimento visual.
- **Distribuição offline:** `libs/webgazer.js` servido localmente (baixado por `script/setup-webgazer.*`) para preservar privacidade.

### Fluxo de funcionamento

```text
[Usuário acessa a aplicação]
          |
          v
[Permissão da webcam] -- getUserMedia --> [Stream de vídeo]
          |
          v
[WebGazer.js] -- calibração "pizza" --> [Modelo de gaze calibrado]
          |
          v
[Mapeamento do olhar] -- focos/piscadas --> [Triggers musicais + feedback visual]

### Pipeline combinado de rastreamento (2025)

1. **WebGazer.js (gaze absoluto):** mapeia coordenadas de olhar após calibração com os setores da pizza.
2. **MediaPipe Face Mesh (biometria ocular):** processa o mesmo stream para obter EAR (Eye Aspect Ratio) e centro das íris.
3. **Blink Detector adaptativo:** usa o EAR do Face Mesh com thresholds de `APP_CONFIG` para disparar piscadas voluntárias.
4. **Fallback inteligente:** se o Face Mesh não iniciar, o detector volta ao rastreador CLM padrão do WebGazer.
5. **Heatmap terapêutico:** pontos de gaze alimentam `HeatmapRenderer`, gerando reforço visual suavizado com decaimento contínuo.
```

## Estrutura do Código Fonte

### Arquivos raiz

| Caminho | Função |
| --- | --- |
| `index.html` | Página principal com elementos de vídeo, canvas e controles. |
| `docs.html` | Página auxiliar de documentação interna. |
| `style.css` | Estilos globais da landing page. |
| `notes.json` | Observações e metadados do projeto. |
| `package.json` | Metadados npm, scripts e dependências (inclui `webgazer`). |

### CSS

| Caminho | Função |
| --- | --- |
| `css/style.css` | Layout base e tipografia. |
| `css/camera-advanced.css` | Ajustes avançados para overlays da câmera. |
| `css/therapeutic.css` | Paleta, gradientes e animações terapêuticas. |

### JavaScript (versão pronta para navegador)

| Caminho | Função |
| --- | --- |
| `js/main.js` | Orquestra a aplicação: init da câmera, WebGazer, pizza e áudio. |
| `js/audio-manager.js` | Envelopa Web Audio API, gerencia notas e muting. |
| `js/gaze-tracker.js` | Wrapper do WebGazer com suavização e callbacks. |
| `js/blink-detector.js` | Detecta piscadas para comandos secundários. |
| `js/pizza-circle.js` | Desenha a pizza colorida e mapeia setores para notas. |
| `js/therapy-mode.js` | Regras de interação terapêutica e feedback. |
| `js/main-therapeutic.js` | Entrada alternativa com presets de terapia. |
| `js/camera.js` | Inicializa `getUserMedia` e controla o elemento de vídeo. |
| `js/camera-controls.js` | Ajustes finos de câmera e overlays. |
| `js/calibration.js` | Rotinas de calibração e armazenamento de métricas. |
| `js/fullscreen.js` | Gerencia modo imersivo e gestos por gaze. |
| `js/ui-manager.js` | Manipula HUD, toasts e indicadores. |

### Código modular (`src/`)

| Caminho | Função |
| --- | --- |
| `src/main.js` | Ponto de entrada modular, combina classes reusáveis. |
| `src/audio.js` | Núcleo de áudio reusável para builds modernas. |
| `src/gazeTracker.js` | Implementação modular do rastreador ocular. |
| `src/blinkDetector.js` | Detector reaproveitável de piscadas. |
| `src/heatmap.js` | Renderizador de heatmap baseado em gaze com decaimento e suavização. |
| `src/faceMeshProcessor.js` | Ponte com MediaPipe Face Mesh (EAR, íris, métricas faciais). |
| `src/pizzaRenderer.js` | Renderização da pizza em contexto modular. |
| `src/therapyMode.js` | Lógica de terapia em formato ES module. |
| `src/calibration.js` | Funções de calibração compartilháveis. |
| `src/calibrationModel.js` | Modelagem de dados/estado da calibração. |
| `src/cameraPreview.js` | Preview e ajustes de câmera. |
| `src/controlManager.js` | Gerencia estados da sessão terapêutica. |
| `src/ui.js` | Componentização de UI em módulos ES. |
| `src/config.js` | Constantes e thresholds globais. |

### Bibliotecas e scripts auxiliares

| Caminho | Função |
| --- | --- |
| `libs/webgazer-instructions.js` | Texto guiado para onboarding do WebGazer. |
| `script/server.py` | Servidor HTTP simples para testes locais. |
| `script/start.py` | Script de bootstrap da experiência. |
| `script/install.py`, `script/setup-webgazer.*`, `script/quickstart.sh` | Automatizam setup do WebGazer e ambiente. |

### Snippets úteis

*Inicialização da webcam (`js/camera.js`):*

```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    const video = document.getElementById('webcam');
    video.srcObject = stream;
    return video.play();
  })
  .catch(err => console.error('Erro ao acessar a webcam', err));
```

*Configuração do WebGazer (`js/gaze-tracker.js`):*

```javascript
webgazer
  .setRegression('ridge')
  .setTracker('TFFacemesh')
  .setVideoElement(videoElement)
  .begin()
  .then(() => {
    this.isInitialized = true;
    this.setupGazeTracking();
  });
```

*Trigger de áudio terapêutico (`js/audio-manager.js`):*

```javascript
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine';
oscillator.frequency.value = audioManager.getFrequency(sliceIndex);
oscillator.connect(audioContext.destination);
oscillator.start();
oscillator.stop(audioContext.currentTime + 1.5);
```

## Guia de Uso

1. **Instalação do ambiente**

  ```cmd
  npm install
  npm run setup
  npm run start
  ```

  `npm run setup` executa `script/setup-webgazer.*` e baixa `libs/webgazer.js`. Os scripts usam `python -m http.server` para servir a pasta raiz (porta 8000 por padrão).

1. **Acesso pelo navegador** — Abra `http://localhost:8000` no Chrome ou Edge e autorize o uso da webcam quando solicitado; o preview aparece ao centro e o cursor de gaze surge após a calibração.
2. **Calibração com a pizza colorida** — Aguarde a mensagem “Câmera carregada com sucesso”, clique em **Calibrar**, fixe o olhar em cada fatia até receber confirmação visual e recorra ao fallback por mouse caso a câmera não esteja disponível.
3. **Interação terapêutica** — Com o rastreamento ativo, mire o olhar nas fatias para pré-ouvir notas, pisque deliberadamente para selecionar uma fatia (o sistema dispara cliques sintéticos) e aproveite o modo tela cheia (`js/fullscreen.js`) para maior imersão.

## Erros Comuns e Soluções

| Problema | Causa provável | Correção sugerida |
| --- | --- | --- |
| Webcam não inicia | Permissão negada ou browser incompatível | Alertas guiados com try/catch; conceda permissão ou utilize o fallback por mouse para testar a interface. |
| WebGazer ausente | `libs/webgazer.js` não encontrado no servidor local | Rodar `npm run setup` ou executar `script/setup-webgazer.bat`/`.sh` para baixar a dependência. |
| Calibração imprecisa | Iluminação irregular ou reflexos | Usar iluminação difusa, evitar óculos espelhados, repetir calibração. |
| Confiança do gaze baixa | Usuário muito distante da webcam | Ajustar posição, aumentar brilho, recalibrar. |
| Latência ou cortes de áudio | Contexto suspenso ou excesso de osciladores | Chamar `audioContext.resume()`, limitar notas simultâneas, usar `stopAll()`. |
| Travamentos em browsers específicos | Falta de suporte ao WebGazer/WebGL | Priorizar Chrome/Edge, detectar `navigator.userAgent` para ocultar features incompatíveis. |
| Piscadas não mapeadas | Threshold inadequado em `blinkDetector` | Ajustar sensibilidade e debounce conforme feedback do usuário. |

## Recursos recomendados para rastreamento ocular (2025)

| Recurso | Uso sugerido no TerraVision | Pontos fortes | Limitações | Referência |
| --- | --- | --- | --- | --- |
| **WebGazer.js** | Continuidade do gaze absoluto com calibração na pizza. | CDN único, roda offline, integra-se à calibração existente. | Exige 5–10 pontos de calibração e consome CPU em máquinas antigas. | [GitHub · brownhci/WebGazer](https://github.com/brownhci/WebGazer) |
| **MediaPipe Face Mesh** | Landmarks faciais + EAR para piscadas e métricas de estabilidade. | Alta precisão ocular, modelo leve (~2 MB), roda no browser. | Requer pós-processamento para converter em coordenadas de tela. | [TensorFlow.js Models](https://github.com/tensorflow/tfjs-models/tree/master/face-landmarks-detection) |
| **EyeGestures Toolkit** | Futuras interações por gestos oculares (sorriso, sobrancelhas). | Projeto focado em acessibilidade, callbacks prontos para áudio. | Documentação em evolução; API ainda instável. | [Repositório EyeGestures (open-source)](https://github.com/topics/eyegestures) |
| **Handsfree.js** | Prototipagem rápida de interações multimodais com mão + olhar. | Eventos JS prontos (`handsfree.event`), integra com MediaPipe. | Menor precisão para gaze absoluto; ideal para testes. | [handsfree.js.org](https://handsfree.js.org) |
| **WebGazeTrack (Chrome Ext.)** | Coleta remota de dados de gaze para estudos clínicos. | Setup simples, exporta CSV. | Disponível apenas como extensão Chrome; sem embed direto. | [ACM · WebGazeTrack](https://dl.acm.org/) |

> **Dica:** inicie com WebGazer + Face Mesh (implementados neste repositório). EyeGestures e Handsfree.js podem ser plug-ins opcionais quando for necessário ampliar gestos acessíveis.

## Repositórios analisados (GitHub, 2024-2025)

| Repositório | Link | Recomendações para o TerraVision | Pontos fortes | Considerações |
| --- | --- | --- | --- | --- |
| WebGazer.js | [github.com/brownhci/WebGazer](https://github.com/brownhci/WebGazer) | Manter como base para gaze absoluto e cursor; seguir exemplos de auto-calibração progressiva. | Implementação madura, roda totalmente no browser, exemplos pronto-uso. | Calibração inicial manual (5-10 pontos) e uso intenso de CPU em notebooks antigos. |
| HUE Vision | [github.com/simplysuvi/hue-vision](https://github.com/simplysuvi/hue-vision) | Inspiração para heatmaps e overlay de landmarks; sugere uso de MediaPipe com refinamento de íris. | Visualizações modernas, ML on-device, guia detalhado com TensorFlow.js. | Modelo pesado em conexões lentas, exige otimização ao rodar junto com Web Audio. |
| EyeGestures | [github.com/NativeSensors/EyeGestures](https://github.com/NativeSensors/EyeGestures) | Explorar gestos avançados (sacadas, fixação) e feedback auditivo para sessões terapêuticas customizadas. | Foco em acessibilidade, inclui eventos de alto nível (blink, dwell, expressões). | Porta JS ainda lite; depende de distância usuário-câmera controlada. |
| WebGazer + Heatmap | [github.com/Maldox/webgazer](https://github.com/Maldox/webgazer) | Referência para agregação de gaze (heatmaps) e relatórios pós-sessão. | Baseado no WebGazer, licença aberta, código simples de adaptar. | Licença GPLv3 pode limitar uso comercial direto; efeito gráfico mais pesado. |
| Eye-Tracker Demo | [github.com/SHAILY24/eye-tracker-demo](https://github.com/SHAILY24/eye-tracker-demo) | Amostra de dwell-time nos alvos; útil para validar thresholds terapêuticos. | Interface clara com calibração de 9 pontos, demonstração ao vivo. | Requer backend Flask para features completas; mira desktops. |
| Gazealytics | [github.com/gazealytics/gazealytics-master](https://github.com/gazealytics/gazealytics-master) | Ferramentas de análise pós-sessão (scanpaths, AOIs) para relatórios clínicos. | Visualizações ricas, export snapshots, brushing interativo. | Necessita stack Python/Conda; foco analítico e não real-time. |
| GazeRecorder | [github.com/szydej/GazeRecorder](https://github.com/szydej/GazeRecorder) | Captura sessões completas e gera heatmaps para revisão terapêutica. | API JS simples e documentação objetiva. | Depende de serviços externos para armazenamento/replay. |

## Sugestões de Melhorias

- **Feedback visual adaptativo:** destacar setores focados e exibir indicadores de confiança em tempo real.
- **Personalização sonora:** permitir playlists terapêuticas customizadas, sons binaurais e tempos configuráveis.
- **Suporte multiplataforma:** otimizar layouts responsivos, criar fallback para touch com gestos manuais.
- **Calibração inteligente:** incorporar amostragem dinâmica e modelos de ML leves para maior precisão em ambientes variados.
- **Privacidade e compliance:** adicionar termos de consentimento, opção de processamento totalmente local e limpeza automática de streams.
- **Analytics terapêuticos:** registrar métricas anônimas de sessões para apoiar terapeutas no acompanhamento.
- **Heatmaps avançados:** disponibilizar export pós-sessão dos mapas de gaze para acompanhamento terapêutico.

## Framework para Novos Comandos

| Comando | Status | Objetivo |
| --- | --- | --- |
| `npm run dev` | ✅ | Executa `python server.py 8000` com logging adicional para desenvolvimento. |
| `npm run start` | ✅ | Servidor estático (`python -m http.server 8000`). |
| `npm run setup` | ⚙️ | Executa `setup-webgazer.sh` para baixar dependências do WebGazer. |
| `npm run quickstart` | ⚙️ | Script shell de inicialização rápida (checa dependências e abre navegador). |
| `npm run add-audio -- <arquivo>` | 🔜 | Proposta de CLI para registrar novos sons terapêuticos e atualizar catálogos. |
| `npm run calibrate:test` | 🔜 | Planejado para rodar cenários de calibração sintética e verificar thresholds. |

### Extensões sugeridas

- Adicionar `scripts/add-audio.js` que converta arquivos WAV/MP3 e atualize `audio-manager` com metadados.
- Incluir `npm run lint`/`npm run build` com bundler (Vite/Webpack) para organizar módulos de `src/`.
- Criar `npm run export-docs` para gerar PDFs/HTML com esta documentação e assets de treinamento.
- Publicar templates de comandos no diretório `script/` (ex.: `script/create-gaze-zone.py`) para acelerar novas features.

---
Documento mantido em `docs/system_overview.md`. Atualize-o sempre que novos módulos, comandos ou assets forem adicionados ao TerraVision.
