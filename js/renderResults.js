function renderResults(result) {
  const weeklyRevenue = document.getElementById('r-weekly-revenue');
  const monthlyRevenue = document.getElementById('r-monthly-revenue');
  const weeklyCost = document.getElementById('r-weekly-cost');
  const total = document.getElementById('r-total');
  const cpm = document.getElementById('r-cpm');
  const cpmSub = document.getElementById('r-cpm-sub');
  const annualRevenue = document.getElementById('r-annual-revenue');
  const annualTotal = document.getElementById('r-annual');
  const weeklyFuel = document.getElementById('r-weekly-fuel');
  const weeklyFuelSub = document.getElementById('r-weekly-fuel-sub');

  const ppmEl = document.getElementById('r-ppm');
  const ppmSub = document.getElementById('r-ppm-sub');
  const ppmDeadWrap = document.getElementById('r-ppm-dead-wrap');
  const ppmDeadEl = document.getElementById('r-ppm-dead');
  const monthlyProfit = document.getElementById('r-monthly-profit');
  const monthlyProfitSub = document.getElementById('r-monthly-profit-sub');
  const weeklyProfit = document.getElementById('r-weekly-profit');

  weeklyRevenue.textContent = formatCurrency(result.weeklyRevenue, 0);
  monthlyRevenue.textContent = formatCurrency(result.grossRevenue, 0);
  weeklyCost.textContent = formatCurrency(result.weeklyCost, 0);
  total.textContent = formatCurrency(result.total, 0);
  cpm.textContent = formatCurrency(result.cpm, 3);
  cpmSub.textContent = result.deadMiles > 0
    ? 'Cost per loaded mile (incl. dead-mile overhead)'
    : 'Cost per loaded mile (all expenses)';

  annualRevenue.textContent = formatCurrency(result.annualGrossRevenue, 0);
  annualTotal.textContent = formatCurrency(result.annualTotal, 0);
  weeklyFuel.textContent = formatCurrency(result.weeklyFuel, 0);
  weeklyFuelSub.textContent = 'Monthly: ' + formatCurrency(result.fuel, 0);

  if (result.rpm > 0) {
    ppmEl.textContent = formatCurrency(result.truePpm, 3);
    ppmEl.className = 'r-value ' + (result.truePpm >= 0 ? 'profit-positive' : 'profit-negative');
    ppmSub.textContent = 'w/ dead miles (true PPM)';

    if (result.deadMiles > 0) {
      ppmDeadEl.textContent = formatCurrency(result.loadedPpm, 3);
      ppmDeadEl.className = 'r-value ' + (result.loadedPpm >= 0 ? 'profit-positive' : 'profit-negative');
      ppmDeadEl.style.fontSize = '18px';
      ppmDeadEl.style.color = '';
      ppmDeadWrap.style.display = 'block';
    } else {
      ppmDeadWrap.style.display = 'none';
    }
  } else {
    ppmEl.textContent = '—';
    ppmEl.className = 'r-value';
    ppmSub.textContent = 'w/ dead miles (true PPM)';
    ppmDeadWrap.style.display = 'none';
  }

  if (result.monthlyProfit >= 0) {
    monthlyProfit.className = 'r-value profit-positive';
  } else {
    monthlyProfit.className = 'r-value profit-negative';
  }
  monthlyProfit.textContent = formatCurrency(result.monthlyProfit, 0);

  if (result.weeklyProfit >= 0) {
    weeklyProfit.className = 'r-value profit-positive';
  } else {
    weeklyProfit.className = 'r-value profit-negative';
  }
  weeklyProfit.textContent = formatCurrency(result.weeklyProfit, 0);
  weeklyProfit.style.fontSize = '18px';

  monthlyProfitSub.textContent = result.deadMileCost > 0
    ? 'Dead-mile impact est. ' + formatCurrency(result.deadMileCost, 0) + '/mo'
    : 'Monthly net profit after all costs';
}
