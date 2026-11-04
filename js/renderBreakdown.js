function renderBreakdown(result) {
  const rows = document.getElementById('breakdown-rows');
  rows.innerHTML = '';
  if (!result) return;

  const ownerDraw = result.ownerDraw || 0;
  const driverPay = result.driverPay || 0;
  const shareBase = result.total + ownerDraw;
  const usesOwnerDraw = ownerDraw > 0;
  const usesDriverPay = !usesOwnerDraw && driverPay > 0;
  const primaryAmount = usesOwnerDraw ? ownerDraw : driverPay;
  const primaryLabel = usesOwnerDraw
    ? 'Owner-draw target'
    : usesDriverPay
      ? 'Hired-driver Wages'
      : 'Owner Draw / Hired-driver Wages';
  const primaryPct = shareBase > 0 ? (primaryAmount / shareBase) * 100 : 0;
  const primaryPerMile = result.totalMiles > 0 ? primaryAmount / result.totalMiles : null;
  const primaryRow = document.createElement('div');
  primaryRow.className = 'breakdown-row breakdown-primary-row';
  primaryRow.innerHTML = `
    <div class="br-label">${primaryLabel}</div>
    <div class="br-bar-wrap">
      <div class="br-bar-bg">
        <div class="br-bar"></div>
      </div>
    </div>
    <div class="br-cpm">${formatPerMile(primaryPerMile)}</div>
    <div class="br-weekly">${formatCurrency(primaryAmount / MONTHLY_TO_WEEKLY, 2)}/wk</div>
    <div class="br-monthly">${formatCurrency(primaryAmount, 2)}/mo</div>
    <div class="br-pct">${primaryPct.toFixed(1)}%</div>
  `;
  const primaryBar = primaryRow.querySelector('.br-bar');
  primaryBar.style.width = `${primaryPct.toFixed(1)}%`;
  primaryBar.style.background = '#f59e0b';
  rows.appendChild(primaryRow);

  result.breakdown.forEach((amount, index) => {
    const pct = shareBase > 0 ? (amount / shareBase) * 100 : 0;
    const cpm = result.totalMiles > 0 ? amount / result.totalMiles : null;
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
      <div class="br-cpm">${formatPerMile(cpm)}</div>
      <div class="br-weekly">${formatCurrency(weekly, 2)}/wk</div>
      <div class="br-monthly">${formatCurrency(amount, 2)}/mo</div>
      <div class="br-pct">${pct.toFixed(1)}%</div>
    `;

    // Shares use monthly business costs plus owner draw as the denominator.
    const bar = row.querySelector('.br-bar');
    bar.style.width = `${pct.toFixed(1)}%`;
    bar.style.background = BAR_COLORS[index];

    rows.appendChild(row);
  });
}
