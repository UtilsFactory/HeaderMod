window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('rules-container');
  const addBtn    = document.getElementById('add-rule');
  const saveBtn   = document.getElementById('save');

  function renderRule(rule = {}, idx) {
    const div = document.createElement('div');
    div.className   = 'rule';
    div.dataset.idx = idx;

    // URL Pattern
    const lblPattern = document.createElement('label');
    lblPattern.htmlFor    = `patt-${idx}`;
    lblPattern.textContent = 'URL Pattern:';
    const inpPattern = document.createElement('input');
    inpPattern.id         = `patt-${idx}`;
    inpPattern.type       = 'text';
    inpPattern.className  = 'rule-pattern';
    inpPattern.placeholder = '*.example.com/*';
    inpPattern.value      = rule.urlPattern || '';

    // Header Name
    const lblName = document.createElement('label');
    lblName.htmlFor    = `name-${idx}`;
    lblName.textContent = 'Header Name:';
    const inpName = document.createElement('input');
    inpName.id          = `name-${idx}`;
    inpName.type        = 'text';
    inpName.className   = 'rule-name';
    inpName.placeholder = 'My-Header';
    inpName.value       = rule.name || '';

    // Header Value
    const lblValue = document.createElement('label');
    lblValue.htmlFor    = `value-${idx}`;
    lblValue.textContent = 'Header Value:';
    const inpValue = document.createElement('input');
    inpValue.id          = `value-${idx}`;
    inpValue.type        = 'text';
    inpValue.className   = 'rule-value';
    inpValue.placeholder = 'My-Value';
    inpValue.value       = rule.value || '';

    // Comment
    const lblComment = document.createElement('label');
    lblComment.htmlFor     = `comment-${idx}`;
    lblComment.textContent = 'Comment:';

    // Footer
    const footer = document.createElement('div');
    footer.className = 'rule-footer';

    // Comment
    const inpComment = document.createElement('input');
    inpComment.id          = `comment-${idx}`;
    inpComment.type        = 'text';
    inpComment.className   = 'rule-comment';
    inpComment.placeholder = 'Notes…';
    inpComment.value       = rule.comment || '';

    // Enabled
    const lblEnabled = document.createElement('label');
    lblEnabled.className = 'enabled-label';
    const chkEnabled = document.createElement('input');
    chkEnabled.type      = 'checkbox';
    chkEnabled.className = 'rule-enabled';
    if (rule.enabled) chkEnabled.checked = true;
    lblEnabled.appendChild(chkEnabled);
    lblEnabled.appendChild(document.createTextNode('Enabled'));

    // Delete button
    const btnDel = document.createElement('button');
    btnDel.className   = 'delete';
    btnDel.textContent = 'Delete';

    footer.append(inpComment, lblEnabled, btnDel);

    // Assemble all parts
    div.append(
      lblPattern, inpPattern,
      lblName,    inpName,
      lblValue,   inpValue,
      lblComment, footer
    );

    // Toggle disabled style
    const refresh = () => div.classList.toggle('disabled', !chkEnabled.checked);
    chkEnabled.addEventListener('change', refresh);
    refresh();

    // Delete handler
    btnDel.addEventListener('click', () => div.remove());

    return div;
  }

function loadRules() {
  browser.storage.local.get('rules')
    .then(res => {
      // grab stored rules array (or [])
      let rules = Array.isArray(res.rules) ? res.rules : [];

      // if no rules at all, insert one empty placeholder
      if (rules.length === 0) {
        rules = [{}];
      }

      // clear out old rows, then render each rule
      container.innerHTML = "";
      rules.forEach((r, i) => {
        container.appendChild(renderRule(r, i));
      });
    })
    .catch(console.error);
}

  function saveRules() {
    const newRules = Array.from(container.children).map(div => {
      let p = div.querySelector('.rule-pattern').value.trim();
      if (!p) p = '*';
      return {
        enabled:    div.querySelector('.rule-enabled').checked,
        urlPattern: p,
        name:       div.querySelector('.rule-name').value.trim(),
        value:      div.querySelector('.rule-value').value,
        comment:    div.querySelector('.rule-comment').value.trim()
      };
    });

    browser.storage.local.set({ rules: newRules })
           .then(() => window.close())
           .catch(console.error);
  }

  addBtn.addEventListener('click', () =>
    container.appendChild(renderRule({}, container.children.length))
  );
  saveBtn.addEventListener('click', saveRules);

  loadRules();
});
