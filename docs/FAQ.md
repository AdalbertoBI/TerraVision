# Terra Vision - Perguntas Frequentes (FAQ)

## 🎯 Funcionamento Geral

### P: O que é Terra Vision?
**R**: Terra Vision é um aplicativo web interativo que usa rastreamento ocular para permitir que você toque notas musicais olhando para um círculo dividido em "fatias" e piscando.

### P: Funciona offline?
**R**: Sim, 100% offline! Funciona completamente no seu navegador sem precisar de conexão com internet.

### P: Minhas imagens/vídeo são enviados para algum servidor?
**R**: Não. Todo processamento ocorre localmente no seu navegador. Nada é enviado para internet.

### P: Que dados são armazenados?
**R**: Nenhum dado é armazenado. A aplicação não usa cookies, localStorage ou qualquer outro armazenamento.

## 🎮 Usando o Aplicativo

### P: Como começo a usar?
**R**: 
1. Abra index.html em um servidor web
2. Clique em "Iniciar Rastreamento"
3. Permita acesso à câmera
4. Clique em "Calibrar Câmera"
5. Olhe para as fatias e pisque!

### P: Por que preciso calibrar?
**R**: A calibração melhora muito a precisão do rastreamento. WebGazer usa pontos de referência no seu rosto para calcular onde você está olhando.

### P: Qual é a distância ideal da câmera?
**R**: 60-80 cm de distância é ideal. Se ficar muito perto ou longe, a detecção piora.

### P: Funciona com óculos?
**R**: Sim, funciona com óculos. Evite óculos muito reflexivos pois podem confundir o rastreamento.

### P: Funciona com lentes de contato?
**R**: Sim, funciona normalmente com lentes de contato.

### P: Como faço para mudar as notas musicais?
**R**: Edite o arquivo `js/audio-manager.js` e altere o objeto `this.notes`.

## 📱 Dispositivos e Navegadores

### P: Funciona em celular?
**R**: Tecnicamente sim, mas não é prático pois:
- A câmera frontal é muito pequena
- Segurar o celular interfere no rastreamento
- Webcams USB externas são recomendadas

### P: Que navegadores funcionam?
**R**: 
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### P: Funciona no Internet Explorer?
**R**: Não. Use um navegador moderno.

### P: Funciona em iOS/Safari?
**R**: Parcialmente. Safari iOS tem limitações com acesso à câmera.

## 🔧 Problemas Técnicos

### P: A câmera não aparece
**R**: 
- Verifique se a câmera está conectada
- Verifique permissões do navegador
- Tente em outro navegador
- Reinicie o navegador

### P: "Câmera não encontrada"
**R**: 
- Outro programa está usando a câmera
- Câmera não está conectada
- Driver da câmera está desatualizado

### P: Rastreamento é impreciso
**R**:
- Clique em "Calibrar Câmera"
- Melhore a iluminação do ambiente
- Posicione a câmera melhor
- Reduza distância/reflexo

### P: As piscadas não são detectadas
**R**:
- Aumente a iluminação
- Não use óculos muito reflexivos
- Pisque mais completamente
- Edite `blinkThreshold` em blink-detector.js

### P: Os sons não funcionam
**R**:
- Verifique volume do navegador
- Verifique volume do sistema
- Clique na página (alguns navegadores exigem interação)
- Teste em outro navegador

### P: "WebGazer não foi encontrado"
**R**: 
Você precisa fazer download de WebGazer.js:
```bash
# Windows
setup-webgazer.bat

# Mac/Linux
bash setup-webgazer.sh

# Ou manual: https://github.com/brownhci/WebGazer
```

### P: Aplicativo carrega muito lentamente
**R**:
- Aumentar a confiança mínima reduz processamento
- Feche outras abas/programas
- Limpe cache do navegador
- Atualize drivers de GPU

### P: Canvas fica cinzento/branco
**R**: 
- Força refresh: Ctrl+F5
- Limpe cache: Ctrl+Shift+Delete
- Tente outro navegador
- Verifique console para erros

## 🔊 Áudio

### P: Como alterar o volume?
**R**: Edite `js/audio-manager.js`:
```javascript
gainNode.gain.setValueAtTime(0.3, currentTime); // Altere 0.3
```

### P: Como alterar duração das notas?
**R**: Em `js/main.js`, procure:
```javascript
this.audioManager.playNote(sliceIndex, 0.5); // Altere 0.5
```

### P: Como trocar tipo de onda (sine, square, etc)?
**R**: Em `js/audio-manager.js`:
```javascript
oscillator.type = 'sine'; // 'square', 'sawtooth', 'triangle'
```

### P: Como usar arquivos de áudio ao invés de síntese?
**R**: Veja `sounds/README.md` para instruções detalhadas.

## 🎨 Customização

### P: Como alterar as cores?
**R**: Edite `css/style.css` ou `js/pizza-circle.js`:
```css
--primary-color: #00a8ff;
```

### P: Como adicionar mais notas?
**R**: 
1. Edite `js/audio-manager.js` e adicione à `this.notes`
2. Altere número de fatias em `main.js`

### P: Como alterar o tema (claro/escuro)?
**R**: Edite as cores em `css/style.css`:
```css
:root {
    --dark-bg: #0a0e27;
    --text-light: #ffffff;
}
```

## 🚀 Deployment

### P: Como publicar online?
**R**: Use:
- GitHub Pages
- Netlify
- Vercel
- Seu próprio servidor

Veja README.md para detalhes.

### P: Preciso de HTTPS?
**R**: Sim, para produção. Navegadores exigem HTTPS para acesso à câmera.

### P: Como usar meu próprio domínio?
**R**: Use um serviço de hospedagem que suporte HTTPS (Netlify, Vercel, etc).

## 🐛 Debugging

### P: Como ver mensagens de erro?
**R**: Abra Console do Navegador:
- Chrome: F12 → Console
- Firefox: F12 → Console
- Safari: Cmd+Option+I → Console

### P: Como reportar um bug?
**R**: 
1. Abra uma Issue no GitHub
2. Inclua navegador, SO e passos para reproduzir
3. Copie erros do console
4. Descreva comportamento esperado

### P: Como ativar modo de debugging?
**R**: Abra console e execute:
```javascript
window.app.gazeTracker.setOnGazeUpdate((data) => {
    console.log(`X: ${data.x}, Y: ${data.y}`);
});
```

## 📚 Desenvolvimento

### P: Como posso contribuir?
**R**: Veja CONTRIBUTING.md

### P: Posso usar Terra Vision em meu projeto?
**R**: Sim, está sob licença MIT. Você é livre para usar, modificar e distribuir.

### P: Onde está o código?
**R**: 
- `index.html` - Estrutura
- `css/style.css` - Estilos
- `js/*.js` - Lógica principal

### P: Posso remover comentários?
**R**: Sim, mas não recomendamos. Comentários ajudam na manutenção.

### P: Como minificar para produção?
**R**: Use ferramentas como:
- UglifyJS
- Terser
- Webpack

## 🤝 Suporte

### P: Onde obtenho ajuda?
**R**: 
- Consulte este FAQ
- Abra uma Issue no GitHub
- Verifique a documentação
- Confira console para erros

### P: Posso usar Terra Vision comercialmente?
**R**: Sim, sob licença MIT com atribuição.

### P: Posso vender um aplicativo baseado em Terra Vision?
**R**: Sim, incluindo atribuição apropriada.

---

**Não encontrou resposta?** Abra uma Issue no GitHub!

**Última atualização**: Outubro 2025
