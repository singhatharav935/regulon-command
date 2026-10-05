#!/usr/bin/env python3
"""SPA-aware static file server for Sannidh."""
import http.server
import os

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        # If the path maps to an actual file, serve it
        path = self.translate_path(self.path)
        if os.path.isfile(path):
            return super().do_GET()
        # Otherwise serve index.html (SPA fallback)
        self.path = "/index.html"
        return super().do_GET()

if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", 8000), SPAHandler)
    print("Sannidh running at http://localhost:8000")
    server.serve_forever()
