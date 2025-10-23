#!/usr/bin/env python3
"""
Terra Vision - Local Development Server
Um servidor HTTP simples para desenvolvimento local
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = 8000
HANDLER = http.server.SimpleHTTPRequestHandler

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler customizado com cabeçalhos de segurança"""
    
    def end_headers(self):
        # Adiciona cabeçalhos de segurança
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_GET(self):
        # Log de requisições
        print(f'📡 {self.command} {self.path}')
        super().do_GET()
    
    def log_message(self, format, *args):
        # Customiza mensagens de log
        print(f'[{self.log_date_time_string()}] {format % args}')

def run_server():
    """Inicia o servidor"""
    try:
        # Muda para o diretório do script
        script_dir = Path(__file__).parent
        os.chdir(script_dir)
        
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print("🚀 Terra Vision - Development Server")
            print("=" * 40)
            print(f"✅ Servidor rodando em http://localhost:{PORT}")
            print(f"📁 Diretório: {os.getcwd()}")
            print("")
            print("Pressione Ctrl+C para parar")
            print("=" * 40)
            print("")
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48 or e.errno == 98:  # Port already in use
            print(f"❌ Erro: Porta {PORT} já está em uso!")
            print(f"Tente outra porta: python server.py 8001")
        else:
            print(f"❌ Erro: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n✅ Servidor interrompido")
        sys.exit(0)

if __name__ == "__main__":
    # Aceita porta como argumento
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print(f"❌ Porta inválida: {sys.argv[1]}")
            sys.exit(1)
    
    run_server()
