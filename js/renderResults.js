function renderResults(result) {
  const values = {
    'r-revenue-per-mile': 'revenuePerMile', 'r-cost-per-mile': 'costPerMile',
    'r-break-even': 'breakEvenRate', 'r-owner-target-rate': 'ownerTargetRate',
    'r-cash-per-mile': 'cashPerMile'
  };
  for (const [id, key] of Object.entries(values)) {
    setAmount(id, result?.[key], 3, key === 'cashPerMile');
  }
  const amounts = {
    'r-monthly-revenue': 'grossRevenue', 'r-weekly-revenue': 'weeklyRevenue',
    'r-annual-revenue': 'annualGrossRevenue', 'r-total': 'total',
    'r-weekly-cost': 'weeklyCost', 'r-annual': 'annualTotal',
    'r-cash-before-draw': 'cashBeforeDraw', 'r-cash-after-draw': 'cashAfterDraw',
    'r-weekly-cash-before': 'weeklyCashBeforeDraw', 'r-weekly-cash-after': 'weeklyCashAfterDraw',
    'r-monthly-fuel': 'fuel', 'r-weekly-fuel': 'weeklyFuel',
    'reserve-oil-monthly': 'oilReserve', 'reserve-tires-monthly': 'tiresReserve',
    'reserve-repairs-monthly': 'repairsReserve', 'r-net-escrow': 'netEscrow'
  };
  for (const [id, key] of Object.entries(amounts)) {
    setAmount(id, result?.[key], 2, key.startsWith('cash') || key.startsWith('weeklyCash'));
  }
  document.getElementById('r-fuel-cost-per-mile').textContent = formatPerMile(result?.fuelCostPerMile);
}

function renderCompanyDriver(result) {
  setAmount('company-monthly-pay', result?.grossPay);
  setAmount('company-weekly-pay', result?.weeklyPay);
  setAmount('company-annual-pay', result?.annualPay);
  setAmount('company-pay-per-mile', result?.payPerMile, 3);
}
