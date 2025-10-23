#!/usr/bin/env python3
"""
Terra Vision - Start Script
Script para iniciar o Terra Vision com verificações automáticas
"""

import os
import sys
import http.server
import socketserver
from pathlib import Path

def print_header():
    print("\n" + "="*50)
    print("🚀 TERRA VISION - Eye Gaze Tracking Music")
    print("="*50 + "\n")

def check_webgazer():
    """Verifica se WebGazer.js existe"""
    webgazer_path = Path(__file__).parent / "libs" / "webgazer.js"
    
    if not webgazer_path.exists():
        print("⚠️  WebGazer.js não encontrado!")
        print(f"   Esperado em: {webgazer_path}")
        print("\n   Para corrigir:")
        print("   Windows: execute setup-webgazer.bat")
        print("   Mac/Linux: execute bash setup-webgazer.sh")
        print("\n   Continuando mesmo assim...\n")
        return False
    
    print("✅ WebGazer.js encontrado")
    return True

def check_index():
    """Verifica se index.html existe"""
    index_path = Path(__file__).parent / "index.html"
    
    if not index_path.exists():
        print("❌ index.html não encontrado!")
        print(f"   Esperado em: {index_path}")
        sys.exit(1)
    
    print("✅ index.html encontrado")
    return True

def start_server(port=8000):
    """Inicia servidor HTTP"""
    os.chdir(Path(__file__).parent)
    
    try:
        Handler = http.server.SimpleHTTPRequestHandler
        httpd = socketserver.TCPServer(("", port), Handler)
        
        print(f"✅ Servidor iniciado com sucesso!")
        print(f"\n📍 Abra seu navegador em:")
        print(f"   → http://localhost:{port}\n")
        print("📝 Instruções:")
        print("   1. Clique em 'Iniciar Rastreamento'")
        print("   2. Permita acesso à câmera")
        print("   3. Clique em 'Calibrar Câmera'")
        print("   4. Olhe para as fatias e pisque!\n")
        print("🛑 Pressione Ctrl+C para parar o servidor\n")
        
        httpd.serve_forever()
        
    except OSError as e:
        if e.errno in (48, 98):  # Port in use
            print(f"❌ Porta {port} já está em uso!")
            print(f"\n   Tente outra porta:")
            print(f"   python start.py {port + 1}")
            sys.exit(1)
        else:
            print(f"❌ Erro: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n✅ Servidor interrompido")
        sys.exit(0)

if __name__ == "__main__":
    print_header()
    
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"❌ Porta inválida: {sys.argv[1]}\n")
            sys.exit(1)
    
    # Verificações
    print("🔍 Fazendo verificações...\n")
    check_index()
    check_webgazer()
    
    print("\n🌐 Iniciando servidor HTTP...\n")
    start_server(port)
