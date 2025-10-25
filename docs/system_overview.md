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
- **Calibração passiva multi-ponto:** grade 3x3 aparece automaticamente sobre a pizza, orienta os primeiros cliques e confirma cada amostra com piscadas voluntárias.
- **Aprendizado contínuo por cliques:** cada clique válido na interface alimenta o `webgazer.recordScreenPosition`, com reforço por piscada e throttle de 420 ms para evitar ruído.
- **Persistência inteligente:** estado de bootstrap e pesos do modelo são salvos em `localStorage` (`terraCalibrationBootstrapped`), recuperando a calibração nas sessões seguintes.
- **Rastreamento de íris refinado:** MediaPipe Face Mesh em modo `refineLandmarks` com ROI dedicado nos olhos e suavização exponencial (<2° de erro em condições padrão).
- **Cursor acessível de gaze:** visualização contínua com `#gaze-cursor` e heatmap com decaimento visual.
- **Feedback visual do olhar:** cursor vermelho (setGazeListener) e SVG de olho animado com pupila móvel; piscadas disparam animação sincronizada com o detector.
- **Pré-visualização de baixa confiança:** cursor dourado e pontos de predição do WebGazer aparecem mesmo antes da calibração para orientar o usuário.
- **Distribuição offline:** `libs/webgazer.js` servido localmente (baixado por `script/setup-webgazer.*`) para preservar privacidade.
- **Carregamento assíncrono do WebGazer:** Promise única com timeout e fallback automático para CDN oficial quando o arquivo local falha.

### Melhorias de Calibração e Precisão (Outubro 2025)

**Persistência de Modelo com localStorage:**

- Implementado salvamento automático do modelo WebGazer após cada clique de calibração usando `saveModelToLocalStorage()`.
- Carregamento automático do modelo salvo na inicialização via `loadModelFromLocalStorage()`, eliminando necessidade de recalibração frequente.
- Modelo persiste entre sessões, mantendo precisão acumulada mesmo após recarregar a página.

**Calibração Sequencial Inteligente:**

- Cliques na pizza registram aprendizado via `webgazer.recordScreenPosition()` com coordenadas exatas do clique.
- Sistema sequencial de 9 pontos em grade 3×3 que ensina o modelo ponto a ponto.
- Cada ponto aguarda confirmação por piscada antes de avançar para o próximo.
- Modelo salvo após cada ponto bem-sucedido, garantindo progresso incremental.

**Reforço por Piscadas:**

- Piscadas detectadas até 520ms após um clique reforçam o aprendizado via `getRegressionModel().addSample()`.
- Estado ocular capturado (métricas de EAR e posição de íris) vinculado às coordenadas do clique.
- Modelo salvo automaticamente após cada reforço por piscada.
- Mensagem de status confirma "Clique confirmado por piscada. Modelo reforçado e salvo."

**Smoothing Exponencial Otimizado:**

- Parâmetro alpha ajustado para 0.3 (nova amostra) / 0.7 (histórico) em `applySmoothing()`.
- Reduz jitter e tremores no cursor de gaze, proporcionando movimentos mais fluidos.
- Preserva responsividade enquanto elimina ruído de predições instantâneas.
- Reset automático do filtro quando gaze é perdido momentaneamente.

**ROI Zoom 2× nos Olhos:**

- Região de interesse (ROI) dos olhos ampliada em 2× antes de processar com WebGazer.
- Crop centralizado na região ocular a partir dos landmarks do MediaPipe Face Mesh.
- Sub-canvas de 240×120px dedicado renderiza ROI ampliado sem afetar preview principal.
- Melhora precisão da detecção de features oculares e tracking de pupila.
- Processamento via `tracker.processVideo(roiCanvas)` após cada frame do Face Mesh.

**Throttling de Cliques:**

- Intervalo mínimo de 420ms entre cliques passivos para evitar amostras ruidosas.
- Previne sobrecarga do modelo com dados redundantes ou de baixa qualidade.
- Mantido mesmo após bootstrap inicial completado.

**Tratamento de Erros Robusto:**

- Todos os salvamentos de modelo envolvidos em try/catch com logging detalhado.
- Falhas silenciosas não interrompem fluxo de calibração ou interação.
- Mensagens de console indicam quando persistência falha para debug.

Essas melhorias combinadas resultam em:

- **Calibração mais rápida**: modelo persiste entre sessões.
- **Maior precisão**: zoom ROI + reforço por piscadas + smoothing exponencial.
- **Experiência fluida**: cursor suave sem jitter, aprendizado contínuo e transparente.
- **Robustez**: tratamento de erros impede crashes por falhas de localStorage.


### Fluxo de funcionamento

```text
[Usuário acessa a aplicação]
          |
          v
[Permissão da webcam] -- getUserMedia --> [Stream de vídeo]
          |
          v
[WebGazer.js] -- bootstrap passivo 3×3 --> [Modelo de gaze calibrado]
          |
          v
[Aprendizado contínuo] -- focos/piscadas --> [Triggers musicais + feedback visual]

### Pipeline combinado de rastreamento (2025)

1. **WebGazer.js (gaze absoluto):** mapeia coordenadas de olhar após bootstrap passivo na grade 3×3 e reforço contínuo com cliques na pizza.
2. **MediaPipe Face Mesh (biometria ocular):** processa o mesmo stream para obter EAR (Eye Aspect Ratio) e centro das íris.
3. **Blink Detector adaptativo:** usa o EAR do Face Mesh com thresholds de `APP_CONFIG` para validar piscadas voluntárias (confirmação da amostra e comandos secundários).
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

1. **Acesso pelo navegador** — Abra `http://localhost:8000` no Chrome ou Edge e autorize o uso da webcam quando solicitado; o preview aparece ao centro e o cursor de gaze já exibe a posição estimada com pré-visualização dourada.
2. **Bootstrap passivo de calibração** — Assim que o WebGazer inicializa, uma grade 3×3 aparece sobre a pizza. Clique em cada alvo quando ele estiver sob o seu foco visual e pisque uma vez para confirmar o ponto. Após as 9 amostras, o overlay some e o status indica "Calibração concluída" (o progresso é salvo localmente).
3. **Aprendizado contínuo** — Continue usando a interface normalmente: cada clique válido reforça o modelo, desde que você mantenha o olhar no mesmo ponto e confirme com uma piscada. Se mover a janela ou redimensionar, a grade pode retornar rapidamente para coletar novos pontos.
4. **Interação terapêutica** — Com o rastreamento estável, mire o olhar nas fatias para pré-ouvir notas, use piscadas deliberadas como gatilho de seleção e ative o modo tela cheia (`js/fullscreen.js`) para maior imersão.

> **Nota:** a flag `terraCalibrationBootstrapped` é gravada no `localStorage` assim que a grade é concluída. Limpe-a (via DevTools ou `localStorage.removeItem('terraCalibrationBootstrapped')`) para forçar um novo bootstrap completo.

## Erros Comuns e Soluções

| Problema | Causa provável | Correção sugerida |
| --- | --- | --- |
| Webcam não inicia | Permissão negada ou browser incompatível | Alertas guiados com try/catch; conceda permissão ou utilize o fallback por mouse para testar a interface. |
| WebGazer ausente | `libs/webgazer.js` não encontrado no servidor local | Rodar `npm run setup` ou executar `script/setup-webgazer.bat`/`.sh` para baixar a dependência. |
| WebGazer 404/ não carrega | Caminho incorreto ou arquivo ausente | Download local automatizado com fallback CDN e Promise de carregamento com timeout. |
| Calibração imprecisa | Iluminação irregular ou reflexos | Use iluminação difusa, evite óculos espelhados, repita alguns cliques nos alvos da grade e confirme com piscadas para reforçar o modelo. |
| Calibração falha | Pontos insuficientes ou modelo sem íris refinada | Aguarde a grade reaparecer (ou acione `localStorage.removeItem('terraCalibrationBootstrapped')`) e registre novamente os nove pontos com foco + piscada; valide se `refineLandmarks` está ativo. |
| Bootstrap não aparece | `terraCalibrationBootstrapped` mantido entre sessões mesmo após mover a UI | Limpe o item de `localStorage`, recarregue a página ou abra em aba anônima para forçar o bootstrap passivo. |
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
- **Heatmap opcional de fixação:** habilitar sobreposição configurável que acumula pontos de foco para análises clínicas sem afetar a experiência em tempo real.

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
