const browser = window.browser || window.chrome;

let rules = [];

function wildcardToRegExp(pattern) {
  const esc = pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&");
  const regexPattern = esc.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regexPattern}$`);
}

function updateIcon(enabledCount) {
  const iconPath = enabledCount > 0
    ? { "19": "icons/icon19.png", "38": "icons/icon38.png" }
    : { "19": "icons/icon19-inactive.png", "38": "icons/icon38-inactive.png" };
  browser.browserAction.setIcon({ path: iconPath });
}

function loadRules() {
  browser.storage.local.get("rules")
    .then(res => {
      rules = Array.isArray(res.rules) ? res.rules : [];
      updateListener();
      updateIcon(rules.filter(r => r.enabled).length);
    })
    .catch(console.error);
}

function onBeforeSendHeaders(details) {
  const modifiedHeaders = [...details.requestHeaders];

  for (const rule of rules) {
    if (!rule.enabled || !rule.name?.trim()) continue;

    let regex;
    try {
      regex = wildcardToRegExp(rule.urlPattern?.trim() || "*");
    } catch {
      continue;
    }

    if (!regex.test(details.url)) continue;

    const headerIndex = modifiedHeaders.findIndex(
      h => h.name.toLowerCase() === rule.name.toLowerCase()
    );

    if (headerIndex > -1) {
      modifiedHeaders[headerIndex].value = rule.value;
    } else {
      modifiedHeaders.push({ name: rule.name, value: rule.value });
    }
  }

  return { requestHeaders: modifiedHeaders };
}

function updateListener() {
  browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);

  const activeCount = rules.filter(r => r.enabled).length;
  if (activeCount === 0) return;

  browser.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
  );
}

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.rules) return;

  rules = Array.isArray(changes.rules.newValue) ? changes.rules.newValue : [];
  updateListener();
  updateIcon(rules.filter(r => r.enabled).length);
});

loadRules();
