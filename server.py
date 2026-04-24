from __future__ import annotations

import json
import mimetypes
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import socket  # 新增：用於自動獲取本機 IP

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "board.json"

# --- 修改重點：將 HOST 改為 0.0.0.0 ---
HOST = "0.0.0.0" 
PORT = 8787

DEFAULT_DATA = {
    "title": "直播資料看板",
    "subtitle": "在管理頁輸入每行一筆，格式為：左邊|右邊",
    "refreshSeconds": 5,
    "items": [
        {
            "label": "白沙、山邊媽祖往北港徒步進香",
            "value": "停駕-慈心聖母聯誼會",
            "enabled": True,
            "marked": True,
        },
        {"label": "目前空氣品質", "value": "75", "enabled": True, "marked": True},
    ],
    "updatedAt": "",
}


def ensure_data_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        save_data(DEFAULT_DATA)


def load_data() -> dict:
    ensure_data_file()
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def save_data(data: dict) -> None:
    payload = {
        "title": str(data.get("title", "")).strip() or DEFAULT_DATA["title"],
        "subtitle": str(data.get("subtitle", "")).strip(),
        "refreshSeconds": max(2, min(int(data.get("refreshSeconds", 5)), 60)),
        "items": normalize_items(data.get("items", [])),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    DATA_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def normalize_items(raw_items: list[dict]) -> list[dict]:
    items: list[dict] = []
    for item in raw_items:
        label = str(item.get("label", "")).strip()
        value = str(item.get("value", "")).strip()
        if label or value:
            items.append(
                {
                    "label": label,
                    "value": value,
                    "enabled": item.get("enabled", True) is not False,
                    "marked": item.get("marked", True) is not False,
                }
            )
    return items


class DashboardHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/items":
            self.send_json(load_data())
            return

        if parsed.path == "/":
            self.serve_file("index.html")
            return

        if parsed.path == "/admin":
            self.serve_file("admin.html")
            return

        safe_path = parsed.path.lstrip("/")
        if safe_path:
            self.serve_file(safe_path)
            return

        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/items":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
            save_data(payload)
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as exc:
            self.send_json({"error": str(exc)}, status=HTTPStatus.BAD_REQUEST)
            return

        self.send_json({"ok": True, "data": load_data()})

    def serve_file(self, relative_path: str) -> None:
        file_path = (PUBLIC_DIR / relative_path).resolve()
        if PUBLIC_DIR not in file_path.parents and file_path != PUBLIC_DIR:
            self.send_error(HTTPStatus.FORBIDDEN)
            return

        if not file_path.exists() or not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_type, _ = mimetypes.guess_type(file_path.name)
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def send_json(self, payload: dict, status: int = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        return


def get_local_ip():
    """獲取本機在區域網路中的 IP 位址"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main() -> None:
    ensure_data_file()
    local_ip = get_local_ip()
    server = ThreadingHTTPServer((HOST, PORT), DashboardHandler)
    
    print("-" * 30)
    print(f"看板伺服器已啟動！")
    print(f"本機存取：http://127.0.0.1:{PORT}")
    print(f"外部裝置存取：http://{local_ip}:{PORT}")
    print(f"管理頁面：http://{local_ip}:{PORT}/admin")
    print("-" * 30)
    
    server.serve_forever()


if __name__ == "__main__":
    main()
