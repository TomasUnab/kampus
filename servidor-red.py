#!/usr/bin/env python3
import http.server
import socketserver
import socket

PORT = 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

if __name__ == "__main__":
    local_ip = get_local_ip()
    
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor KAMPUS iniciado")
        print(f"Desde tu celular: http://{local_ip}:{PORT}")
        print(f"Desde PC: http://localhost:{PORT}")
        print(f"Paginas principales:")
        print(f"   - Inicio: http://{local_ip}:{PORT}")
        print(f"   - Dashboard: http://{local_ip}:{PORT}/dashboard_principal/code.html")
        print(f"   - Demo: http://{local_ip}:{PORT}/material-ejemplo.html")
        print(f"   - Test: http://{local_ip}:{PORT}/test-responsive.html")
        print("\nPresiona Ctrl+C para detener")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido")
            httpd.shutdown()