# AI Youtube Live Dash

本專案是一個可本機執行的直播資料看板。

## 啟動

```powershell
py server.py
```

或直接雙擊：

```text
start_dashboard.bat
```

啟動後可開啟：

- 看板頁：`http://127.0.0.1:8787/`
- 管理頁：`http://127.0.0.1:8787/admin`

## 使用方式

1. 在管理頁輸入資料，每行一筆。
2. 格式為 `左邊|右邊`。
3. 按下儲存後，資料會寫入 `data/board.json`。
4. 在 OBS Browser Source 指向 `http://127.0.0.1:8787/`。
5. OBS 重新整理或等待自動更新即可看到最新資料。
