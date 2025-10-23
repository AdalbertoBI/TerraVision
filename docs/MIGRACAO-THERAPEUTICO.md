# 🔄 Guia de Migração - Terra Vision Terapêutico

## Resumo das Mudanças

Seu Terra Vision foi atualizado com **funcionalidades avançadas de uso terapêutico**!

### ✨ Novos Recursos

#### 1. **Sistema de Calibração Avançada** (`calibration.js`)
- ✅ Calibração com 9 pontos em grid 3x3
- ✅ Validação automática de acurácia
- ✅ Recalibração a qualquer momento
- ✅ Armazenamento de perfil do usuário
- ✅ Histórico de calibrações

#### 2. **Modo Terapêutico Completo** (`therapy-mode.js`)
- ✅ 4 modos pré-configurados (Relaxamento, Treinamento, Concentração, Personalizado)
- ✅ Sessões com duração variável (5-20 minutos)
- ✅ Ajuste dinâmico de dificuldade (1-3 níveis)
- ✅ Registro de todas as sessões
- ✅ Estatísticas e progresso histórico
- ✅ Milestones e conquistas

#### 3. **Interface Acessível** (`ui-manager.js`)
- ✅ 3 temas (Escuro, Claro, Alto Contraste)
- ✅ 4 tamanhos de fonte
- ✅ Controle de volume independente
- ✅ Notificações visuais e sonoras
- ✅ Modals com diálogos de confirmação
- ✅ Conformidade WCAG 2.1 AA

#### 4. **Detecção de Piscadas Melhorada** (`blink-detector.js`)
- ✅ Redução de falsos positivos
- ✅ Análise multifrequência
- ✅ Calibração automática de limiar
- ✅ Histórico de confiabilidade
- ✅ Estatísticas em tempo real

#### 5. **Interface com Bootstrap** (`index-new.html`)
- ✅ Totalmente responsiva
- ✅ Design moderno e acessível
- ✅ Componentes prontos
- ✅ Barra de navegação
- ✅ Modals nativos Bootstrap

---

## 📁 Arquivos Novos

```
📦 Aplicação
├── 📄 index-new.html ⭐ NOVO - Use este arquivo!
├── 📄 js/calibration.js ⭐ NOVO
├── 📄 js/therapy-mode.js ⭐ NOVO
├── 📄 js/ui-manager.js ⭐ NOVO
├── 📄 js/main-therapeutic.js ⭐ NOVO
├── 📄 css/therapeutic.css ⭐ NOVO
└── 📄 docs/README-THERAPEUTICO.md ⭐ NOVO
```

### Arquivos Atualizados

```
├── 📝 js/blink-detector.js (melhorado)
├── 📝 docs/README.md (informações adicionais)
└── 📝 docs/TECHNICAL.md (novas APIs)
```

### Arquivos Antigos (Ainda Funcionam)

```
├── index.html (versão anterior - ainda funciona)
├── js/main.js (versão anterior - ainda funciona)
├── css/style.css (versão anterior - ainda funciona)
```

---

## 🚀 Como Usar a Nova Versão

### Opção 1: Usar Nova Interface (RECOMENDADO)

1. **Abra `index-new.html` em vez de `index.html`**

```
http://localhost:8000/index-new.html
```

2. Clique em "▶️ Começar Sessão"

3. Escolha um modo terapêutico:
   - 🧘 **Relaxamento**: 10 min, fácil, feedback suave
   - 🎯 **Treinamento**: 15 min, médio, feedback moderado
   - 🔬 **Concentração**: 20 min, difícil, feedback intenso
   - ⚙️ **Personalizado**: Configure tudo

### Opção 2: Manter Interface Anterior

Se preferir manter o `index.html` original:

```
http://localhost:8000/index.html
```

Funciona normalmente! Os módulos novos estão disponíveis via console/API.

---

## 🔧 Alterações Técnicas

### Estrutura de Arquivos

**Antes:**
```
js/
├── main.js
├── audio-manager.js
├── gaze-tracker.js
├── blink-detector.js
└── pizza-circle.js
```

**Depois:**
```
js/
├── main-therapeutic.js ⭐
├── calibration.js ⭐
├── therapy-mode.js ⭐
├── ui-manager.js ⭐
├── audio-manager.js (inalterado)
├── gaze-tracker.js (inalterado)
├── blink-detector.js (melhorado)
└── pizza-circle.js (inalterado)
```

### Nova Estrutura HTML

**Antes:**
```html
<button id="start-btn">Iniciar</button>
<button id="calibrate-btn">Calibrar</button>
```

**Depois:**
```html
<!-- Seleção de Modo -->
<button onclick="selectTherapyMode('relaxation')">🧘 Relaxamento</button>
<button onclick="selectTherapyMode('training')">🎯 Treinamento</button>

<!-- Controles de Sessão -->
<button id="pause-btn">⏸️ Pausar</button>
<button id="difficulty-decrease">➖ Diminuir</button>
<button id="difficulty-increase">➕ Aumentar</button>
<button id="end-session-btn">⏹️ Finalizar</button>

<!-- Estatísticas em Tempo Real -->
<div id="elapsed-time">00:00</div>
<div id="correct-notes">0</div>
<div id="accuracy">0%</div>
```

### Novo Sistema de Bootstrapping

**Antes:**
```javascript
const app = new TerrVisionApp();
```

**Depois:**
```javascript
const app = TerrVisionAppTherapeutic.getInstance();

// Usar novos módulos
await app.calibration.startCalibration();
await app.therapyMode.startSession('relaxation');
app.uiManager.setTheme('highcontrast');
```

---

## 📊 Migração de Dados

### Dados Armazenados Localmente

Os dados antigos **NÃO serão deletados automaticamente**. Você pode:

#### Manter dados antigos:
```javascript
// Seus perfis e histórico anterior continuam salvos
localStorage.getItem('terraVision_calibrationProfile')
localStorage.getItem('terraVision_sessionHistory')
```

#### Limpar dados:
```javascript
// Se quiser começar do zero
localStorage.clear();
```

#### Exportar dados:
```javascript
// Fazer backup antes de limpar
const backup = {
  calibration: localStorage.getItem('terraVision_calibrationProfile'),
  sessions: localStorage.getItem('terraVision_sessionHistory')
};
console.log(JSON.stringify(backup));
```

---

## 🎓 Exemplos de Uso

### Exemplo 1: Iniciar Sessão de Treinamento

```javascript
const app = TerrVisionAppTherapeutic.getInstance();

// Aguardar inicialização
setTimeout(async () => {
  // Iniciar sessão de treinamento de 15 minutos
  await app.therapyMode.startSession('training');
  
  // A sessão automaticamente:
  // - Mostra UI de sessão
  // - Inicia rastreamento
  // - Registra eventos de piscadas
  // - Atualiza estatísticas em tempo real
}, 1000);
```

### Exemplo 2: Usar Calibração

```javascript
// Antes de qualquer sessão, calibre:
const calibration = app.calibration;

// Mostrar modal de calibração
await calibration.startCalibration();

// Verificar acurácia
console.log(`Acurácia: ${calibration.getAccuracy()}%`);

// Se < 60%, sugerir recalibração
if (!calibration.isCalibrated()) {
  console.log('Por favor, recalibrar para melhor precisão');
  await calibration.recalibrate();
}
```

### Exemplo 3: Customizar Modo

```javascript
// Criar modo personalizado
const customSettings = {
  duration: 30, // 30 minutos
  difficulty: 2
};

await app.therapyMode.startSession('custom', customSettings);

// Ajustar dificuldade durante sessão
app.therapyMode.changeDifficulty(3); // Aumentar para máximo
```

### Exemplo 4: Acessibilidade

```javascript
// Habilitar modo alto contraste
app.uiManager.setTheme('highcontrast');

// Aumentar tamanho de fonte
app.uiManager.setFontSize('xlarge');

// Reduzir volume
app.uiManager.setVolume(0.3);

// Desabilitar feedback sonoro
app.uiManager.toggleAudioFeedback(false);
```

---

## ⚠️ Questões Comuns

### P: Preciso refazer tudo?

**R:** Não! Os dados antigos continuam salvos. Você pode:
- Continuar usando `index.html` antigo
- Ou tentar `index-new.html` novo
- Ambos funcionam!

### P: Meus perfis de calibração antigos ainda funcionam?

**R:** Sim! Os arquivos de calibração antigos são carregados automaticamente.

### P: Posso usar os dois ao mesmo tempo?

**R:** Não recomendado. Escolha um e use.

### P: Como voltar à versão anterior?

**R:** Simplesmente use `index.html` em vez de `index-new.html`:
```
http://localhost:8000/index.html
```

### P: Os módulos novos funcionam com a HTML antiga?

**R:** Sim, mas sem visualização adequada. A nova HTML é otimizada para os novos módulos.

---

## 📚 Documentação de Referência

### Novos Módulos

| Módulo | Arquivo | Função Principal |
|--------|---------|------------------|
| **Calibração** | `calibration.js` | Sistema 9 pontos |
| **Terapia** | `therapy-mode.js` | Gerenciador sessões |
| **UI** | `ui-manager.js` | Componentes interface |
| **Principal** | `main-therapeutic.js` | Orquestrador |

### Documentação Completa

1. **README-THERAPEUTICO.md** - Guia completo de uso terapêutico
2. **TECHNICAL.md** - Documentação técnica detalhada
3. **API das Classes** - Referência de métodos

---

## 🔄 Checklist de Migração

- [ ] Baixou `index-new.html`?
- [ ] Testou calibração com 9 pontos?
- [ ] Fez pelo menos 1 sessão?
- [ ] Verificou estatísticas?
- [ ] Testou modo alto contraste?
- [ ] Leu README-THERAPEUTICO.md?
- [ ] Ajustou configurações conforme necessário?
- [ ] Fez backup de dados importantes?

---

## 🆘 Troubleshooting de Migração

### "index-new.html não carrega"

**Solução:**
1. Verifique se todos os .js novos estão em `js/`
2. Verifique se `therapeutic.css` está em `css/`
3. Verifique console (F12) para erros
4. Confirme caminho de bootstrap CDN

### "Módulos não encontrados"

**Solução:**
```bash
# Certifique-se de que todos estes existem:
ls js/calibration.js
ls js/therapy-mode.js
ls js/ui-manager.js
ls js/main-therapeutic.js
```

### "Dados antigos desapareceram"

**Solução:**
```javascript
// Recuperar de localStorage
console.log(localStorage.getItem('terraVision_sessionHistory'));
```

---

## 📞 Suporte

Para dúvidas sobre migração:

1. Consulte **README-THERAPEUTICO.md**
2. Verifique **TECHNICAL.md**
3. Abra DevTools (F12) → Console
4. Procure por mensagens de erro (🔴 vermelho)

---

## ✅ Próximas Etapas

1. ✅ Baixe `index-new.html`
2. ✅ Teste calibração
3. ✅ Faça primeira sessão
4. ✅ Explore configurações
5. ✅ Compartilhe feedback!

---

**Bem-vindo à versão Terapêutica do Terra Vision!** 🧠👁️✨

Data: Outubro 2025  
Versão: 1.1.0 → 1.2.0  
Status: ✅ Migração Completa
