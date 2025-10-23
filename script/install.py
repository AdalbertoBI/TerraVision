#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Terra Vision - Assistente de Instalação
Script interativo para configurar e executar o Terra Vision
"""

import os
import sys
import subprocess
from pathlib import Path

def clear_screen():
    """Limpa a tela"""
    os.system('clear' if os.name == 'posix' else 'cls')

def print_banner():
    """Exibe banner do projeto"""
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║           🚀 TERRA VISION - Eye Gaze Tracking Music         ║
    ║                                                              ║
    ║              v1.0.0 - Assistente de Instalação              ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def print_menu():
    """Exibe menu principal"""
    print("📋 O que você gostaria de fazer?\n")
    print("1. 🚀 Iniciar Terra Vision")
    print("2. 📥 Baixar WebGazer.js")
    print("3. 📖 Ver Documentação")
    print("4. ℹ️  Informações do Sistema")
    print("5. ❌ Sair\n")

def start_server():
    """Inicia o servidor HTTP"""
    print("\n🌐 Iniciando servidor HTTP...\n")
    try:
        os.chdir(Path(__file__).parent)
        subprocess.run([sys.executable, "start.py"])
    except KeyboardInterrupt:
        print("\n✅ Servidor interrompido")

def download_webgazer():
    """Faz download de WebGazer.js"""
    print("\n📥 Fazendo download de WebGazer.js...\n")
    
    libs_dir = Path(__file__).parent / "libs"
    libs_dir.mkdir(exist_ok=True)
    
    try:
        import urllib.request
        url = "https://raw.githubusercontent.com/brownhci/WebGazer/master/webgazer.js"
        output = libs_dir / "webgazer.js"
        
        print(f"Baixando de: {url}")
        print(f"Salvando em: {output}")
        
        urllib.request.urlretrieve(url, output)
        
        if output.exists():
            print("\n✅ WebGazer.js baixado com sucesso!")
        else:
            print("\n❌ Erro ao fazer download")
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        print("\nDownload manual:")
        print("1. Acesse: https://github.com/brownhci/WebGazer")
        print("2. Download webgazer.js")
        print(f"3. Salve em: libs/webgazer.js")

def show_docs():
    """Mostra instruções de documentação"""
    print("\n📖 Documentação Disponível:\n")
    print("1. README.md          - Guia principal")
    print("2. SETUP.md           - Instruções de instalação")
    print("3. TECHNICAL.md       - Documentação técnica")
    print("4. FAQ.md             - Perguntas frequentes")
    print("5. CONTRIBUTING.md    - Guia para desenvolvedores")
    print("6. PROJECT_SUMMARY.md - Resumo do projeto")
    print("\n💡 Abra esses arquivos com seu editor de texto favorito\n")

def show_system_info():
    """Mostra informações do sistema"""
    print("\n💻 Informações do Sistema:\n")
    
    print(f"Python: {sys.version}")
    print(f"Plataforma: {sys.platform}")
    print(f"Processador: {os.cpu_count()} cores")
    
    # Verifica WebGazer
    webgazer_path = Path(__file__).parent / "libs" / "webgazer.js"
    print(f"\nWebGazer.js: {'✅ Encontrado' if webgazer_path.exists() else '❌ Não encontrado'}")
    
    # Verifica index.html
    index_path = Path(__file__).parent / "index.html"
    print(f"index.html: {'✅ Encontrado' if index_path.exists() else '❌ Não encontrado'}")
    
    print()

def main():
    """Função principal"""
    while True:
        clear_screen()
        print_banner()
        print_menu()
        
        choice = input("👉 Digite sua escolha (1-5): ").strip()
        
        if choice == "1":
            start_server()
            break
        elif choice == "2":
            download_webgazer()
            input("\n✓ Pressione ENTER para continuar...")
        elif choice == "3":
            show_docs()
            input("\n✓ Pressione ENTER para continuar...")
        elif choice == "4":
            show_system_info()
            input("\n✓ Pressione ENTER para continuar...")
        elif choice == "5":
            print("\n👋 Até logo!\n")
            break
        else:
            print("\n❌ Opção inválida! Tente novamente.")
            input("Pressione ENTER para continuar...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Até logo!\n")
        sys.exit(0)
