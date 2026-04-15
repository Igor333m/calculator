function renderDeadMiles(result) {
  const dsTotalMiles = document.getElementById('ds-total-miles');
  const dsDeadCost = document.getElementById('ds-dead-cost');
  const dsDeadCostMonthly = document.getElementById('ds-dead-cost-monthly');
  const deadCallout = document.getElementById('dead-callout');
  const targetDot = document.getElementById('dead-target-dot');
  const targetText = document.getElementById('dead-target-text');

  if (result.deadMiles > 0) {
    dsTotalMiles.textContent = result.totalMiles.toLocaleString('en-US');

    const deadWeeklyCost = result.deadMileCost / 4.33;
    dsDeadCost.textContent = formatCurrency(deadWeeklyCost, 0) + '/wk';
    dsDeadCostMonthly.textContent = formatCurrency(result.deadMileCost, 0) + '/mo';

    deadCallout.classList.add('visible');
    deadCallout.textContent =
      'Your dead miles are costing ~' +
      formatCurrency(result.deadMileCost, 0) +
      '/month in fuel and maintenance with zero revenue offset. That is ' +
      formatCurrency(result.deadMileCost / result.miles, 3) +
      ' added to your effective cost per loaded mile.';

    const overTarget = result.deadPct > result.targetPct;
    targetDot.className = 'target-dot ' + (overTarget ? 'red' : 'green');

    if (overTarget) {
      targetText.innerHTML =
        '<strong style="color:#f87171;">' +
        result.deadPct.toFixed(1) +
        '% dead</strong> - over your ' +
        result.targetPct +
        '% target';
    } else {
      targetText.innerHTML =
        '<strong style="color:#4ade80;">' +
        result.deadPct.toFixed(1) +
        '% dead</strong> - within your ' +
        result.targetPct +
        '% target';
    }

    return;
  }

  dsTotalMiles.textContent = result.miles.toLocaleString('en-US');
  dsDeadCostMonthly.textContent = '';
  dsDeadCost.textContent = '—';
  deadCallout.classList.remove('visible');
  targetDot.className = 'target-dot';
  targetText.innerHTML = 'Enter dead miles to see status';
}
