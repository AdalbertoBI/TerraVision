# 📷 Guia de Controles de Câmera Avançada

## Visão Geral

O Terra Vision agora inclui controles avançados de câmera para otimizar a qualidade do rastreamento ocular. Este guia explica como usar cada funcionalidade.

---

## 🔍 Controles de Zoom Digital

### O que é Zoom Digital?

O zoom digital permite que você amplie a imagem da câmera sem reduzir a qualidade, ideal para:
- **Rastreamento preciso**: Ampliar os olhos para melhor detecção
- **Foco refinado**: Aproximar pontos específicos do rosto
- **Ajustes finos**: De 1x até 10x zoom

### Como Usar

#### Via Slider
1. Abra o painel de controles (está visível por padrão)
2. Localize a seção **"🔍 Zoom"**
3. Deslize o controle para ajustar de **1x até 10x**
4. O zoom é aplicado em tempo real na visualização

#### Via Botões
- **Botão "−"**: Reduz o zoom em incrementos de 0.5x
- **Botão "+"**: Aumenta o zoom em incrementos de 0.5x
- **Botão "Reset"**: Volta ao zoom de 1x (padrão)

#### Atalhos de Teclado
```
Ctrl + Scroll Up   → Aumenta zoom
Ctrl + Scroll Down → Reduz zoom
```

### Dicas de Uso
- 🎯 **Para calibração**: Use zoom 3x-4x para precisão melhor
- 👁️ **Para rastreamento**: Mantenha em 2x-3x para área adequada
- 📱 **Para mobile**: Toque duplo na pizza para tela cheia (ver seção abaixo)

---

## ☀️ Controle de Brilho

### O que é?

Ajusta o brilho da imagem da câmera para compensar iluminação inadequada.

### Como Usar

1. Localize a seção **"☀️ Brilho"**
2. Deslize entre **0% (muito escuro)** até **200% (muito claro)**
3. O padrão é **100%** (brilho normal)

#### Botões Rápidos
- **−**: Reduz 10%
- **+**: Aumenta 10%
- **Reset**: Volta a 100%

### Recomendações

| Situação | Brilho Recomendado |
|----------|-------------------|
| Ambiente muito escuro | 150-200% |
| Luz natural adequada | 80-120% |
| Luz artificial forte | 50-100% |
| Contra-luz (janela atrás) | 120-180% |

---

## ◉ Controle de Contraste

### O que é?

Aumenta a diferença entre áreas claras e escuras, melhorando a detecção de características do rosto.

### Como Usar

1. Localize a seção **"◉ Contraste"**
2. Deslize entre **0% (sem contraste)** até **200% (muito contraste)**
3. O padrão é **100%**

#### Botões Rápidos
- **−**: Reduz 10%
- **+**: Aumenta 10%
- **Reset**: Volta a 100%

### Dicas

✅ **Aumente o contraste se**:
- Os olhos aparecem muito fundidos com a pele
- As sobrancelhas não aparecem claramente
- A imagem parece "plana"

❌ **Reduza o contraste se**:
- A imagem fica muito "sujeira"
- Aparecem artefatos ao redor dos olhos
- O vídeo fica instável

---

## 📐 Seleção de Resolução

### Opções Disponíveis

```
📱 VGA (640×480)      → Para conexões lentas / mobile básico
🖥️ XGA (1024×768)    → Balanço qualidade/performance
💻 1280×960           → Qualidade alta
🎬 2K (1920×1440)     → Máxima qualidade (mais pesado)
```

### Como Usar

1. Localize o dropdown **"📐 Resolução"**
2. Selecione uma das opções disponíveis
3. A câmera reconecta automaticamente com a nova resolução
4. Aguarde ~2 segundos para estabilizar

### Recomendações

| Dispositivo | Recomendação |
|------------|--------------|
| Smartphone | VGA ou XGA |
| Tablet | XGA |
| Computador (WiFi) | 1280×960 ou 2K |
| Computador (Fast USB) | 2K |

**⚠️ Nota**: Resoluções mais altas consomem mais bateria e banda.

---

## 🎬 Modos de Câmera Especiais

### Filtros Disponíveis

O Terra Vision suporta os seguintes filtros (aplicados automaticamente):

```javascript
Brilho      → 0-200%
Contraste   → 0-200%
Saturação   → 0-200%
Desfoque    → 0-20px
```

---

## 📸 Captura de Screenshot

### Como Usar

1. Localize o botão **"📸 Capturar Screenshot"** na seção "⚙️ Ações"
2. Clique para capturar a imagem atual
3. A imagem será baixada automaticamente com timestamp

### Formato do Arquivo

```
terra-vision-screenshot-2024-01-15T14-30-45.png
```

### Casos de Uso

- 📋 Documentar posição de calibração
- 🐛 Reportar problemas de rastreamento
- 📊 Análise visual de qualidade
- 📸 Registro de sessão

---

## ⚙️ Redefinições Rápidas

### Restaurar Padrões

O botão **"🔄 Resetar Tudo"** na seção "⚙️ Ações" restaura:

```
✓ Zoom → 1x
✓ Brilho → 100%
✓ Contraste → 100%
✓ Resolução → Padrão do dispositivo
```

### Salvar Configurações

As configurações são **salvas automaticamente** em:
```
localStorage: terraVision_cameraSettings
```

Seus ajustes serão restaurados quando você reabrir a página!

---

## 🎯 Casos de Uso Comuns

### Problema: Os olhos não são detectados

**Solução**:
1. Aumente o zoom para **3x-4x**
2. Aumente o contraste para **120-150%**
3. Ajuste o brilho: **100-150%**
4. Certifique-se de boa iluminação frontal

### Problema: Rastreamento oscilante

**Solução**:
1. Reduza o zoom para **2x**
2. Reduza o contraste para **80-100%**
3. Mantenha o brilho em **100%**
4. Fique mais imóvel

### Problema: Imagen muito escura

**Solução**:
1. Aumentar brilho para **150-180%**
2. Aumentar contraste para **120%**
3. Verificar iluminação da sala
4. Limpar lente da câmera

### Problema: Imagen muito clara/queimada

**Solução**:
1. Reduzir brilho para **50-80%**
2. Reduzir contraste para **80%**
3. Afastar da luz solar direta
4. Virar câmera para não receber luz frontal

---

## 📱 Controles em Dispositivos Móveis

### Gestos Touch

```
Deslizar Vertical   → Ajustar zoom
Toque Duplo Pizza   → Ativar Fullscreen
Dois Dedos Pinça    → Zoom na pizza (se suportado)
```

### Botões da Interface

Todos os controles funcionam normalmente em mobile:
- ✅ Sliders funcionam com toque
- ✅ Botões +/- funcionam com toque
- ✅ Dropdown de resolução funciona

---

## 🖥️ Compatibilidade de Navegadores

| Navegador | Zoom | Brilho | Contraste | Resolução | Status |
|-----------|------|--------|-----------|-----------|--------|
| Chrome | ✅ | ✅ | ✅ | ✅ | Completo |
| Firefox | ✅ | ✅ | ✅ | ✅ | Completo |
| Safari | ✅ | ✅ | ✅ | ⚠️ | Limitado |
| Edge | ✅ | ✅ | ✅ | ✅ | Completo |
| Opera | ✅ | ✅ | ✅ | ✅ | Completo |

**⚠️ Nota Safari**: Algumas resoluções personalizadas podem não estar disponíveis.

---

## 🐛 Troubleshooting

### A câmera não carrega

**Verificar**:
1. Permissão de câmera concedida? (verificar no navegador)
2. Câmera em uso por outro programa?
3. Navegador suportado?
4. Conexão segura (HTTPS)?

**Solução**:
- Recarregar página (F5)
- Fechar outros apps usando câmera
- Tentar em outro navegador

### Os controles não respondem

**Solução**:
1. Recarregar página
2. Limpar cache do navegador
3. Verificar console (F12) para erros
4. Tentar em modo privado/incógnito

### Performance ruim com zoom alto

**Solução**:
1. Reduzir zoom para ≤ 5x
2. Reduzir resolução para XGA ou 1280×960
3. Fechar outras abas/apps
4. Verificar uso de CPU

---

## ✅ Checklist de Calibração Recomendada

Antes de começar uma sessão terapêutica:

```
☐ 1. Zoom configurado em 3x
☐ 2. Brilho em ~100%
☐ 3. Contraste em ~100%
☐ 4. Resolução em 1280×960 ou superior
☐ 5. Iluminação frontal adequada
☐ 6. Câmera posicionada na altura dos olhos
☐ 7. Screenshot capturado para referência
☐ 8. Teste de rastreamento bem-sucedido
```

---

## 🚀 Dicas Avançadas

### Performance Otimizada

Para máxima performance:

```javascript
// Configuração ideal para desktop
Zoom: 2x-3x
Resolução: 1280×960
Brilho: 100%
Contraste: 100%
```

### Salvando Perfis

Você pode criar múltiplos perfis salvando valores diferentes em:
```javascript
// No console do navegador (F12)
localStorage.setItem('terraVision_cameraSettings', JSON.stringify({
  zoom: 3,
  brightness: 120,
  contrast: 110,
  resolution: '1280x960'
}));
```

---

## 📞 Suporte

Para problemas ou sugestões:

1. Verifique este guia
2. Consulte a seção de Troubleshooting
3. Limpe cache e tente novamente
4. Reporte bugs com screenshot

---

## 📝 Histórico de Versões

**v1.0** - Versão Inicial
- Zoom digital 1x-10x
- Controles de brilho/contraste
- Seleção de resolução
- Captura de screenshot
- Suporte mobile

---

**Última atualização**: 2024  
**Compatibilidade**: Terra Vision v2.0+
