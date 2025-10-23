# Feedback visual do olhar

Este documento descreve como o Terra Vision passa a representar o estado do rastreamento ocular após a revisão de outubro/2025. As alterações respondem às dificuldades identificadas durante as sessões clínicas, nas quais o ponto de feedback (popularmente chamado "bolinha preta") não evidenciava mudanças de estado e a confirmação de clique na calibração era ambígua.

## Resumo das melhorias

- O marcador `#gaze-dot` ganhou estados visuais distintos para diferenciação de rastreamento livre, foco em controles, espera por piscada e perda de sinal.
- A classe `UIManager` expõe utilitários para trocar o estado do ponto (`setGazeState`) e animar uma confirmação rápida (`flashGazeConfirmation`).
- O `ControlManager` publica eventos de foco (`focus`, `awaiting`, `activated`, `idle`), permitindo sincronizar a camada visual com a lógica de dwell + piscada.
- O alvo de calibração apresenta ícones para as fases **armado**, **coletando** e **confirmado**, evitando dúvidas sobre a necessidade de repetir o clique.

## Estados do `#gaze-dot`

| Estado (`data-state`) | Quando ocorre | Indicadores visuais |
| --- | --- | --- |
| `tracking` *(padrão)* | Rastreamento contínuo sobre a pizza | Aro azul, leve brilho e tamanho base |
| `control` | Usuário mantém o olhar sobre um botão de UI | Anel esverdeado, leve aumento (8%) e brilho reforçado |
| `confirm` | Dwell concluído, aguardando piscada | Cor âmbar, aumento (+15%) e halo destacado |
| `lost` | WebGazer não retornou coordenadas válidas | Tom azul acinzentado, sombra discreta e opacidade reduzida |

Além desses estados, `data-flash="true"` é aplicado momentaneamente para acionar a animação de onda (ripple) que sinaliza o disparo de um comando.

### API relevante

```javascript
// src/ui.js
ui.setGazeState('control');      // Atualiza a cor/escala do ponto
ui.flashGazeConfirmation();       // Desenha um ripple rápido (360 ms)
```

No fluxo principal (`src/main.js`), `handleControlFocusState` liga os eventos emitidos pelo `ControlManager` a essas funções para manter a camada visual coerente.

## Fases do alvo de calibração

Durante a calibração, o botão central alterna automaticamente:

- **armed (`●`)**: aguardando clique do usuário.
- **collecting (`⌛`)**: dados sendo coletados (olhar deve permanecer no alvo).
- **confirmed (`✔`)**: ponto registrado; o próximo alvo será apresentado.

Essas etapas são controladas por `overlay.dataset.state` e `marker.dataset.phase` em `src/calibration.js`. A folha de estilos (`style.css`) aplica cores e animações específicas para cada momento, reduzindo o risco de o participante achar que o clique não foi reconhecido.

## Integrando com outras features

- O método `ControlManager.handleGaze` agora notifica mudanças de foco. Desenvolvedores podem reaproveitar o callback passado no construtor para acionar telemetria ou instrumentar métricas de dwell.
- O `UIManager.updateGazeDot` passou a limitar a posição aos limites do palco para evitar que o marcador desapareça em telas ultrawide ou durante a calibração com deslocamento grande.
- Para customizações futuras (ex.: temas de alto contraste), basta sobrescrever as variáveis `--gaze-border` e `--gaze-fill` em `style.css` por meio de seletores `[data-state]`.

## Boas práticas observadas

1. **Feedback redundante**: cor + escala + animação tornam claro o estado atual mesmo em condições de baixa acuidade visual.
2. **Datasets semânticos**: usar `data-state` e `data-phase` facilita automatizar testes de UI e inspecionar o DOM via DevTools.
3. **Callback único**: centralizar a lógica de cores em `UIManager.handleControlFocusState` evita divergências entre o ponto visual e a lógica de dwell.

---

> Última atualização: 23 de outubro de 2025. Documente ajustes futuros neste arquivo para manter o histórico de decisões de UX ligadas ao feedback visual.
