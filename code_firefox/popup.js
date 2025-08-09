window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('rules-container');
  const addBtn    = document.getElementById('add-rule');
  let saveTimeout;

  function scheduleSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveRules, 300);
  }

  function renderRule(rule = {}, idx) {
    const div = document.createElement('div');
    div.className = 'rule';
    div.dataset.idx = idx;

    const createField = (labelText, className, id, value, placeholder) => {
      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.className = 'sr-only';
      label.textContent = labelText;

      const input = document.createElement('input');
      input.id = id;
      input.type = 'text';
      input.className = className;
      input.placeholder = placeholder;
      input.value = value || '';

      div.append(label, input);
      input.addEventListener('input', scheduleSave);
      return input;
    };

    const patternInput = createField('URL Pattern', 'rule-pattern', `patt-${idx}`, rule.urlPattern, 'URL Pattern (e.g. *.example.com/*)');
    const nameInput    = createField('Header Name', 'rule-name', `name-${idx}`, rule.name, 'Header-Name');
    const valueInput   = createField('Header Value', 'rule-value', `value-${idx}`, rule.value, 'Header-Value');

    const footer = document.createElement('div');
    footer.className = 'rule-footer';

    const commentInput = document.createElement('input');
    commentInput.id = `comment-${idx}`;
    commentInput.className = 'rule-comment';
    commentInput.type = 'text';
    commentInput.placeholder = 'Notes';
    commentInput.value = rule.comment || '';
    commentInput.addEventListener('input', scheduleSave);

    const enabledLabel = document.createElement('label');
    enabledLabel.className = 'enabled-label';
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.className = 'rule-enabled';
    enabledCheckbox.checked = rule.enabled !== false;
    enabledLabel.append(enabledCheckbox, document.createTextNode('Enabled'));

    enabledCheckbox.addEventListener('change', () => {
      div.classList.toggle('disabled', !enabledCheckbox.checked);
      scheduleSave();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.setAttribute('aria-label', 'Delete rule');
    deleteBtn.addEventListener('click', () => {
      div.remove();
      scheduleSave();
    });

    footer.append(commentInput, enabledLabel, deleteBtn);
    div.appendChild(footer);

    div.classList.toggle('disabled', !enabledCheckbox.checked);
    return div;
  }

  function loadRules() {
    browser.storage.local.get('rules')
      .then(res => {
        let rules = Array.isArray(res.rules) ? res.rules : [{}];
        container.innerHTML = '';
        rules.forEach((r, i) => container.appendChild(renderRule(r, i)));
      })
      .catch(console.error);
  }

  function saveRules() {
    const newRules = Array.from(container.children).map(div => ({
      urlPattern: div.querySelector('.rule-pattern')?.value.trim(),
      name:       div.querySelector('.rule-name')?.value.trim(),
      value:      div.querySelector('.rule-value')?.value,
      comment:    div.querySelector('.rule-comment')?.value.trim(),
      enabled:    div.querySelector('.rule-enabled')?.checked
    }));
    browser.storage.local.set({ rules: newRules }).catch(console.error);
  }

  addBtn.addEventListener('click', () => {
    container.appendChild(renderRule({}, container.children.length));
    scheduleSave();
  });

  loadRules();
});
