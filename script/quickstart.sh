#!/bin/bash

# Terra Vision - Quick Start Script
# Execute este script para configurar e iniciar o Terra Vision

set -e

echo ""
echo "🚀 Terra Vision - Quick Start"
echo "=============================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica se está no diretório correto
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ index.html não encontrado!${NC}"
    echo "Execute este script da pasta raiz do Terra Vision"
    exit 1
fi

# Step 1: Download WebGazer
echo -e "${YELLOW}📥 Passo 1: Verificando WebGazer.js${NC}"

if [ ! -f "libs/webgazer.js" ]; then
    echo -e "${YELLOW}Fazendo download de WebGazer.js...${NC}"
    
    if command -v curl &> /dev/null; then
        mkdir -p libs
        curl -L -o libs/webgazer.js https://raw.githubusercontent.com/brownhci/WebGazer/master/webgazer.js -# 
        echo -e "${GREEN}✅ WebGazer.js instalado${NC}"
    else
        echo -e "${RED}❌ curl não disponível${NC}"
        echo "Por favor, baixe manualmente de:"
        echo "https://github.com/brownhci/WebGazer"
        exit 1
    fi
else
    echo -e "${GREEN}✅ WebGazer.js já existe${NC}"
fi

echo ""

# Step 2: Check Python
echo -e "${YELLOW}🐍 Passo 2: Verificando Python${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
    echo -e "${GREEN}✅ Python 3 encontrado${NC}"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
    echo -e "${GREEN}✅ Python encontrado${NC}"
else
    echo -e "${RED}❌ Python não encontrado${NC}"
    echo "Instale Python 3 de python.org"
    exit 1
fi

echo ""

# Step 3: Start server
echo -e "${YELLOW}🌐 Passo 3: Iniciando servidor local${NC}"
echo -e "${GREEN}✅ Servidor iniciando em http://localhost:8000${NC}"
echo ""
echo "📝 Instruções:"
echo "  1. Abra seu navegador em http://localhost:8000"
echo "  2. Clique em 'Iniciar Rastreamento'"
echo "  3. Permita acesso à câmera"
echo "  4. Clique em 'Calibrar Câmera'"
echo "  5. Olhe para as fatias e pisque para tocar!"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar o servidor${NC}"
echo ""

# Inicia servidor
cd "$(dirname "$0")"
$PYTHON_CMD -m http.server 8000
