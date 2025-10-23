# Pré-visualização de Câmera e Calibração Adaptativa

## Visão Geral

O Terra Vision agora oferece um quadro fixo de pré-visualização da câmera utilizando a API `getUserMedia`. O fluxo de vídeo é espelhado (modo "selfie") e recebe filtros ajustáveis que ajudam a melhorar a nitidez do olhar durante a calibração.

## Benefícios

- **Feedback imediato**: o usuário verifica iluminação, enquadramento e foco sem sair da interface principal.
- **Consistência entre módulos**: o mesmo `MediaStream` pode ser reutilizado pelo WebGazer, minimizando rearranques de dispositivos.
- **Estatísticas leves**: frames por segundo (FPS), uptime e resolução são coletados para diagnóstico em tempo real.

## Calibração Incremental

O antigo offset fixo foi substituído por um modelo afim incremental que:

1. Acumula amostras normalizadas de gaze vs. alvo durante a calibração.
2. Aplica regularização leve e decaimento exponencial para favorecer pontos recentes.
3. Persiste os coeficientes no `localStorage`, garantindo continuidade entre sessões do mesmo navegador.

### APIs Principais

- `CameraPreview.start()` — Solicita permissão de câmera, inicia o stream e emite eventos de estado/statísticas.
- `CameraPreview.applyFilters()` — Ajusta brilho, contraste, saturação, etc.
- `CalibrationModel.update(raw, target)` — Incorpora um par de pontos ao sistema de regressão.
- `CalibrationModel.predict(point)` — Corrige posições de gaze já com os pesos aprendidos.

## Próximos Passos Sugeridos

- Expor sliders de filtro na UI para ajustes finos pelo terapeuta.
- Renderizar um histograma simples de distribuição de erro após a calibração.
- Permitir reaproveitamento parcial das matrizes acumuladas ao iniciar nova calibração, reduzindo tempo de coleta.
