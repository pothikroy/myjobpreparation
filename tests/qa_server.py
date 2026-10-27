"""Local QA only. Replaces Firebase in HTTP responses; source files stay unchanged.

Never use this server for hosting. Run python -m http.server for a normal preview.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import re
import os

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
REPORTS = []

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = self.path.split('?')[0]
        if route == '/__qa/reports':
            payload = json.dumps(REPORTS).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(payload)
            return
        if route.endswith('.html') or route == '/':
            file = ROOT / (route.lstrip('/') or 'index.html')
            if file.is_file() and file.resolve().is_relative_to(ROOT):
                html = file.read_text(encoding='utf-8-sig')
                html = re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^\"]+"></script>', '', html)
                html = html.replace('<head>', '<head><script src="/tests/qa-firebase.js"></script>')
                data = html.encode()
                self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.end_headers(); self.wfile.write(data)
                return
        super().do_GET()

    def do_POST(self):
        if self.path != '/__qa/report': self.send_error(404); return
        REPORTS.append(json.loads(self.rfile.read(int(self.headers['Content-Length']))))
        self.send_response(204); self.end_headers()

print('Local QA server: http://127.0.0.1:4173 (mock Firebase; no production writes)',flush=True)
ThreadingHTTPServer(('127.0.0.1',4173),Handler).serve_forever()
