const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const context = vm.createContext({});
for (const file of ['constants.js', 'calculations.js', 'utils.js']) {
  vm.runInContext(readFileSync(path.join(root, 'js', file), 'utf8'), context);
}
const ownerIds = vm.runInContext('Object.keys(OWNER_FIELDS)', context);
const base = Object.fromEntries(ownerIds.map((id) => [id, 0]));
const scenario = {
  ...base, miles: 200, dead_miles: 100, revenue: 1000, mpg: 10, fuel_price: 4,
  def: 30, oil_rate: 0.02, tires_rate: 0.03, repairs_rate: 0.15,
  other_fixed: 240, carrier_pct: 10, escrow: 50, owner_draw: 300
};
const close = (actual, expected) => assert.ok(
  Math.abs(actual - expected) < 1e-8, `${actual} should equal ${expected}`
);

test('the agreed all-mile cash budget reconciles, including deadhead exactly once', () => {
  const result = context.calculate(scenario);
  assert.equal(result.valid, true);
  assert.equal(result.totalMiles, 300);
  close(result.revenuePerMile, 10 / 3);
  close(result.deadPct, 100 / 3);
  close(result.fuel, 150);
  close(result.maintenance, 60);
  close(result.deadMileCost, 70);
  close(result.baseCost, 450);
  close(result.carrierTotal, 100);
  close(result.total, 550);
  close(result.breakdown.reduce((sum, value) => sum + value, 0), 550);
  close(result.cashBeforeDraw, 400);
  close(result.cashAfterDraw, 100);
  close(result.cashPerMile, 4 / 3);
  close(result.breakEvenRate, 5 / 3);
  close(result.ownerTargetRate, 40 / 9);
});

test('the target revenue funds costs, percentage fees, escrow, and owner draw', () => {
  const result = context.calculate({ ...scenario, revenue: 8000 / 9 });
  close(result.cashAfterDraw, 0);
  const businessOnly = context.calculate({ ...scenario, revenue: 500 });
  close(businessOnly.grossRevenue - businessOnly.total, 0);
});

function renderOwnerResults(inputs) {
  const elements = new Map();
  const displayContext = vm.createContext({
    document: {
      getElementById(id) {
        if (!elements.has(id)) {
          const classes = new Set();
          elements.set(id, {
            textContent: '',
            classList: {
              toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
              contains(name) { return classes.has(name); }
            }
          });
        }
        return elements.get(id);
      }
    }
  });
  for (const file of ['constants.js', 'calculations.js', 'utils.js', 'renderResults.js']) {
    vm.runInContext(readFileSync(path.join(root, 'js', file), 'utf8'), displayContext);
  }
  const result = displayContext.calculate(inputs);
  displayContext.renderResults(result.valid ? result : null);
  return { result, elements };
}

const displayedAmount = (elements, id) => {
  const text = elements.get(id)?.textContent;
  assert.ok(text && text !== '—', `${id} should show an amount`);
  return Number(text.replace(/[$,]/g, ''));
};

test('the displayed target rate funds all business miles from loaded-mile revenue', () => {
  for (const inputs of [
    { ...base, miles: 2, dead_miles: 1, mpg: 1, revenue: 1, owner_draw: 1 },
    { ...scenario, dead_miles: 50 },
    { ...scenario, miles: 10000, dead_miles: 1000, other_fixed: 15000, owner_draw: 6000 }
  ]) {
    const { result, elements } = renderOwnerResults(inputs);
    const displayedRate = displayedAmount(elements, 'r-owner-target-rate');
    const funded = context.calculate({ ...inputs, revenue: displayedRate * inputs.miles });
    assert.ok(funded.cashAfterDraw >= -1e-8, `Displayed rate leaves a shortfall of ${funded.cashAfterDraw}`);
    assert.ok(displayedRate - result.ownerTargetRate < 0.001 + 1e-8);
  }
});

test('the monthly gross target funds the draw including periods with zero loaded miles', () => {
  for (const inputs of [
    scenario,
    { ...scenario, dead_miles: 50 },
    { ...scenario, carrier_pct: 25, escrow: 125, escrow_released: 20 },
    { ...scenario, miles: 0, dead_miles: 0 },
    { ...scenario, miles: 0 },
    { ...scenario, escrow_released: 10000 },
    { ...base, miles: 100, mpg: 10, other_fixed: 0.1, owner_draw: 0.2, escrow: 1 }
  ]) {
    const result = context.calculate(inputs);
    const revenue = result.ownerTargetRevenue;
    const funded = context.calculate({ ...inputs, revenue });
    assert.ok(funded.cashAfterDraw >= -1e-8, `Monthly target leaves a shortfall of ${funded.cashAfterDraw}`);
    const fundedDisplay = renderOwnerResults({ ...inputs, revenue }).elements;
    assert.doesNotMatch(fundedDisplay.get('r-cash-after-draw').textContent, /^-/);
    assert.equal(fundedDisplay.get('r-cash-after-draw').classList.contains('profit-negative'), false);
  }
  const invalid = renderOwnerResults({ ...scenario, mpg: 0 });
  assert.equal(invalid.elements.get('r-owner-target-rate').textContent, '—');
  const shortfall = renderOwnerResults({ ...scenario, revenue: 8000 / 9 - 1 }).elements;
  assert.equal(shortfall.get('r-cash-after-draw').textContent, '-$0.90');
  assert.equal(shortfall.get('r-cash-after-draw').classList.contains('profit-negative'), true);
});

test('more deadhead raises the loaded-mile target and covers the required monthly gross', () => {
  const before = context.calculate(scenario);
  const inputs = { ...scenario, dead_miles: 200 };
  const after = context.calculate(inputs);
  assert.ok(after.ownerTargetRate > before.ownerTargetRate);
  assert.ok(after.ownerTargetRevenue > before.ownerTargetRevenue);
  close(after.ownerTargetRate * inputs.miles, after.ownerTargetRevenue);
  close(context.calculate({ ...inputs, revenue: after.ownerTargetRevenue }).cashAfterDraw, 0);
  close(context.calculate({ ...inputs, revenue: after.ownerTargetRate * inputs.miles }).cashAfterDraw, 0);
});

test('a $6,000 owner draw is funded at the displayed loaded-mile target as deadhead grows', () => {
  const html = readFileSync(path.join(root, 'owner-operator.html'), 'utf8');
  const defaults = Object.fromEntries([...html.matchAll(/<input\b[^>]*>/g)].map(([tag]) => [
    tag.match(/\bid="([^"]+)"/)[1], Number(tag.match(/\bvalue="([^"]+)"/)[1])
  ]));
  let previousTarget = 0;
  for (const dead_miles of [0, 100, 1000, 2000]) {
    const inputs = { ...defaults, dead_miles, owner_draw: 6000, driver_rate: 0 };
    const { result, elements } = renderOwnerResults(inputs);
    assert.equal(result.valid, true);
    const rate = displayedAmount(elements, 'r-owner-target-rate');
    assert.ok(rate > previousTarget);
    previousTarget = rate;
    close(result.ownerTargetRate * inputs.miles, result.ownerTargetRevenue);
    const funded = context.calculate({ ...inputs, revenue: rate * inputs.miles });
    assert.ok(funded.cashBeforeDraw >= 6000 - 1e-8);
    assert.ok(funded.cashAfterDraw >= -1e-8);
  }
});

test('deadhead with no added running costs keeps the loaded-mile target unchanged', () => {
  const inputs = { ...base, miles: 100, mpg: 10, other_fixed: 100, owner_draw: 6000 };
  const before = context.calculate(inputs);
  const after = context.calculate({ ...inputs, dead_miles: 100 });
  assert.equal(after.ownerTargetRevenue, before.ownerTargetRevenue);
  assert.equal(after.ownerTargetRate, before.ownerTargetRate);
});

test('extra empty miles increase running costs and reserves without adding revenue', () => {
  const before = context.calculate(scenario);
  const after = context.calculate({ ...scenario, dead_miles: 200 });
  assert.equal(after.grossRevenue, before.grossRevenue);
  close(after.total - before.total, 60);
  close(after.maintenance - before.maintenance, 20);
  close(before.cashBeforeDraw - after.cashBeforeDraw, 60);
});

test('owner draw and refundable escrow stay outside business costs and freight revenue', () => {
  const before = context.calculate(scenario);
  const after = context.calculate({ ...scenario, owner_draw: 500, escrow: 100, escrow_released: 150 });
  assert.equal(after.total, before.total);
  assert.equal(after.grossRevenue, before.grossRevenue);
  assert.equal(after.breakEvenRate, before.breakEvenRate);
  close(after.netEscrow, -50);
  close(after.cashBeforeDraw, 500);
  close(after.cashAfterDraw, 0);
  const released = context.calculate({ ...scenario, escrow_released: 10000 });
  assert.equal(released.ownerTargetRate, 0);
});

test('escrow changes the target and available cash without changing per-mile revenue or costs', () => {
  const noEscrow = context.calculate({ ...scenario, escrow: 0, escrow_released: 0 });
  const escrow = context.calculate({ ...scenario, escrow: 150, escrow_released: 40 });
  close(escrow.ownerTargetRevenue - noEscrow.ownerTargetRevenue, 110 / 0.9);
  close(escrow.ownerTargetRate - noEscrow.ownerTargetRate, 110 / 0.9 / scenario.miles);
  close(noEscrow.cashBeforeDraw - escrow.cashBeforeDraw, 110);
  close(noEscrow.cashPerMile - escrow.cashPerMile, 110 / 300);
  assert.equal(escrow.costPerMile, noEscrow.costPerMile);
  assert.equal(escrow.revenuePerMile, noEscrow.revenuePerMile);
});

test('positive hired-driver rate and owner draw cannot be used together', () => {
  const result = context.calculate({ ...scenario, driver_rate: 0.60, owner_draw: 300 });
  assert.equal(result.valid, false);
  assert.match(result.errors.owner_draw, /either a hired-driver rate or an owner-draw target/i);
});

test('a hired-driver rate pays for loaded and deadhead miles and enters monthly costs', () => {
  const baseline = context.calculate({ ...scenario, driver_rate: 0, owner_draw: 0 });
  const wages = context.calculate({ ...scenario, driver_rate: 0.60, owner_draw: 0 });
  assert.equal(baseline.valid, true);
  assert.equal(wages.valid, true);
  assert.equal(wages.driverPay, 180);
  close(wages.total - baseline.total, 180);
  close(wages.costPerMile - baseline.costPerMile, 0.60);
  close(baseline.cashBeforeDraw - wages.cashBeforeDraw, 180);
  assert.ok(wages.breakEvenRate > baseline.breakEvenRate);
  const moreDeadhead = context.calculate({ ...scenario, dead_miles: 200, driver_rate: 0.60, owner_draw: 0 });
  close(moreDeadhead.driverPay - wages.driverPay, 60);
  const noMiles = context.calculate({ ...scenario, miles: 0, dead_miles: 0, driver_rate: 0.60, owner_draw: 0 });
  assert.equal(noMiles.driverPay, 0);
});

test('owner draw alone is valid and remains outside business costs', () => {
  const baseline = context.calculate({ ...scenario, driver_rate: 0, owner_draw: 0 });
  const draw = context.calculate({ ...scenario, driver_rate: 0, owner_draw: 300 });
  assert.equal(baseline.valid, true);
  assert.equal(draw.valid, true);
  assert.equal(draw.ownerDraw, 300);
  close(draw.total, baseline.total);
  close(draw.costPerMile, baseline.costPerMile);
  close(baseline.cashAfterDraw - draw.cashAfterDraw, 300);
});

test('zero mileage keeps monetary costs but has no per-mile or percentage result', () => {
  const result = context.calculate({ ...scenario, miles: 0, dead_miles: 0 });
  assert.equal(result.valid, true);
  assert.equal(result.miles, 0);
  assert.equal(result.totalMiles, 0);
  assert.equal(result.grossRevenue, 1000);
  assert.equal(result.fuel, 30);
  assert.equal(result.maintenance, 0);
  assert.equal(result.deadMileCost, 0);
  for (const key of ['revenuePerMile', 'costPerMile', 'cashPerMile', 'breakEvenRate', 'ownerTargetRate', 'fuelCostPerMile', 'deadPct']) {
    assert.equal(result[key], null, key);
  }
});

test('all-empty business mileage is valid and does not manufacture a loaded mile', () => {
  const result = context.calculate({ ...scenario, miles: 0 });
  assert.equal(result.valid, true);
  assert.equal(result.totalMiles, 100);
  assert.equal(result.miles, 0);
  assert.equal(result.revenuePerMile, 10);
  assert.equal(result.deadPct, 100);
  close(result.deadMileCost, result.fuel + result.maintenance);
  assert.equal(result.ownerTargetRate, null);
  assert.ok(result.ownerTargetRevenue > 0);
  const { elements } = renderOwnerResults({ ...scenario, miles: 0 });
  assert.equal(elements.get('r-owner-target-rate').textContent, '—');
});

test('annual fees are counted once and weekly projections agree with annual totals', () => {
  const result = context.calculate({ ...base, mpg: 10, miles: 100, truck_reg: 1200, revenue: 500 });
  assert.equal(result.annualMonthly, 100);
  assert.equal(result.total, 100);
  assert.equal(result.annualTotal, 1200);
  close(result.weeklyCost * 52, 1200);
  close(result.weeklyRevenue * 52, result.annualGrossRevenue);
  close(result.weeklyCashBeforeDraw * 52, result.cashBeforeDraw * 12);
});

test('invalid owner inputs are rejected rather than silently replaced', () => {
  for (const [field, value] of [
    ['miles', -1], ['dead_miles', -1], ['mpg', 0], ['mpg', -2],
    ['carrier_pct', 100], ['carrier_pct', 101], ['carrier_pct', -1],
    ['dead_target_pct', 101], ['revenue', NaN], ['fuel_price', Infinity],
    ['repairs_rate', -0.01], ['escrow_released', -1], ['owner_draw', -1]
  ]) {
    const result = context.calculate({ ...scenario, [field]: value });
    assert.equal(result.valid, false, `${field}=${value}`);
    assert.ok(result.errors[field]);
  }
  assert.equal(context.calculate({ ...scenario, revenue: 1e308 }).valid, false);
  assert.equal(context.calculate({ ...scenario, carrier_pct: 99.99 }).valid, true);
});

test('company drivers use only total mileage and their dollar-per-mile pay rate', () => {
  const result = context.calculateCompanyDriver({ company_miles: 300, company_rate: 0.60, mpg: 0, carrier_pct: 100 });
  assert.equal(result.valid, true);
  assert.equal(result.grossPay, 180);
  assert.equal(result.payPerMile, 0.60);
  close(result.weeklyPay * 52, result.annualPay);
  const zero = context.calculateCompanyDriver({ company_miles: 0, company_rate: 0.60 });
  assert.equal(zero.grossPay, 0);
  assert.equal(zero.payPerMile, null);
  for (const input of [
    { company_miles: -1, company_rate: 0.60 },
    { company_miles: 1, company_rate: -1 },
    { company_miles: NaN, company_rate: 1 },
    { company_miles: 1e308, company_rate: 10 }
  ]) assert.equal(context.calculateCompanyDriver(input).valid, false);
});

test('calculator pages expose valid defaults for their own calculation schema', () => {
  function readPageInputs(file) {
    const html = readFileSync(path.join(root, file), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, `${file} should have unique element IDs`);
    const inputIds = [];
    const defaults = {};
    for (const match of html.matchAll(/<input\b[^>]*>/g)) {
      const id = match[0].match(/\bid="([^"]+)"/)[1];
      inputIds.push(id);
      defaults[id] = Number(match[0].match(/\bvalue="([^"]+)"/)[1]);
    }
    return { html, inputIds, defaults };
  }

  const ownerPage = readPageInputs('owner-operator.html');
  const companyPage = readPageInputs('company-driver.html');
  const companyIds = vm.runInContext('Object.keys(COMPANY_FIELDS)', context);
  assert.deepEqual([...ownerPage.inputIds].sort(), [...ownerIds, 'broker_rate'].sort());
  assert.deepEqual([...companyPage.inputIds].sort(), [...companyIds].sort());
  assert.equal(context.calculate(ownerPage.defaults).valid, true);
  assert.equal(context.calculateCompanyDriver(companyPage.defaults).valid, true);
  assert.doesNotMatch(ownerPage.html, /company-panel|mode-switch|mode-company/);
  assert.doesNotMatch(companyPage.html, /owner-panel|mode-switch|mode-owner/);
  assert.equal(context.formatCurrency(Infinity), '—');
  assert.equal(context.formatCurrency(null), '—');
  assert.equal(context.formatPerMile(NaN), '—');
});
