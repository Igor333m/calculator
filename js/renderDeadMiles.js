function renderDeadMiles(result) {
  const totalMiles = document.getElementById('ds-total-miles');
  const deadCost = document.getElementById('ds-dead-cost');
  const weeklyCost = document.getElementById('ds-dead-cost-weekly');
  const callout = document.getElementById('dead-callout');
  const dot = document.getElementById('dead-target-dot');
  const target = document.getElementById('dead-target-text');
  totalMiles.textContent = result ? result.totalMiles.toLocaleString('en-US') : '—';
  deadCost.textContent = formatCurrency(result?.deadMileCost);
  weeklyCost.textContent = result ? formatCurrency(result.deadMileCost / MONTHLY_TO_WEEKLY) + '/week' : '—';
  callout.classList.toggle('visible', Boolean(result && result.deadMiles > 0));
  callout.textContent = result
    ? 'The ' + formatCurrency(result.deadMileCost) + ' monthly deadhead running cost is already included in your business budget. It covers the empty-mile share of fuel, DEF, and your maintenance reserves.'
    : '';
  if (!result || result.deadPct === null) {
    dot.className = 'target-dot';
    target.textContent = result ? 'Enter business miles to see the percentage' : 'Check your inputs';
    return;
  }
  const overTarget = result.deadPct > result.targetPct;
  dot.className = 'target-dot ' + (overTarget ? 'red' : 'green');
  target.textContent = result.deadPct.toFixed(1) + '% empty — ' +
    (overTarget ? 'over' : 'within') + ' your ' + result.targetPct + '% target';
}
