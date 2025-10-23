#!/bin/bash

# Terra Vision - WebGazer Setup Script
# Este script faz download do WebGazer.js necessário para rodar o projeto

echo "🚀 Terra Vision - WebGazer Setup"
echo "================================"

# Verifica se curl está disponível
if ! command -v curl &> /dev/null; then
    echo "❌ curl não está instalado"
    echo "Instale curl ou download manualmente de:"
    echo "https://github.com/brownhci/WebGazer/releases"
    exit 1
fi

# Cria pasta libs se não existir
mkdir -p libs

# URL do WebGazer (versão distribuível)
WEBGAZER_URL="https://raw.githubusercontent.com/brownhci/WebGazer/master/webgazer.js"
OUTPUT_FILE="libs/webgazer.js"

echo "📥 Fazendo download de WebGazer.js..."
echo "URL: $WEBGAZER_URL"

# Download com progresso
curl -L -o "$OUTPUT_FILE" "$WEBGAZER_URL" -# 

# Verifica se o download foi bem-sucedido
if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
    echo "✅ WebGazer.js baixado com sucesso!"
    echo "📍 Localização: $OUTPUT_FILE"
    echo ""
    echo "🎉 Terra Vision está pronto para usar!"
    echo "Abra index.html em um servidor web local."
else
    echo "❌ Erro ao fazer download"
    echo "Download manualmente de:"
    echo "https://github.com/brownhci/WebGazer/releases"
    exit 1
fi
