#!/usr/bin/env python3
"""
Servidor HTTP simple para desarrollo de KAMPUS
Uso: python servidor-simple.py
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8080
DIRECTORY = Path(__file__).parent

class KampusHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Agregar headers para PWA
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), KampusHTTPRequestHandler) as httpd:
        print(f"🚀 Servidor KAMPUS iniciado en http://localhost:{PORT}")
        print(f"📁 Sirviendo desde: {DIRECTORY}")
        print("🔗 Páginas disponibles:")
        print(f"   - Dashboard: http://localhost:{PORT}/dashboard_principal/code.html")
        print(f"   - Ejemplo: http://localhost:{PORT}/material-ejemplo.html")
        print("\n⏹️  Presiona Ctrl+C para detener")
        
        # Abrir navegador automáticamente
        webbrowser.open(f'http://localhost:{PORT}/dashboard_principal/code.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor detenido")
            httpd.shutdown()