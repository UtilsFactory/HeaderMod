window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('rules-container');
  const addBtn    = document.getElementById('add-rule');

  function saveRules(flush = false) {
    const newRules = Array.from(container.children).map(div => ({
      urlPattern: div.querySelector('.rule-pattern')?.value.trim(),
      name:       div.querySelector('.rule-name')?.value.trim(),
      value:      div.querySelector('.rule-value')?.value,
      comment:    div.querySelector('.rule-comment')?.value.trim(),
      enabled:    div.querySelector('.rule-enabled')?.checked
    }));
    chrome.runtime.sendMessage({
      type: 'save',
      key: 'rules',
      value: newRules,
      flush
    });
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

      input.addEventListener('input', () => saveRules(false));
      input.addEventListener('blur', () => saveRules(true));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      });

      return input;
    };

    createField('URL Pattern', 'rule-pattern', `patt-${idx}`, rule.urlPattern, 'URL Pattern (e.g. *.example.com/*)');
    createField('Header Name', 'rule-name', `name-${idx}`, rule.name, 'Header-Name');
    createField('Header Value', 'rule-value', `value-${idx}`, rule.value, 'Header-Value');

    const footer = document.createElement('div');
    footer.className = 'rule-footer';

    const commentInput = document.createElement('input');
    commentInput.id = `comment-${idx}`;
    commentInput.className = 'rule-comment';
    commentInput.type = 'text';
    commentInput.placeholder = 'Notes';
    commentInput.value = rule.comment || '';
    footer.appendChild(commentInput);

    commentInput.addEventListener('input', () => saveRules(false));
    commentInput.addEventListener('blur', () => saveRules(true));
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commentInput.blur();
      }
    });

    const enabledLabel = document.createElement('label');
    enabledLabel.className = 'enabled-label';
    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.className = 'rule-enabled';
    enabledCheckbox.checked = rule.enabled !== false;
    enabledLabel.append(enabledCheckbox, document.createTextNode('Enabled'));
    footer.appendChild(enabledLabel);

    enabledCheckbox.addEventListener('change', () => {
      div.classList.toggle('disabled', !enabledCheckbox.checked);
      saveRules(true);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.setAttribute('aria-label', 'Delete rule');
    deleteBtn.addEventListener('click', () => {
      div.remove();
      saveRules(true);
    });

    footer.appendChild(deleteBtn);
    div.appendChild(footer);
    div.classList.toggle('disabled', !enabledCheckbox.checked);
    return div;
  }

  async function loadRules() {
    try {
      chrome.storage.local.get('rules', (res) => {
        const rules = Array.isArray(res.rules) ? res.rules : [{}];
        container.innerHTML = '';
        rules.forEach((r, i) => container.appendChild(renderRule(r, i)));
      });
    } catch (e) {
      console.error(e);
    }
  }

  addBtn.addEventListener('click', () => {
    container.appendChild(renderRule({}, container.children.length));
    saveRules(true);
  });

  loadRules();
});
