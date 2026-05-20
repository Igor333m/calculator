function renderBreakdown(result) {
  const rows = document.getElementById('breakdown-rows');
  rows.innerHTML = '';

  result.breakdown.forEach((amount, index) => {
    const pct = result.total > 0 ? (amount / result.total) * 100 : 0;
    const cpm = amount / result.miles;
    const weekly = amount / MONTHLY_TO_WEEKLY;

    // Build the row via innerHTML (no inline styles here)
    const row = document.createElement('div');
    row.className = 'breakdown-row';
    row.innerHTML = `
      <div class="br-label">${CATS[index]}</div>
      <div class="br-bar-wrap">
        <div class="br-bar-bg">
          <div class="br-bar"></div>
        </div>
      </div>
      <div class="br-cpm">${formatCurrency(cpm, 3)}/mi</div>
      <div class="br-weekly">${formatCurrency(weekly, 2)}/wk</div>
      <div class="br-monthly">${formatCurrency(amount, 2)}/mo</div>
      <div class="br-pct">${pct.toFixed(1)}%</div>
    `;

    // Set dynamic styles via JS — CSP allows this
    const bar = row.querySelector('.br-bar');
    bar.style.width = `${pct.toFixed(1)}%`;
    bar.style.background = BAR_COLORS[index];

    rows.appendChild(row);
  });
}