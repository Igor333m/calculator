function formatCurrency(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
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

function setAmount(id, value, digits = 2, showSignColor = false) {
  const element = document.getElementById(id);
  element.textContent = formatCurrency(value, digits);
  element.classList.toggle('profit-positive', showSignColor && Number.isFinite(value) && value >= 0);
  element.classList.toggle('profit-negative', showSignColor && Number.isFinite(value) && value < 0);
}
