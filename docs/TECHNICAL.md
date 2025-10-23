# Terra Vision - Documentação Técnica

Documentação detalhada da arquitetura, APIs e padrões de design do Terra Vision.

## 📚 Índice

1. [Arquitetura](#arquitetura)
2. [APIs de Classe](#apis-de-classe)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Padrões de Design](#padrões-de-design)
5. [Performance](#performance)
6. [Debugging](#debugging)

## 🏗️ Arquitetura

### Visão Geral

```
┌─────────────────────────────────────────────┐
│       TerrVisionApp (main.js)               │
│   Orquestrador principal da aplicação       │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┼──────────┬───────────┐
        │          │          │           │
        ▼          ▼          ▼           ▼
┌─────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│AudioManager │ │GazeTracker│ │Blink    │ │Pizza     │
│             │ │           │ │Detector │ │Circle    │
│Web Audio API│ │WebGazer.js│ │Frame    │ │Canvas    │
└─────────────┘ └──────────┘ │Analysis │ │Drawing   │
                              └─────────┘ └──────────┘
```

### Camadas

1. **Camada de Apresentação (UI)**
   - HTML: `index.html`
   - CSS: `css/style.css`
   - Canvas: Visualização em tempo real

2. **Camada de Lógica**
   - `TerrVisionApp`: Orquestração
   - `GazeTracker`: Rastreamento ocular
   - `BlinkDetector`: Detecção de piscadas
   - `PizzaCircle`: Lógica do círculo

3. **Camada de Áudio**
   - `AudioManager`: Síntese de som
   - Web Audio API: API nativa

4. **Camada de Entrada**
   - WebGazer.js: Rastreamento
   - getUserMedia: Acesso à câmera

## 🔌 APIs de Classe

### AudioManager

```javascript
// Instância
const audioManager = new AudioManager();

// Métodos principais
audioManager.playNote(note, duration);           // Toca uma nota
audioManager.playSequence(notes, tempo);         // Sequência
audioManager.playChord(notes, duration);         // Acorde
audioManager.playSuccess();                      // Som de sucesso
audioManager.playError();                        // Som de erro

// Propriedades
audioManager.notes                               // Mapa de notas
audioManager.noteSequence                        // Array de notas
audioManager.audioContext                        // Contexto de áudio

// Getters
audioManager.getFrequency(note)                  // Hz da nota
audioManager.getNoteName(index)                  // Nome da nota
audioManager.getNoteList()                       // Lista todas as notas
audioManager.getNoteCount()                      // Total de notas
```

### GazeTracker

```javascript
// Instância
const gazeTracker = new GazeTracker(canvas, options);

// Métodos principais
gazeTracker.initialize(videoElement)             // Inicializa
gazeTracker.start()                              // Inicia rastreamento
gazeTracker.stop()                               // Para rastreamento
gazeTracker.calibrate()                          // Calibra câmera
gazeTracker.shutdown()                           // Encerra

// Callbacks
gazeTracker.setOnGazeUpdate(callback)            // Atualização de gaze
gazeTracker.setOnError(callback)                 // Tratamento de erro

// Getters
gazeTracker.getGazePosition()                    // Posição atual
gazeTracker.getSmoothGazeX()                     // X suavizado
gazeTracker.getSmoothGazeY()                     // Y suavizado
gazeTracker.isConfident()                        // Confiança adequada
```

### BlinkDetector

```javascript
// Instância
const blinkDetector = new BlinkDetector(options);

// Métodos principais
blinkDetector.processFrame(frameData)            // Processa frame

// Callbacks
blinkDetector.setOnBlink(callback)               // Piscada detectada
blinkDetector.setOnBlinkStart(callback)          // Início da piscada
blinkDetector.setOnBlinkEnd(callback)            // Fim da piscada

// Getters
blinkDetector.getBlinkCount()                    // Total de piscadas
blinkDetector.isCurrentlyBlinking()              // Piscando agora?
blinkDetector.getTimeSinceLastBlink()            // Tempo desde última

// Setters
blinkDetector.resetBlinkCount()                  // Reseta contador
blinkDetector.setBlinkThreshold(value)           // Ajusta sensibilidade
```

### PizzaCircle

```javascript
// Instância
const pizzaCircle = new PizzaCircle(canvas, audioManager, slices);

// Métodos principais
pizzaCircle.draw()                               // Desenha círculo
pizzaCircle.updateFocus(x, y)                    // Atualiza foco visual
pizzaCircle.selectSlice(index)                   // Seleciona fatia

// Callbacks
pizzaCircle.setOnSliceHover(callback)            // Hover em fatia
pizzaCircle.setOnSliceClick(callback)            // Clique em fatia

// Getters
pizzaCircle.getFocusedSlice()                    // Fatia focada
pizzaCircle.getSliceAtPosition(x, y)             // Fatia em posição

// Setters
pizzaCircle.clearFocus()                         // Limpa foco
```

## 📊 Fluxo de Dados

### Inicialização

```
DOMContentLoaded
    ↓
TerrVisionApp constructor
    ↓
setupEventListeners()
    ↓
Aguardando clique em "Iniciar"
```

### Execução Principal

```
Usuario clica "Iniciar"
    ↓
Navigator.getUserMedia (câmera)
    ↓
initialize() - Cria componentes
    ↓
startTracking() - Inicia WebGazer
    ↓
animationFrame() loop (60 FPS)
    ├─ GazeTracker: Lê posição do olho
    ├─ PizzaCircle: Atualiza foco visual
    ├─ BlinkDetector: Analisa piscada
    ├─ AudioManager: Toca som (se piscou)
    └─ RequestAnimationFrame: Próximo frame
```

### Sequência de Piscada

```
BlinkDetector.processFrame(frameData)
    ↓
calculateEyeOpenness() < threshold
    ↓
startBlink() trigger
    ↓
[Olho fechado por X ms]
    ↓
calculateEyeOpenness() > threshold
    ↓
endBlink() - Validar duração
    ↓
if (duration válida) {
    blinkCount++
    onBlink callback
    PizzaCircle.selectSlice()
    AudioManager.playNote()
}
```

## 🎨 Padrões de Design

### 1. Observer Pattern (Callbacks)

```javascript
// Exemplo: Detector de Piscadas
const detector = new BlinkDetector();

detector.setOnBlink((data) => {
    console.log(`Piscada detectada: ${data.count}`);
    playSound();
});
```

### 2. MVC Pattern

```
View:        HTML + CSS + Canvas
Model:       AudioManager, GazeTracker
Controller:  TerrVisionApp (main.js)
```

### 3. Singleton Pattern (Context de Áudio)

```javascript
// Instância única compartilhada
this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
```

### 4. Factory Pattern (Osciladores)

```javascript
// AudioManager cria osciladores sob demanda
const oscillator = this.audioContext.createOscillator();
const gainNode = this.audioContext.createGain();
```

## ⚡ Performance

### Otimizações Implementadas

1. **Suavização de Gaze**
   - Mantém histórico das últimas 10 posições
   - Calcula média para movimento suave

2. **Renderização Eficiente**
   - Canvas renderiza apenas mudanças
   - AnimationFrame sincronizado (60 FPS)

3. **Amostragem de Frame**
   - BlinkDetector amostra a cada 10 pixels
   - Reduz processamento

4. **Garbage Collection**
   - Remoção de osciladores após término
   - Limpeza de histórico de gaze

### Métricas

```
FPS: 60 (ideal)
Latência de Som: < 50ms
Uso de Memória: 50-100MB
Uso de CPU: 5-15%
```

## 🔍 Debugging

### Console Logs

```javascript
// Audio
"♪ Tocando Do (261.63 Hz)"

// Gaze Tracking
"✓ WebGazer inicializado com sucesso"
"✓ Rastreamento iniciado"

// Blinks
"👁️ Piscada detectada! Total: 5"

// Errors
"✗ Erro ao acessar câmera: NotAllowedError"
```

### DevTools

1. **Console**: Monitore logs
2. **Performance**: Análise de FPS
3. **Network**: Verificar WebGazer.js
4. **Elements**: Inspecione canvas

### Debugging de Gaze

```javascript
// Visualizar dados de gaze
window.app.gazeTracker.setOnGazeUpdate((data) => {
    console.log(`X: ${data.x}, Y: ${data.y}, Conf: ${data.confidence}`);
});
```

### Debugging de Piscadas

```javascript
// Monitorar detecção
window.app.blinkDetector.setOnBlink((data) => {
    console.log(`Piscada: ${data.duration}ms, Total: ${data.count}`);
});
```

## 🔧 Customização Avançada

### Adicionar Novas Notas

```javascript
// Em audio-manager.js
this.notes = {
    'Do': 261.63,
    'Do#': 277.18,  // Novo!
    'Re': 293.66,
    // ...
};

this.noteSequence = ['Do', 'Do#', 'Re', /* ... */];
```

### Adicionar Novas Cores

```javascript
// Em pizza-circle.js
this.colors = [
    '#FF6B6B',  // Vermelho
    '#FF0000',  // Novo - Vermelho puro
    '#FF8C42',  // Laranja
    // ...
];
```

### Custom Callbacks

```javascript
// Em main.js
this.gazeTracker.setOnGazeUpdate((data) => {
    // Lógica customizada
    if (data.confidence > 0.95) {
        console.log('Rastreamento muito preciso!');
    }
});
```

## 📖 Referências

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [WebGazer.js](https://github.com/brownhci/WebGazer)
- [RequestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

---

**Terra Vision - Documentação Técnica v1.0**
