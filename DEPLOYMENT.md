# 🚀 Guia de Deployment - GitHub Pages

## Status Atual

✅ **Repositório**: AdalbertoInterprise/TerraVision
✅ **Branch**: main
✅ **URL**: https://AdalbertoInterprise.github.io/TerraVision/
✅ **CI/CD**: GitHub Actions (pages.yml)

## Estrutura Otimizada para GitHub Pages

```text
/
├── index.html              ← Página principal (entry point)
├── style.css              ← Estilos globais
├── package.json           ← Dependências e metadados
├── README.md              ← Documentação do projeto
├── DEPLOYMENT.md          ← Este arquivo
├── .gitignore             ← Arquivos ignorados
├── .github/
│   └── workflows/
│       └── pages.yml      ← CI/CD automático
├── libs/                  ← Bibliotecas externas
│   ├── webgazer.js
│   └── webgazer-instructions.js
└── src/                   ← Código modular ES6
    ├── main.js
    ├── config.js
    ├── audio.js
    ├── gazeTracker.js
    ├── blinkDetector.js
    ├── heatmap.js
    ├── calibration.js
    ├── pizzaRenderer.js
    ├── controlManager.js
    ├── faceMeshProcessor.js
    ├── therapyMode.js
    ├── cameraPreview.js
    ├── calibrationModel.js
    └── ui.js
```

**Removido (não necessário para GitHub Pages)**:

- ❌ `electron-app/` - Versão desktop Electron
- ❌ `js/` - Código duplicado e desatualizado
- ❌ `script/` - Scripts Python e shell de setup
- ❌ `css/` - Estilos duplicados (consolidado em style.css)
- ❌ `docs/` - Documentação interna de desenvolvimento
- ❌ `notes.json` - Notas de projeto
- ❌ `docs.html` - Documentação em HTML
- ❌ `setup-webgazer.bat/sh` - Scripts de instalação

## Deploy Automático

### Como Funciona

1. **Push para `main` branch**:

```bash
git add .
git commit -m "Atualização"
git push origin main
```

2. **GitHub Actions dispara** (`pages.yml`):

   - Checkout do repositório
   - Setup do GitHub Pages
   - Upload de todos os arquivos como artifact
   - Deploy automático para a URL pública

3. **Site ativo em 1-2 minutos**:

   - Acesso via https://AdalbertoInterprise.github.io/TerraVision/

### Logs de Deploy

Verifique o status em:
https://github.com/AdalbertoInterprise/TerraVision/actions

## Configuração de GitHub Pages

### Localização Atual

Na **raiz do repositório** (usando `/` como diretório de publicação)

### Verificar Configuração

1. Acesse: GitHub.com → Repositório → Settings → Pages
2. Confirme:
   - **Source**: Deploy from a branch
   - **Branch**: main / (root)
   - **Enforce HTTPS**: ✅ Ativado

### HTTPS & Segurança

✅ **HTTPS automático** - GitHub Pages fornece certificado SSL/TLS
✅ **Segurança de contexto** - getUserMedia requer HTTPS
⚠️ **WebGazer offline** - Arquivo `libs/webgazer.js` servido localmente

## Otimizações de Performance

### 1. Cabeçalhos HTTP (GitHub Pages padrão)

```textCache-Control: public, max-age=3600
Content-Type: text/html; charset=utf-8
```

### 2. Minificação (Recomendado)

Se necessário, minifique manualmente:

```bash
# Minificar CSS
npx cssnano style.css -o style.min.css

# Minificar JS (com preservação de módulos)
npx terser src/main.js -o src/main.min.js -c -m
```

Depois atualize `index.html` para referenciar versões minificadas.### 3. Lazy Loading

Adicione atributo `defer` aos scripts (já configurado em index.html):

```html
<script src="src/main.js?v=1.0.0" type="module" defer></script>
```

## Versionamento

### Tag de Release

Para marcar versões estáveis:

```bash
git tag -a v1.0.0 -m "Versão 1.0.0 - GitHub Pages"
git push origin v1.0.0
```

Visualize em: GitHub.com → Releases

## Troubleshooting

### Página 404

**Problema**: Acesso retorna 404

**Solução**:

1. Verifique se `index.html` existe na raiz
2. Confirme branchlocal sincronizado com GitHub
3. Aguarde 2-3 minutos após push (propagação DNS)
4. Limpe cache: Ctrl+Shift+Del no navegador

### WebGazer não carrega

**Problema**: Console mostra erro de `libs/webgazer.js`

**Solução**:

1. Verifique arquivo em `/libs/webgazer.js`
2. Confirme path correto em `src/main.js` linha 8:

```javascript
   const WEBGAZER_LOCAL_SRC = 'libs/webgazer.js';
```

3. GitHub Pages é case-sensitive (use minúsculas)

### Câmera não inicia

**Problema**: `getUserMedia` retorna permissão negada

**Solução**:

1. Site requer **HTTPS** (GitHub Pages fornece)
2. Confirme protocolo: `https://` (não `http://`)
3. Verifique permissões do navegador
4. Tente incógnito (isola cache de permissões)

### Piscadas não detectadas

**Problema**: MediaPipe não inicializa

**Solução**:

1. Verifique compatibilidade do navegador (Chrome/Edge necessário)
2. Console deve mostrar: `"Face Mesh inicializado"`
3. Se não aparecer, pode estar sem WebGL suporte

## Monitoramento

### Estatísticas de Acesso

GitHub Pages não fornece analytics nativo. Adicione Google Analytics (opcional):

```html
<!-- Adicionar em index.html antes de </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## Backup e Recuperação

### Backup de Código

O GitHub mantém histórico completo. Para recuperar versões anteriores:

```bash
# Ver histórico de commits
git log --oneline

# Reverter para commit anterior (se necessário)
git revert <commit-hash>
```

## Próximas Etapas

- [ ] Adicionar analytics (Google Analytics ou similar)
- [ ] Implementar PWA (Progressive Web App) com service worker
- [ ] Adicionar formulário de feedback
- [ ] Criar página de documentação expandida
- [ ] Habilitar discussões (GitHub Discussions)

## Referências

- 📖 [GitHub Pages Documentation](https://docs.github.com/en/pages)
- 🔐 [GitHub Pages HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- ⚡ [GitHub Actions - Pages Deploy](https://github.com/actions/deploy-pages)
- 🌐 [WebGazer.js Docs](https://webgazer.cs.brown.edu/)

---

**Última atualização**: Outubro 2025  
**Status**: ✅ Pronto para produção
