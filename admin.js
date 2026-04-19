const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");
const refreshInput = document.getElementById("refreshInput");
const itemsInput = document.getElementById("itemsInput");
const previewList = document.getElementById("previewList");
const saveButton = document.getElementById("saveButton");
const reloadButton = document.getElementById("reloadButton");
const statusText = document.getElementById("statusText");

function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const dividerIndex = line.indexOf("|");
      if (dividerIndex === -1) {
        return { label: line, value: "" };
      }

      return {
        label: line.slice(0, dividerIndex).trim(),
        value: line.slice(dividerIndex + 1).trim(),
      };
    });
}

function linesFromItems(items) {
  return items
    .map((item) => [item.label || "", item.value || ""].join("|").replace(/\|$/, ""))
    .join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPreview() {
  const items = parseLines(itemsInput.value);
  if (items.length === 0) {
    previewList.innerHTML = '<div class="empty-state">尚未輸入任何條目。</div>';
    return;
  }

  previewList.innerHTML = items
    .map(
      (item) => `
        <div class="preview-item">
          <span class="preview-label">${escapeHtml(item.label)}</span>
          <span class="preview-value">${escapeHtml(item.value)}</span>
        </div>
      `,
    )
    .join("");
}

function setStatus(message, state = "") {
  statusText.textContent = message;
  statusText.dataset.state = state;
}

async function loadData() {
  setStatus("載入中...");

  try {
    const response = await fetch("/api/items", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    titleInput.value = data.title || "";
    subtitleInput.value = data.subtitle || "";
    refreshInput.value = data.refreshSeconds || 5;
    itemsInput.value = linesFromItems(data.items || []);
    renderPreview();
    setStatus("已載入", "ok");
  } catch (error) {
    setStatus("載入失敗，請確認本機服務是否正在執行。", "error");
  }
}

async function saveData() {
  const payload = {
    title: titleInput.value.trim(),
    subtitle: subtitleInput.value.trim(),
    refreshSeconds: Number(refreshInput.value || 5),
    items: parseLines(itemsInput.value),
  };

  setStatus("儲存中...");

  try {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await response.json();
    renderPreview();
    setStatus("已儲存，OBS 重新整理後可看到。", "ok");
  } catch (error) {
    setStatus("儲存失敗。", "error");
  }
}

itemsInput.addEventListener("input", renderPreview);
saveButton.addEventListener("click", saveData);
reloadButton.addEventListener("click", loadData);

loadData();
