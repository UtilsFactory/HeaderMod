let rules = [];

// turn a wildcard string (“*.example.com/*”) into a RegExp
function wildcardToRegExp(pattern) {
  const esc = pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&");
  const pat = esc.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${pat}$`);
}

// update the toolbar icon based on how many rules are enabled
function updateIcon(enabledCount) {
  const path = enabledCount > 0
    ? { "19": "icons/icon19-active.png", "38": "icons/icon38-active.png" }
    : { "19": "icons/icon19.png",        "38": "icons/icon38.png" };
  browser.browserAction.setIcon({ path });
}

// load saved rules at startup
function loadRules() {
  browser.storage.local.get("rules")
    .then(res => {
      rules = Array.isArray(res.rules) ? res.rules : [];
      console.log("[HeaderMod] Loaded rules:", rules);
      const enabledCount = rules.filter(r => r.enabled).length;
      updateListener();
      updateIcon(enabledCount);
    })
    .catch(err => console.error("[HeaderMod] loadRules error", err));
}

// the webRequest callback
function onBeforeSend(details) {
  let headers = details.requestHeaders.slice();

  for (const rule of rules) {
    if (!rule.enabled)                continue;
    if (!rule.name || !rule.name.trim()) continue;

    let regex;
    try { regex = wildcardToRegExp((rule.urlPattern||"*").trim()); }
    catch { continue; }
    if (!regex.test(details.url))     continue;

    const idx = headers.findIndex(
      h => h.name.toLowerCase() === rule.name.toLowerCase()
    );
    if (idx > -1) headers[idx].value = rule.value;
    else          headers.push({ name: rule.name, value: rule.value });
  }

  return { requestHeaders: headers };
}

// attach/detach the listener depending on enabled rules
function updateListener() {
  browser.webRequest.onBeforeSendHeaders.removeListener(onBeforeSend);

  const enabledCount = rules.filter(r => r.enabled).length;
  console.log("[HeaderMod] enabled rules count:", enabledCount);

  if (enabledCount > 0) {
    browser.webRequest.onBeforeSendHeaders.addListener(
      onBeforeSend,
      { urls: ["<all_urls>"] },
      ["blocking", "requestHeaders"]
    );
    console.log("[HeaderMod] Listener registered.");
  } else {
    console.log("[HeaderMod] No enabled rules → listener not registered.");
  }
}

// re-load & re-attach whenever popup.js writes new rules
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.rules) {
    rules = Array.isArray(changes.rules.newValue)
      ? changes.rules.newValue
      : [];
    const enabledCount = rules.filter(r => r.enabled).length;
    console.log("[HeaderMod] rules updated via storage:", rules);
    updateListener();
    updateIcon(enabledCount);
  }
});

// kick things off
loadRules();
