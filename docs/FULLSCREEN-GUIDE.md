# 📺 Guia de Modo Tela Cheia (Fullscreen)

## Visão Geral

O modo tela cheia do Terra Vision permite visualizar a pizza de rastreamento em toda a tela do dispositivo, oferecendo melhor imersão e interatividade. Este guia explica como usar este recurso.

---

## 🎯 O Que é Fullscreen?

O modo fullscreen (tela cheia) dedica toda a área da tela para exibir a pizza de rastreamento, com:

- 📱 **Escalamento dinâmico**: A pizza se adapta ao tamanho da tela
- 🎨 **Sem distrações**: Remove controles e navegação
- ⌨️ **Atalhos rápidos**: Saída fácil com ESC
- 👆 **Touch-friendly**: Duplo toque em mobile
- 🖱️ **Multi-dispositivo**: Desktop, tablet, smartphone

---

## 🚀 Como Entrar em Fullscreen

### Método 1: Botão de Interface

1. Localize o botão **"📺 Tela Cheia"** no painel de controles
2. Clique para ativar modo fullscreen
3. A pizza será expandida para preencher toda a tela

### Método 2: Teclado (Desktop)

```
Pressione: F
Resultado: Ativa/desativa fullscreen instantaneamente
```

### Método 3: Duplo Toque (Mobile/Tablet)

```
Ação:      Toque duplo na pizza
Resultado: Ativa/desativa fullscreen
Tempo:     Reconhece toques dentro de 300ms
```

### Método 4: Botão Fullscreen (Firefox/Safari)

```
Ação:      Clique no botão fullscreen da pizza
Resultado: Entra em modo fullscreen nativo
```

---

## 🎨 Interface Fullscreen

### Layout

```
┌─────────────────────────────────┐
│   BACKGROUND TERAPÊUTICO       │
│   (Cor de fundo conforme tema)  │
│                                 │
│      ┌───────────────────┐     │
│      │                   │     │
│      │   PIZZA ZENTRADA  │     │
│      │  (Escalada 90%)   │     │
│      │                   │     │
│      └───────────────────┘     │
│                                 │
│   [ESC para sair]               │
│   Toque/Clique overlay → Sair   │
└─────────────────────────────────┘
```

### Elementos da Interface

| Elemento | Descrição | Como Usar |
|----------|-----------|-----------|
| Pizza Centralizada | Círculo de rastreamento | Segue movimento dos olhos |
| Overlay Transparente | Camada escura ao redor | Clique para sair |
| Texto "Pressione ESC para sair" | Dica de saída | Leia instruções |
| Botão Fechar | Canto superior direito | Clique para sair |

---

## ⏹️ Como Sair do Fullscreen

### Método 1: Tecla ESC (Desktop)

```
Pressione: ESC
Resultado: Sai instantaneamente do fullscreen
```

### Método 2: Clique no Overlay

```
Ação:      Clique fora da pizza (área escura)
Resultado: Retorna à visualização normal
```

### Método 3: Botão Fechar

```
Localização: Canto superior direito
Ação:        Clique no botão "✕"
Resultado:   Retorna à visualização normal
```

### Método 4: Botão Fullscreen do Navegador

```
Firefox:  Clique ícone fullscreen do navegador
Chrome:   Clique ícone fullscreen do navegador
Safari:   Duplo toque no video
```

---

## 📐 Escalamento e Dimensionamento

### Como a Pizza é Escalada

A pizza se adapta usando a seguinte lógica:

```javascript
// Cálculo de dimensionamento
maxSize = min(screenWidth, screenHeight) × 0.95

// Exemplo em Full HD (1920×1080)
maxSize = min(1920, 1080) × 0.95
maxSize = 1080 × 0.95
maxSize = 1026 pixels

// Resultado: Pizza fica com 1026×1026 pixels
// Centralizada na tela com margens iguais
```

### Comportamento em Diferentes Telas

| Dispositivo | Resolução | Tamanho Pizza | Mantém Proporção |
|------------|----------|--------------|-----------------|
| Mobile | 390×844 | ~372×372 | ✅ Sim |
| Tablet | 810×1080 | ~770×770 | ✅ Sim |
| Desktop | 1920×1080 | ~1026×1026 | ✅ Sim |
| 4K | 3840×2160 | ~2052×2052 | ✅ Sim |
| Ultrawide | 2560×1440 | ~1368×1368 | ✅ Sim |

**✨ Garantia**: A pizza **nunca fica deformada**, sempre mantém proporção 1:1

---

## 🎮 Interatividade no Fullscreen

### Movimento em Tempo Real

Enquanto em fullscreen, a pizza:

```
✓ Responde ao movimento dos olhos
✓ Atualiza a cada 30ms (60 FPS)
✓ Mostra feedback sonoro (se ativado)
✓ Registra sessão normalmente
```

### Feedback Visual

```
🟢 Ponto verde: Gaze point (onde está olhando)
🟡 Anel amarelo: Calibração OK
🔴 Anel vermelho: Fora de calibração
💫 Animações: Feedback de acertos
```

---

## 🎯 Casos de Uso

### 1. Sessão Terapêutica Immersiva

```
Quando usar: Treinos de concentração
Benefícios:  - Reduz distrações externas
             - Aumenta imersão
             - Melhora foco do usuário
```

### 2. Apresentação/Demonstração

```
Quando usar: Apresentar rastreamento para observadores
Benefícios:  - Pizza bem grande e visível
             - Sem elementos de interface
             - Aspecto profissional
```

### 3. Avaliação de Calibração

```
Quando usar: Verificar precisão em escala grande
Benefícios:  - Erros maiores ficam óbvios
             - Mais fácil ver desalinhamento
             - Melhor para ajustes finos
```

### 4. Treino Visual

```
Quando usar: Exercícios de rastreamento controlado
Benefícios:  - Sem distração pela interface
             - Pizza bem grande para precisão
             - Imersivo para sessões longas
```

---

## 📱 Fullscreen em Dispositivos Mobile

### Suporte por Plataforma

| Plataforma | Suporte | Método | Status |
|-----------|--------|--------|--------|
| Android Chrome | ✅ | Duplo toque, F | Completo |
| Android Firefox | ✅ | Duplo toque, F | Completo |
| iOS Safari | ✅ | Duplo toque | Completo |
| iOS Chrome | ✅ | Duplo toque | Completo |
| iPad | ✅ | Duplo toque, F | Completo |

### Gestos Touch

```
Duplo Toque      → Toggle fullscreen (ON/OFF)
Esperar 300ms    → Requerido entre toques
Toque Simples    → Clica no overlay para sair
```

### Observações Mobile

⚠️ **Importante**:
- O navegador pode mostrar controles durante transição
- Orientação retrato vs paisagem funciona
- Girando dispositivo adapta automaticamente
- Não bloqueia giroscópio do navegador

---

## ⌨️ Atalhos de Teclado

| Atalho | Função | Desktop | Mobile |
|--------|--------|---------|--------|
| F | Toggle fullscreen | ✅ | ❌ |
| ESC | Sair fullscreen | ✅ | ✅ |
| Enter | Confirmar fullscreen (alguns navegadores) | ⚠️ | ❌ |
| Space | Pausar sessão (se ativada) | ✅ | ✅ |

---

## 🖥️ Compatibilidade de Navegadores

### Desktop

| Navegador | Fullscreen | Zoom Automático | Touch | Status |
|-----------|-----------|-----------------|-------|--------|
| Chrome | ✅ | ✅ | ⚠️ | Completo |
| Firefox | ✅ | ✅ | ⚠️ | Completo |
| Safari | ✅ | ✅ | ✅ | Completo |
| Edge | ✅ | ✅ | ⚠️ | Completo |
| Opera | ✅ | ✅ | ⚠️ | Completo |

### Mobile

| Navegador | Fullscreen | Duplo Toque | Status |
|-----------|-----------|-------------|--------|
| Chrome Android | ✅ | ✅ | Completo |
| Firefox Android | ✅ | ✅ | Completo |
| Safari iOS | ✅ | ✅ | Completo |
| Chrome iOS | ✅ | ✅ | Completo |
| Samsung Internet | ✅ | ✅ | Completo |

---

## 🎨 Temas no Fullscreen

### Comportamento por Tema

```
TEMA ESCURO:
- Fundo: Preto (#0a0e27)
- Pizza: Cores vibrantes bem visíveis
- Ideal para: Ambientes escuros

TEMA CLARO:
- Fundo: Branco (#f5f5f5)
- Pizza: Cores escuras para contraste
- Ideal para: Ambientes iluminados

ALTO CONTRASTE:
- Fundo: Preto puro (#000000)
- Pizza: Amarelo e branco (#ffff00, #ffffff)
- Ideal para: Baixa visão, acessibilidade
```

### Mudar Tema

Durante fullscreen, o tema segue suas configurações:

1. Saia do fullscreen (ESC)
2. Vá para ⚙️ Configurações
3. Altere o tema
4. Volte ao fullscreen (F ou botão)

---

## 📊 Performance em Fullscreen

### Requisitos de Sistema

```
✓ Desktop Moderno:     60 FPS
✓ Tablet recente:      30-60 FPS
✓ Smartphone moderno:  30 FPS
✓ Conexão mínima:      2 Mbps (para câmera)
```

### Otimizações Automáticas

O Terra Vision automaticamente:

```
✓ Desativa animações em modo reduced-motion
✓ Limita rendering em dispositivos lentos
✓ Adapta taxa de quadros à CPU
✓ Reduz overhead da interface
```

### Troubleshooting de Performance

**Se ficar lento**:

1. Saia do fullscreen (ESC)
2. Reduza resolução da câmera (XGA)
3. Reduza zoom da câmera (1x-2x)
4. Feche abas/apps em background
5. Volte ao fullscreen

---

## 🔒 Privacidade e Segurança

### Dados em Fullscreen

```
✓ Câmera permanece local (no seu navegador)
✓ Sem transmissão para servidor
✓ Sem gravação de tela
✓ Seu rastreamento é confidencial
✓ HTTPS requerido (segurança)
```

### Requisições de Permissão

Fullscreen pode solicitar:

```
✓ Permissão de câmera (já foi solicitada)
✓ Permissão de fullscreen (browser confirma)
✓ Permissão de áudio (para feedback)
```

---

## 🐛 Troubleshooting

### Fullscreen não ativa

**Possíveis causas**:

```
1. Navegador não suporta → Tente Chrome ou Firefox
2. HTTPS não ativado → Use conexão segura
3. Plugin bloqueando → Desabilite Ad Blockers
4. JavaScript desativado → Ative JavaScript
```

**Soluções**:

- Recarregar página (F5)
- Tentar em navegador diferente
- Limpar cache (Ctrl+Shift+Delete)
- Verificar console (F12) para erros

### Pizza não aparece centralizada

**Soluções**:

1. Verificar resolução da tela (F11)
2. Girar tela (se mobile)
3. Zoom do navegador em 100% (Ctrl+0)
4. Recarregar página

### Sair do fullscreen não funciona

**Tentar**:

```
1. Pressionar ESC (principal)
2. Pressionar F (toggle)
3. Clicar fora da pizza (overlay)
4. Clicar botão "X" (canto superior)
5. Pressionar Alt+Tab (mude app) + Alt+Tab (volte)
```

### Touch duplo não funciona (mobile)

**Verificar**:

```
1. Intervalo entre toques < 300ms?
2. Ambos os toques no mesmo local?
3. Sem movimento entre toques?
4. Browser suporta eventos touch?
```

**Solução**: Use o botão de interface ou tecla F

---

## 📸 Captura de Tela em Fullscreen

### Como Capturar

```
Desktop:
1. Pressione Print Screen (ou Shift+S no Chrome)
2. Salve conforme seu SO

Mobile:
1. Android: Power + Volume Down
2. iOS: Power + Volume Up (ou Home + Power)
```

### Usar Screenshots

```
📋 Para documentação
📊 Para relatórios
🐛 Para reportar bugs
📈 Para análise
```

---

## ✅ Checklist - Antes de Usar Fullscreen

```
☐ Câmera funcionando
☐ Rastreamento calibrado
☐ Pizza respondendo adequadamente
☐ Som configurado (se usar feedback)
☐ Tema escolhido
☐ Zoom de câmera OK
☐ Brilho/contraste OK
☐ Resolução adequada
☐ Sem coberturas na câmera
☐ Iluminação frontal boa
```

---

## 🎓 Dicas Avançadas

### Usar Fullscreen com Gamepad

```javascript
// Se seu app suportar gamepad:
- Press Button A → Toggle fullscreen
- Press Button B → Sair
- Press Button X → Capturar screenshot
```

### Fullscreen com Múltiplos Monitores

```
Comportamento: Fullscreen usa monitor do navegador
Dica:          Arraste janela para monitor desejado
               Depois entre em fullscreen
```

### Integração com Scripts

```javascript
// Se você for desenvolver:
// Fullscreen manager está disponível como window.fullscreenManager
window.fullscreenManager.enterFullscreen();
window.fullscreenManager.exitFullscreen();
window.fullscreenManager.toggleFullscreen();
```

---

## 📞 Suporte e Feedback

### Reportar Problemas

Se encontrar problemas:

1. Capture screenshot (Print Screen)
2. Anote passo-a-passo para reproduzir
3. Abra console (F12) e copie erros
4. Reporte com seus detalhes

### Sugestões de Melhoria

Tem ideias? Sugira:

```
- Melhor atalho para mobile
- Diferentes modos de overlay
- Novos tipos de feedback
- Integração com dispositivos especiais
```

---

## 📝 Histórico de Versões

**v1.0** - Versão Inicial

```
✓ Fullscreen básico com Fullscreen API
✓ Suporte multi-browser (webkit, moz, ms)
✓ Touch double-tap para mobile
✓ Escalamento dinâmico
✓ Atalhos de teclado (F, ESC)
✓ Overlay com opções de saída
✓ Suporte a 6+ plataformas
```

---

**Última atualização**: 2024  
**Compatibilidade**: Terra Vision v2.0+  
**Navegadores testados**: Chrome, Firefox, Safari, Edge (últimas 3 versões)
