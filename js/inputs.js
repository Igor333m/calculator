function getNumericInputValue(id) {
  const element = document.getElementById(id);
  if (!element || element.validity.badInput) return NaN;
  if (element.value.trim() === '') return element.required ? NaN : 0;
  return Number(element.value);
}

function readInputs(mode = 'owner') {
  const fields = mode === 'company' ? COMPANY_FIELDS : OWNER_FIELDS;
  return Object.fromEntries(Object.keys(fields).map((id) => [id, getNumericInputValue(id)]));
}

function renderValidation(errors) {
  document.querySelectorAll('.field-error').forEach((element) => element.remove());
  document.querySelectorAll('input').forEach((element) => {
    element.removeAttribute('aria-invalid');
    element.removeAttribute('aria-describedby');
  });
  const messages = Object.values(errors);
  const summary = document.getElementById('validation-errors');
  summary.hidden = messages.length === 0;
  summary.textContent = messages.length ? messages.join(' ') : '';
  for (const [id, message] of Object.entries(errors)) {
    const input = document.getElementById(id);
    if (!input) continue;
    const error = document.createElement('span');
    error.className = 'field-error';
    error.id = id + '-error';
    error.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', error.id);
    input.closest('.field').appendChild(error);
  }
}
