"""포트폴리오 편집용 로컬 서버.

python serve.py  →  http://localhost:5180/?edit

- 이 폴더를 그대로 보여 주고(캐시 없이),
- 편집 모드의 [저장]이 보낸 내용을 content.js 와 assets/ 에 바로 씁니다.
- 내 컴퓨터(127.0.0.1)에서만 접속됩니다.
"""
import base64
import http.server
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5180
MAX_BODY = 300 * 1024 * 1024  # 300MB
ASSET_NAME = re.compile(r"^assets/[a-z0-9][a-z0-9._-]{0,120}$")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _reply(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/__ping":
            return self._reply(200, {"ok": True, "folder": ROOT})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/__save":
            return self._reply(404, {"ok": False, "error": "not found"})
        # 다른 사이트가 이 서버로 저장 요청을 보내지 못하게 막음
        origin = self.headers.get("Origin", "")
        if origin and not re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", origin):
            return self._reply(403, {"ok": False, "error": "forbidden origin"})
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY:
            return self._reply(413, {"ok": False, "error": "too large"})
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            content = data["content"]
            if not isinstance(content, str) or "window.PORTFOLIO" not in content:
                raise ValueError("content.js 내용이 이상해요")
            written = []
            for name, b64 in (data.get("files") or {}).items():
                if not ASSET_NAME.match(name):
                    raise ValueError(f"허용되지 않는 파일 이름: {name}")
                os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
                with open(os.path.join(ROOT, *name.split("/")), "wb") as f:
                    f.write(base64.b64decode(b64))
                written.append(name)
            tmp = os.path.join(ROOT, "content.js.tmp")
            with open(tmp, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            os.replace(tmp, os.path.join(ROOT, "content.js"))
            written.append("content.js")
            print("  저장함:", ", ".join(written))
            return self._reply(200, {"ok": True, "written": written, "folder": ROOT})
        except Exception as e:  # noqa: BLE001 - 어떤 오류든 화면에 알려 줌
            return self._reply(400, {"ok": False, "error": str(e)})

    def log_message(self, fmt, *args):
        if "POST" in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"\n  편집 모드:  http://localhost:{PORT}/?edit")
    print(f"  저장 위치:  {ROOT}")
    print("  이 창을 닫으면 편집 서버도 꺼집니다.\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
