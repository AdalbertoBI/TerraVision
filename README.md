# 🎶 Terra Vision

**Eye Gaze Tracking Music** - Interface ocular interativa para musicoterapia terapêutica sem contato físico.

![Versão](https://img.shields.io/badge/version-1.0.0-brightgreen)
![Licença](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-Ativo-success)

## 🚀 Início Rápido

Acesse a aplicação online:

### [👉 Abrir Terra Vision](https://AdalbertoInterprise.github.io/TerraVision/)

Ou execute localmente com Python:

```bash
cd TerraVision
python -m http.server 8000
# Abra em http://localhost:8000
```

## ✨ Recursos Principais

- 👁️ **Rastreamento Ocular**: Tecnologia WebGazer.js para tracking preciso do olhar
- 🎵 **Geração de Música**: Web Audio API com notas terapêuticas
- 🔄 **Calibração Gamificada**: Pizza colorida com grid 3x3 de aprendizado
- 💾 **Persistência de Modelo**: Calibração salva entre sessões via localStorage
- 🎯 **Detecção de Piscadas**: MediaPipe Face Mesh para ações confiáveis
- 🔥 **Heatmap Terapêutico**: Mapa visual de pontos focados acumulado
- ♿ **Acessibilidade**: Interface hands-free para usuários com limitações motoras

## 🎮 Como Usar

1. **Autorize a webcam** quando solicitado
2. **Calibre o sistema**: Clique nos 9 pontos da grade quando estiverem sob seu foco
3. **Confirme com piscada**: A cada clique, pisque para reforçar o aprendizado
4. **Interaja**: Mire o olhar nas fatias da pizza para ouvir as notas musicais

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **HTML5** | Estrutura da interface |
| **CSS3** | Design responsivo e animações |
| **JavaScript ES6** | Lógica modular (pasta `src/`) |
| **WebGazer.js** | Rastreamento ocular via ML |
| **MediaPipe Face Mesh** | Landmarks faciais e detecção de piscadas |
| **Web Audio API** | Síntese de sons terapêuticos |
| **Canvas 2D** | Renderização da pizza e heatmap |

## 📁 Estrutura do Projeto

```
TerraVision/
├── index.html              # Página principal
├── style.css              # Estilos globais
├── package.json           # Dependências (apenas para documentação)
├── libs/
│   ├── webgazer.js        # Biblioteca de eye-tracking
│   └── webgazer-instructions.js
├── src/
│   ├── main.js            # Orquestrador principal
│   ├── config.js          # Configurações e constantes
│   ├── audio.js           # Engine de áudio
│   ├── gazeTracker.js     # Rastreador ocular
│   ├── blinkDetector.js   # Detector de piscadas
│   ├── heatmap.js         # Renderizador de heatmap
│   ├── calibration.js     # Lógica de calibração
│   ├── pizzaRenderer.js   # Renderização da pizza
│   ├── controlManager.js  # Gerenciador de controles
│   ├── faceMeshProcessor.js # Processador MediaPipe
│   ├── therapyMode.js     # Modo terapêutico
│   ├── cameraPreview.js   # Preview da câmera
│   ├── calibrationModel.js # Modelo de dados
│   └── ui.js              # Componentes de UI
└── .github/
    └── workflows/
        └── pages.yml      # CI/CD para GitHub Pages
```

## 🔧 Configuração

Edite `src/config.js` para personalizar:

- **Thresholds de piscada** (sensibilidade)
- **Frequências musicais** (notas e efeitos)
- **Cores e animações** da interface
- **Parâmetros de suavização** do rastreamento

## 📊 Melhorias Implementadas

- ✅ **Cursor de gaze persistente e fluido** - Visualização contínua do foco ocular  
- ✅ **AudioContext com gesture resume** - Sem avisos de suspended state  
- ✅ **Persistência completa de modelo** - localStorage com save/load automático  
- ✅ **Calibração sequencial inteligente** - 9 pontos com reforço por piscada  
- ✅ **Smoothing exponencial otimizado** - Movimentos fluidos sem jitter  
- ✅ **ROI zoom 2× nos olhos** - Precisão aumentada na detecção ocular  
- ✅ **Direção da íris refinada** - MediaPipe com refineLandmarks  

## 🌐 Compatibilidade

| Navegador | Suporte | Notas |
|-----------|---------|-------|
| **Chrome 90+** | ✅ Completo | Recomendado |
| **Edge 90+** | ✅ Completo | Excelente performance |
| **Firefox 88+** | ✅ Completo | WebGL acelerado |
| **Safari 14+** | ⚠️ Parcial | Sem refineLandmarks MediaPipe |
| **Opera 76+** | ✅ Completo | Baseado em Chromium |

**Requisitos**:

- Webcam funcional
- JavaScript habilitado
- WebGL suportado (para MediaPipe)
- Conexão HTTPS ou localhost (para getUserMedia)

## 🤝 Contribuindo

Sugestões de melhorias:

- Feedback visual adaptativo
- Playlists terapêuticas customizadas
- Calibração inteligente dinâmica
- Relatórios pós-sessão com heatmaps
- Suporte multilíngue

## 📝 Licença

MIT © 2024-2025 Terra Vision Team

## 📞 Contato

- **GitHub**: [AdalbertoInterprise/TerraVision](https://github.com/AdalbertoInterprise/TerraVision)
- **Issues**: [Reportar bugs](https://github.com/AdalbertoInterprise/TerraVision/issues)

---

**Desenvolvido com ❤️ em outubro de 2025**  
Transformando o olhar em música terapêutica.
