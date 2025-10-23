# Terra Vision - Guia de Instalação e Configuração

Instruções detalhadas para configurar e executar o Terra Vision.

## 📋 Pré-requisitos

- ✅ Navegador moderno (Chrome, Firefox, Safari, Edge)
- ✅ Webcam funcional conectada ao seu dispositivo
- ✅ Python 3.6+ OU Node.js 14+ (para servidor local)
- ✅ Conexão com internet (apenas para download inicial)

## 🚀 Instalação Rápida (5 minutos)

### Opção 1: Script Automático (Recomendado)

#### Windows (CMD ou PowerShell)
```batch
cd c:\Users\PCRW\Documents\Terra_vision
setup-webgazer.bat
```

#### Mac/Linux (Terminal)
```bash
cd ~/Documents/Terra_vision
chmod +x setup-webgazer.sh
bash setup-webgazer.sh
```

### Opção 2: Download Manual

1. Acesse: https://github.com/brownhci/WebGazer
2. Download do arquivo `webgazer.js`
3. Salve em: `Terra_vision/libs/webgazer.js`

## 🖥️ Executar Localmente

### Opção A: Python (Mais Simples)

#### Windows (CMD)
```batch
cd c:\Users\PCRW\Documents\Terra_vision
python -m http.server 8000
```

#### Windows (PowerShell)
```powershell
cd c:\Users\PCRW\Documents\Terra_vision
python -m http.server 8000
```

#### Mac/Linux
```bash
cd ~/Documents/Terra_vision
python3 -m http.server 8000
```

### Opção B: Node.js + HTTP-Server

```bash
# Instalar globalmente (primeira vez)
npm install -g http-server

# Executar
cd Terra_vision
http-server
```

### Opção C: VS Code Live Server

1. Instale extensão "Live Server"
2. Clique direito em `index.html`
3. Selecione "Open with Live Server"

### Opção D: Node.js Built-in (Node 18+)

```bash
cd Terra_vision
node --run-module=@http-server/cli -p 8000
```

## 🌐 Acessar no Navegador

Após iniciar o servidor, abra seu navegador e acesse:

```
http://localhost:8000
```

Se usou porta diferente:
```
http://localhost:PORTA
```

## ✅ Verificação Inicial

1. **Página carrega normalmente?**
   - Você vê o header "Terra Vision"
   - Vê as áreas para câmera e círculo
   - Vê os botões de controle

2. **Clique em "Iniciar Rastreamento"**
   - Deve aparecer modal pedindo permissão
   - Clique em "Permitir Acesso"

3. **Câmera aparece?**
   - Sua câmera deve exibir no lado esquerdo
   - Status deve mostrar "Câmera conectada"

4. **Círculo de notas aparece?**
   - Deve ver círculo com 8 cores diferentes
   - Cada cor é uma nota (Do, Re, Mi, etc)

## 🎯 Teste Funcionalidades

### Teste 1: Rastreamento Ocular

1. Clique em "Calibrar Câmera"
2. Olhe ao redor da tela
3. Veja o ponto vermelho seguir seu olhar
4. Estatísticas devem atualizar (Confiança, etc)

### Teste 2: Detecção de Piscadas

1. Pisque normalmente alguns vezes
2. Contador de "Piscadas" deve incrementar
3. Abra DevTools (F12) e veja logs

### Teste 3: Interação com Círculo

1. Olhe para uma fatia do círculo
2. Fatia deve ficar amarela (focada)
3. Feedback deve mostrar o nome da nota
4. Pisque: círculo deve ficar verde e tocar a nota

### Teste 4: Áudio

1. Ao piscar com uma fatia focada
2. Você deve ouvir a nota musical
3. Verifique volume do navegador/sistema

## 🔧 Solução de Problemas

### Problema: "WebGazer não encontrado"

**Solução 1: Execute script de setup**
```batch
setup-webgazer.bat        # Windows
bash setup-webgazer.sh    # Mac/Linux
```

**Solução 2: Download manual**
1. GitHub: brownhci/WebGazer
2. Salve em: `libs/webgazer.js`

**Solução 3: Verificar arquivo**
```bash
# Windows
dir libs\webgazer.js

# Mac/Linux
ls -la libs/webgazer.js
```

### Problema: Porta 8000 já em uso

Tente outra porta:
```bash
# Python
python -m http.server 8001

# HTTP-Server
http-server -p 8001
```

### Problema: CORS Error

Certifique-se de usar `http://localhost:8000` não `file:///`

### Problema: Câmera não funciona

1. Verifique permissão do navegador
2. Tente outro navegador
3. Verifique se outro programa usa câmera
4. Reinicie o navegador

### Problema: Som não toca

1. Verifique volume (sistema e navegador)
2. Clique em qualquer lugar da página (alguns navegadores exigem)
3. Confira console para erros (F12)

## 📝 Desenvolvimento

### Para Modificar o Código

1. Abra os arquivos em seu editor favorito
2. Altere os arquivos
3. Salve (Ctrl+S)
4. Navegador recarrega automaticamente (se usando Live Server)
5. Caso contrário, faça refresh manual (F5)

### Arquivo a Editar

- **HTML**: `index.html`
- **Estilos**: `css/style.css`
- **Lógica**: `js/main.js`
- **Áudio**: `js/audio-manager.js`
- **Rastreamento**: `js/gaze-tracker.js`
- **Piscadas**: `js/blink-detector.js`
- **Círculo**: `js/pizza-circle.js`

### Acessar Console Developer

- **Windows**: F12 ou Ctrl+Shift+I
- **Mac**: Cmd+Option+I
- **Linux**: F12

## 🎨 Personalização Básica

### Alterar Cores

Edite `css/style.css`, procure por `:root`:

```css
:root {
    --primary-color: #00a8ff;      /* Azul */
    --secondary-color: #ff6b6b;    /* Vermelho */
    --accent-color: #ffd93d;       /* Amarelo */
}
```

### Alterar Notas Musicais

Edite `js/audio-manager.js`:

```javascript
this.notes = {
    'Do': 261.63,
    'Re': 293.66,
    // Adicione mais aqui
};
```

### Aumentar/Diminuir Sensibilidade

Em `js/blink-detector.js`:

```javascript
this.blinkThreshold = 0.4;  // Menor = mais sensível
```

## 🚀 Deployment para Produção

### GitHub Pages

1. Faça fork do repositório
2. Mude nome para `seu-usuario.github.io`
3. Coloque arquivos na raiz
4. Acesse: `https://seu-usuario.github.io/`

### Netlify

1. Conecte seu GitHub
2. Escolha repositório
3. Deploy automático

### Vercel

1. Importe projeto
2. Framework: "Other"
3. Deploy automático

**Importante**: Use HTTPS em produção!

## 📊 Estrutura de Pastas (Completa)

```
Terra_vision/
├── index.html                 # Página principal
├── package.json              # Metadados do projeto
├── README.md                 # Documentação principal
├── TECHNICAL.md              # Documentação técnica
├── FAQ.md                    # Perguntas frequentes
├── CONTRIBUTING.md           # Guia de contribuição
├── SETUP.md                  # Este arquivo
├── LICENSE.md                # Licença MIT
├── .gitignore               # Arquivos ignorados pelo git
│
├── css/
│   └── style.css            # Estilos responsivos
│
├── js/
│   ├── main.js              # Aplicação principal
│   ├── audio-manager.js     # Gerenciador de áudio
│   ├── gaze-tracker.js      # Rastreador ocular
│   ├── blink-detector.js    # Detector de piscadas
│   └── pizza-circle.js      # Círculo de notas
│
├── libs/
│   ├── webgazer.js          # WebGazer (fazer download)
│   └── webgazer-instructions.js
│
├── sounds/
│   └── README.md            # Instruções para áudio
│
├── server.py                # Servidor Python
├── setup-webgazer.sh        # Setup para Mac/Linux
├── setup-webgazer.bat       # Setup para Windows
└── quickstart.sh            # Quick start script
```

## 💡 Dicas e Truques

### Executar Sempre na Mesma Pasta

Crie alias (Mac/Linux):
```bash
alias terra="cd ~/Documents/Terra_vision && python3 -m http.server 8000"
```

Depois execute:
```bash
terra
```

### Editar com VS Code

```bash
code ~/Documents/Terra_vision
```

### Limpar Cache do Navegador

- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Shift+Delete

### Debug de Gaze

Console:
```javascript
window.app.gazeTracker.setOnGazeUpdate((data) => {
    console.log(`X: ${data.x}, Y: ${data.y}`);
});
```

### Teste de Piscadas

Console:
```javascript
window.app.blinkDetector.setOnBlink((data) => {
    console.log(`Piscada: ${data.duration}ms`);
});
```

## 🆘 Precisa de Ajuda?

1. **Consulte o FAQ.md** para perguntas comuns
2. **Abra uma Issue** no GitHub
3. **Confira o console** (F12) para erros
4. **Leia TECHNICAL.md** para detalhes técnicos

## ✨ Próximos Passos

Após configuração bem-sucedida:

1. Explore a interface
2. Teste diferentes configurações
3. Calibre sua câmera para melhor precisão
4. Toque algumas músicas!
5. Se quiser, customize as cores e sons

---

**Terra Vision está pronto para uso!** 🎉

Aproveite a experiência de rastreamento ocular!
