const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");
const refreshInput = document.getElementById("refreshInput");
const itemsInput = document.getElementById("itemsInput");
const previewList = document.getElementById("previewList");
const saveButton = document.getElementById("saveButton");
const reloadButton = document.getElementById("reloadButton");
const statusText = document.getElementById("statusText");
const PARSE_ERROR_TEXT = "內容資料解析失敗";

let previewItems = [];

function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const marked = line.endsWith("*");
      const normalizedLine = marked ? line.slice(0, -1).trimEnd() : line;
      const dividerIndex = line.indexOf("|");
      if (dividerIndex === -1) {
        return {
          label: normalizedLine,
          value: "",
          marked,
          enabled: previewItems[index]?.enabled ?? true,
        };
      }

      return {
        label: normalizedLine.slice(0, dividerIndex).trim(),
        value: normalizedLine.slice(dividerIndex + 1).trim(),
        marked,
        enabled: previewItems[index]?.enabled ?? true,
      };
    });
}

function linesFromItems(items) {
  return items
    .map((item) => {
      const baseLine = [item.label || "", item.value || ""].join("|").replace(/\|$/, "");
      return item.marked ? `${baseLine}*` : baseLine;
    })
    .join("\n");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getDisplayValue(item) {
  if (item?.enabled !== false) {
    return item.value;
  }

  return PARSE_ERROR_TEXT;
}

function renderPreview(items = parseLines(itemsInput.value)) {
  previewItems = items;

  if (previewItems.length === 0) {
    previewList.innerHTML = '<div class="empty-state">尚未輸入任何條目。</div>';
    return;
  }

  previewList.innerHTML = previewItems
    .map(
      (item, index) => `
        <div class="preview-item">
          <label class="preview-toggle">
            <input type="checkbox" data-index="${index}" ${item.enabled ? "checked" : ""} />
            <span>正常顯示</span>
          </label>
          <span class="preview-label">${escapeHtml(item.label)}</span>
          <span class="preview-value">${escapeHtml(getDisplayValue(item))}</span>
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
    renderPreview(
      (data.items || []).map((item) => ({
        label: item.label || "",
        value: item.value || "",
        enabled: item.enabled !== false,
        marked: item.marked !== false,
      })),
    );
    setStatus("已載入", "ok");
  } catch (error) {
    setStatus("載入失敗，請確認本機服務是否正在執行。", "error");
  }
}

async function saveData(options = {}) {
  const { silent = false } = options;
  const payload = {
    title: titleInput.value.trim(),
    subtitle: subtitleInput.value.trim(),
    refreshSeconds: Number(refreshInput.value || 5),
    items: parseLines(itemsInput.value),
  };

  if (!silent) {
    setStatus("儲存中...");
  }

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
previewList.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
    return;
  }

  const index = Number(target.dataset.index);
  if (Number.isNaN(index) || !previewItems[index]) {
    return;
  }

  previewItems[index].enabled = target.checked;
  renderPreview([...previewItems]);
  await saveData({ silent: true });
});
saveButton.addEventListener("click", saveData);
reloadButton.addEventListener("click", loadData);

loadData();
