# Local stand-in for the Apps Script web app + static file server, for testing only.
import json, sys, os
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
ROOT = sys.argv[1]
chores, done = [], []
def state(since):
    last={}; first=""
    for c in done:
        if c["chore"] not in last or c["date"] > last[c["chore"]]: last[c["chore"]] = c["date"]
        if not first or c["date"] < first: first = c["date"]
    return {"ok": True, "people": ["Tracy","Billy","Vivian"], "chores": chores, "last": last, "first": first,
            "completions": [c for c in done if not since or c["date"] >= since]}
class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def send_json(self, obj):
        b = json.dumps(obj).encode()
        self.send_response(200); self.send_header("Content-Type","application/json")
        self.send_header("Access-Control-Allow-Origin","*"); self.send_header("Content-Length",str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/exec": return self.send_json(state(parse_qs(u.query).get("since",[""])[0]))
        return super().do_GET()
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))) or b"{}")
        op = body.get("op")
        if op == "seed" and not chores: chores.extend(body.get("chores", []))
        elif op == "done":
            r = body["record"]
            if r["person"] in ("Tracy","Billy","Vivian") and not any(c["id"] == r["id"] for c in done): done.append(r)
        elif op == "undo": done[:] = [c for c in done if c["id"] != body.get("id")]
        self.send_json(state(body.get("since","")))
ThreadingHTTPServer(("127.0.0.1", 8765), H).serve_forever()
