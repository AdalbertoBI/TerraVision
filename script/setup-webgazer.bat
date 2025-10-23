@echo off
REM Terra Vision - WebGazer Setup Script for Windows
REM Este script faz download do WebGazer.js necessário para rodar o projeto

setlocal enabledelayedexpansion
cls

echo.
echo 🚀 Terra Vision - WebGazer Setup
echo ================================
echo.

REM Verifica se PowerShell está disponível
powershell -Version 1 >nul 2>&1
if errorlevel 1 (
    echo ❌ PowerShell não está disponível
    echo.
    echo Download manualmente de:
    echo https://github.com/brownhci/WebGazer/releases
    pause
    exit /b 1
)

REM Cria pasta libs se não existir
if not exist "libs" (
    mkdir libs
    echo 📁 Pasta 'libs' criada
)

REM URL do WebGazer
set WEBGAZER_URL=https://raw.githubusercontent.com/brownhci/WebGazer/master/webgazer.js
set OUTPUT_FILE=libs\webgazer.js

echo.
echo 📥 Fazendo download de WebGazer.js...
echo URL: %WEBGAZER_URL%
echo.

REM Download usando PowerShell
powershell -Command "& {
    try {
        $ProgressPreference = 'Continue'
        Invoke-WebRequest -Uri '%WEBGAZER_URL%' -OutFile '%OUTPUT_FILE%' -UseBasicParsing
        Write-Host '✅ WebGazer.js baixado com sucesso!' -ForegroundColor Green
    }
    catch {
        Write-Host '❌ Erro ao fazer download!' -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}"

if errorlevel 1 (
    echo.
    echo ❌ Erro ao fazer download
    echo.
    echo Download manualmente de:
    echo https://github.com/brownhci/WebGazer/releases
    echo.
    pause
    exit /b 1
)

echo.
echo 📍 Localização: %OUTPUT_FILE%
echo.
echo 🎉 Terra Vision está pronto para usar!
echo.
echo Para iniciar:
echo 1. Abra um terminal nesta pasta
echo 2. Execute: python -m http.server 8000
echo 3. Abra: http://localhost:8000
echo.
pause
