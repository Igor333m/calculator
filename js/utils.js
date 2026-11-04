function normalizeCurrencyZero(value, digits) {
  return Number.isFinite(value) && Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
}

function formatCurrency(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  value = normalizeCurrencyZero(value, digits);
  if (value >= 0) {
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  return '-$' + Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatPerMile(value) {
  return Number.isFinite(value) ? formatCurrency(value, 3) + '/mi' : '—';
}

function roundUpTarget(value, digits) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  const scaled = value * scale;
  return Number.isFinite(scaled) ? Math.ceil(scaled) / scale : value;
}

function setAmount(id, value, digits = 2, showSignColor = false) {
  value = normalizeCurrencyZero(value, digits);
  const element = document.getElementById(id);
  element.textContent = formatCurrency(value, digits);
  element.classList.toggle('profit-positive', showSignColor && Number.isFinite(value) && value >= 0);
  element.classList.toggle('profit-negative', showSignColor && Number.isFinite(value) && value < 0);
}
