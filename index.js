const titleEl = document.getElementById("boardTitle");
const subtitleEl = document.getElementById("boardSubtitle");
const listEl = document.getElementById("boardList");
const updatedAtEl = document.getElementById("updatedAt");

let refreshTimer = null;

function renderEmpty(message) {
  listEl.innerHTML = `<div class="empty-state">${message}</div>`;
}

function formatTime(isoText) {
  if (!isoText) {
    return "尚未更新";
  }

  const date = new Date(isoText);
  if (Number.isNaN(date.getTime())) {
    return "尚未更新";
  }

  return `最後更新：${date.toLocaleString("zh-TW", { hour12: false })}`;
}

function renderBoard(data) {
  titleEl.textContent = data.title || "直播資料看板";
  subtitleEl.textContent = data.subtitle || "";
  updatedAtEl.textContent = formatTime(data.updatedAt);

  if (!Array.isArray(data.items) || data.items.length === 0) {
    renderEmpty("目前沒有資料，請到管理頁新增。");
    return;
  }

  listEl.innerHTML = data.items
    .map(
      (item) => `
        <article class="board-item">
          <div class="board-item-label">${escapeHtml(item.label || "")}</div>
          <div class="board-item-value">${escapeHtml(item.value || "")}</div>
        </article>
      `,
    )
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function loadBoard() {
  try {
    const response = await fetch("/api/items", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderBoard(data);
    resetRefresh(data.refreshSeconds || 5);
  } catch (error) {
    renderEmpty("讀取資料失敗，請確認本機服務是否正在執行。");
    updatedAtEl.textContent = "無法連線";
  }
}

function resetRefresh(seconds) {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(loadBoard, Math.max(2, seconds) * 1000);
}

loadBoard();
