# Contribuindo para Terra Vision

Obrigado por estar interessado em contribuir para o Terra Vision! Este documento descreve como você pode contribuir.

## 📋 Antes de Começar

- Leia o [README.md](README.md)
- Entenda a [arquitetura do projeto](TECHNICAL.md)
- Verifique as issues abertas em GitHub

## 🐛 Reportando Bugs

### Como Reportar

1. **Verifique se já não foi reportado**: Busque nas issues abertas
2. **Use um título descritivo**: "Câmera não funciona em Firefox"
3. **Descreva os passos para reproduzir**:
   ```
   1. Abrir index.html
   2. Clicar em "Iniciar"
   3. Permitir câmera
   4. [Erro ocorre]
   ```
4. **Descreva o comportamento observado**:
   ```
   A câmera não é exibida no canvas
   ```
5. **Descreva o comportamento esperado**:
   ```
   A câmera deveria aparecer após permissão
   ```

### Informações Úteis

- Navegador e versão: "Chrome 95.0"
- Sistema operacional: "Windows 11"
- Dispositivo: "Webcam USB 1080p"
- Console errors: Cole screenshot do console

## 💡 Sugerindo Melhorias

### Antes de Sugerir

1. Use um **título claro e descritivo**
2. Forneça uma **descrição detalhada**
3. Liste **exemplos concretos**
4. Descreva por que seria **útil**

### Exemplo

**Título**: Adicionar modo dark/light

**Descrição**: 
O usuário deveria poder alternar entre tema claro e escuro para melhor conforto visual.

**Benefício**:
Reduz fadiga ocular em ambientes escuros e melhora acessibilidade.

## 🛠️ Processo de Desenvolvimento

### 1. Fork do Projeto

```bash
# Clone o seu fork
git clone https://github.com/seu-usuario/terra-vision.git
cd terra-vision
```

### 2. Crie uma Branch

```bash
# Para bug fix
git checkout -b fix/nome-do-bug

# Para nova feature
git checkout -b feature/nome-da-feature
```

### 3. Faça suas Alterações

- Siga os padrões de código do projeto
- Adicione comentários quando necessário
- Teste extensivamente

### 4. Commit com Mensagens Claras

```bash
# Bom
git commit -m "Fix: corrigir detecção de piscadas em Firefox"
git commit -m "Feat: adicionar calibração de 5 pontos"

# Evitar
git commit -m "mudança"
git commit -m "fix bug"
```

### 5. Push para sua Branch

```bash
git push origin feature/nome-da-feature
```

### 6. Abra um Pull Request

## 📝 Diretrizes de Código

### JavaScript

```javascript
// ✅ Bom
/**
 * Toca uma nota musical
 * @param {string} note - Nome da nota
 * @param {number} duration - Duração em segundos
 */
playNote(note, duration = 0.5) {
    // Comentário explicando lógica complexa
    const frequency = this.getFrequency(note);
    // ...
}

// ❌ Evitar
function play(n, d) {
    // sem documentação
    let f = this.freq(n);
}
```

### Nomes de Variáveis

```javascript
// ✅ Bom
const gazePosition = { x, y };
const isTracking = true;
const audioContext = new AudioContext();

// ❌ Evitar
const gp = { x, y };
const t = true;
const ac = new AudioContext();
```

### Funções

- Máximo 50 linhas por função
- Responsabilidade única
- Parâmetros bem nomeados

### Comentários

```javascript
// ✅ Bom - Explica o "por quê"
// Suaviza a posição usando histórico para reduzir jitter
const smoothX = this.calculateMovingAverage(history);

// ❌ Evitar - Explica o óbvio
// Incrementa i
i++;
```

### CSS

```css
/* ✅ Bom - Claro e específico */
.pizza-circle__slice--focused {
    box-shadow: 0 0 20px rgba(255, 217, 61, 0.6);
}

/* ❌ Evitar - Genérico */
.highlight {
    box-shadow: 0 0 20px yellow;
}
```

## 🧪 Testando

### Testes Manuais

1. **Teste em múltiplos navegadores**:
   - Chrome
   - Firefox
   - Safari
   - Edge

2. **Teste em múltiplas resoluções**:
   - 1920x1080 (desktop)
   - 1024x768 (tablet)
   - 375x667 (mobile)

3. **Teste funcionalidades principais**:
   - Acesso à câmera
   - Rastreamento de olhar
   - Detecção de piscadas
   - Emissão de sons

### Console

```javascript
// Verifique que não há erros
console.log('✓ Sem erros no console');

// Teste os componentes
window.app.audioManager.playNote('Do');
window.app.pizzaCircle.updateFocus(100, 100);
```

## 📚 Documentação

### Ao Adicionar Recursos

1. **Atualize o README.md** se mudar funcionalidade
2. **Atualize o TECHNICAL.md** se mudar arquitetura
3. **Adicione comentários** no código
4. **Documente APIs** públicas

## 🎯 Área de Prioridades

### Prioridade Alta

- Melhorar detecção de piscadas
- Aumentar suporte de navegadores
- Melhorar performance em mobile

### Prioridade Média

- Adicionar temas customizáveis
- Melhorar calibração
- Adicionar analytics

### Prioridade Baixa

- Efeitos visuais adicionais
- Som personalizado
- Exportação de dados

## ✅ Checklist antes de Submeter PR

- [ ] Código segue padrões do projeto
- [ ] Testei em múltiplos navegadores
- [ ] Sem console errors/warnings
- [ ] Comentários adicionados
- [ ] README atualizado se necessário
- [ ] Funcionalidade testada completamente
- [ ] Sem código duplicado
- [ ] Performance não foi degradada

## 🤝 Código de Conduta

- Seja respeitoso com outros contribuidores
- Forneça feedback construtivo
- Reconheça trabalhos de outros
- Reporte issues de forma educada

## 📞 Contato

- Issues: Use GitHub Issues
- Email: seu-email@example.com
- Discussões: Use GitHub Discussions

## 🙏 Agradecimentos

Obrigado por contribuir para fazer o Terra Vision melhor!

---

**Feliz contribuindo!** 🎉
