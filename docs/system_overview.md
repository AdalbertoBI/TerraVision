# TerraVision – System Overview

## Visão Geral do Projeto

**Propósito:** TerraVision cria uma interface ocular que transforma o olhar em música terapêutica, oferecendo sessões sonoras sem necessidade de contato físico.

**Funcionalidades principais:**

- Rastreamento do olhar via webcam utilizando WebGazer.js.
- Calibração gamificada com a "pizza colorida" para mapear zonas de interação.
- Acionamento de áudio terapêutico por meio da Web Audio API com notas e sequências relaxantes.

**Público-alvo:** Pessoas em terapias de relaxamento, indivíduos com deficiências motoras que precisam de interfaces hands-free, terapeutas e pesquisadores em reabilitação sensorial.

## Arquitetura Técnica

TerraVision é uma aplicação client-side em HTML5, CSS3 e JavaScript modular. O navegador hospeda todo o processamento, permitindo sessões imediatas sem backend dedicado.

### Stack tecnológica

- **HTML5:** estrutura a interface principal (`index.html`, `docs.html`).
- **CSS3:** define a identidade visual terapêutica (`style.css`, `css/*.css`).
- **JavaScript ES6:** organiza lógicas de captura de vídeo, rastreamento, áudio e UI (`js/`, `src/`).
- **WebGazer.js:** biblioteca de eye-tracking para browsers.
- **Web Audio API:** geração e mixagem de sons terapêuticos.

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
  npm run start
  ```

  Os scripts usam `python -m http.server` para servir a pasta raiz (porta 8000 por padrão).

1. **Acesso pelo navegador**
   - Abra `http://localhost:8000` no Chrome ou Edge.
   - Autorize o uso da webcam quando solicitado.
1. **Calibração com a pizza colorida**
   - Siga o modal de permissões.
   - Clique em **Calibrar** e fixe o olhar em cada fatia até receber confirmação visual.
   - Recalibre sempre que o usuário mudar de posição.
1. **Interação terapêutica**
   - Com o rastreamento ativo, mire o olhar nas fatias para pré-ouvir notas.
   - Pisque deliberadamente para selecionar uma fatia e tocar a combinação correspondente.
   - Utilize o modo tela cheia para maior imersão (`js/fullscreen.js`).

## Erros Comuns e Soluções

| Problema | Causa provável | Correção sugerida |
| --- | --- | --- |
| Webcam não inicia | Permissão negada ou outro app usando a câmera | Verificar pop-up do navegador, fechar apps que usam câmera, reiniciar `start()`. |
| Calibração imprecisa | Iluminação irregular ou reflexos | Usar iluminação difusa, evitar óculos espelhados, repetir calibração. |
| Confiança do gaze baixa | Usuário muito distante da webcam | Ajustar posição, aumentar brilho, recalibrar. |
| Latência ou cortes de áudio | Contexto suspenso ou excesso de osciladores | Chamar `audioContext.resume()`, limitar notas simultâneas, usar `stopAll()`. |
| Travamentos em browsers específicos | Falta de suporte ao WebGazer/WebGL | Priorizar Chrome/Edge, detectar `navigator.userAgent` para ocultar features incompatíveis. |
| Piscadas não mapeadas | Threshold inadequado em `blinkDetector` | Ajustar sensibilidade e debounce conforme feedback do usuário. |

## Sugestões de Melhorias

- **Feedback visual adaptativo:** destacar setores focados e exibir indicadores de confiança em tempo real.
- **Personalização sonora:** permitir playlists terapêuticas customizadas, sons binaurais e tempos configuráveis.
- **Suporte multiplataforma:** otimizar layouts responsivos, criar fallback para touch com gestos manuais.
- **Calibração inteligente:** incorporar amostragem dinâmica e modelos de ML leves para maior precisão em ambientes variados.
- **Privacidade e compliance:** adicionar termos de consentimento, opção de processamento totalmente local e limpeza automática de streams.
- **Analytics terapêuticos:** registrar métricas anônimas de sessões para apoiar terapeutas no acompanhamento.

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
