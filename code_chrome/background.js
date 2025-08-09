const RESOURCE_TYPES = [
  "main_frame", "sub_frame", "stylesheet", "script", "image", "font",
  "object", "media", "xmlhttprequest", "ping", "websocket", "other"
];

function wildcardToRegexString(pattern) {
  const p = (pattern ?? "*").trim();
  const esc = p.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
  const re = esc.replace(/\*/g, ".*").replace(/\?/g, ".");
  return `^${re}$`;
}

async function getRulesFromStorage() {
  const res = await chrome.storage.local.get("rules");
  return Array.isArray(res.rules) ? res.rules : [];
}

function buildDnrRules(rules) {
  const active = rules.filter(r => r && r.enabled !== false && r.name?.trim() && r.value != null);
  const base = 1000;
  return active.map((r, i) => ({
    id: base + i,
    priority: base + i,
    action: {
      type: "modifyHeaders",
      requestHeaders: [{
        header: r.name,
        operation: "set",
        value: String(r.value)
      }]
    },
    condition: {
      regexFilter: wildcardToRegexString(r.urlPattern || "*"),
      resourceTypes: RESOURCE_TYPES
    }
  }));
}

async function rebuildDynamicRules() {
  const rules = await getRulesFromStorage();
  const dnrRules = buildDnrRules(rules);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const toRemove = existing.map(r => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: toRemove,
    addRules: dnrRules
  });

  updateIcon(rules.filter(r => r?.enabled !== false && r.name && r.value != null).length);
}

function updateIcon(enabledCount) {
  const iconPath = enabledCount > 0
    ? { "16": "icons/icon16.png", "32": "icons/icon32.png" }
    : { "16": "icons/icon16-inactive.png", "32": "icons/icon32-inactive.png" };
  chrome.action.setIcon({ path: iconPath });
}

chrome.runtime.onInstalled.addListener(rebuildDynamicRules);
chrome.runtime.onStartup.addListener(rebuildDynamicRules);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rules) {
    rebuildDynamicRules();
  }
});

const DEBOUNCE_MS = 300;
const pending = new Map();

function setStorage(key, value, area = "local") {
  return chrome.storage[area].set({ [key]: value });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "save") return;
  const { key, value, flush = false, area = "local" } = msg;

  let entry = pending.get(key);
  if (!entry) entry = { timer: null, latest: value };
  entry.latest = value;

  const commit = async () => {
    try {
      await setStorage(key, entry.latest, area);
      sendResponse({ ok: true, saved: true });
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || "save failed" });
    } finally {
      pending.delete(key);
    }
  };

  if (flush) {
    if (entry.timer) clearTimeout(entry.timer);
    pending.set(key, entry);
    commit();
    return true;
  }

  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    setStorage(key, entry.latest, area).finally(() => pending.delete(key));
  }, DEBOUNCE_MS);

  pending.set(key, entry);
  sendResponse({ ok: true, queued: true });
});
