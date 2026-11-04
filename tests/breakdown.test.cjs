const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const context = vm.createContext({});
for (const file of ['constants.js', 'calculations.js', 'utils.js', 'renderBreakdown.js']) {
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), context);
}
const ids = vm.runInContext('Object.keys(OWNER_FIELDS)', context);
const inputs = Object.fromEntries(ids.map((id, index) => [id, index + 1]));
Object.assign(inputs, { miles: 1000, dead_miles: 200, mpg: 7, carrier_pct: 12, driver: 0, owner_draw: 100 });

test('itemized monthly amounts reconcile with each calculated breakdown row', () => {
  const result = context.calculate(inputs);
  assert.equal(result.valid, true);
  const details = context.breakdownDetails(inputs, result);
  assert.equal(details.length, result.breakdown.length);
  details.forEach((items, index) => {
    const sum = items.reduce((total, item) => total + item.amount, 0);
    assert.ok(Math.abs(sum - result.breakdown[index]) < 1e-8, `${index}: ${sum} != ${result.breakdown[index]}`);
  });
  assert.equal(details[1].length, 8);
  assert.equal(details[2].length, 5);
  assert.equal(details[3].length, 6);
  assert.match(details[3][0].note, /year ÷ 12/);
  assert.match(details[4][0].note, /1,200 business miles/);
  assert.match(details[5][0].note, /12%/);
});

test('zero inputs remain visible and changed inputs update their itemized amounts', () => {
  const changed = { ...inputs, parking: 0, occ_accident: 999 };
  const details = context.breakdownDetails(changed, context.calculate(changed));
  assert.equal(details[1].find((item) => item.label === 'Occupational accident insurance').amount, 999);
  assert.equal(details[2].find((item) => item.label === 'Parking').amount, 0);
});

test('detail columns use all business miles, 52 weeks per year, and the full budget share', () => {
  const values = context.breakdownValues(200, { total: 800, ownerDraw: 200, totalMiles: 100 });
  assert.equal(values.perMile, '$2.000/mi');
  assert.equal(values.weekly, '$46.15');
  assert.equal(values.monthly, '$200.00');
  assert.equal(values.percentage, '20.0%');
});

test('detail columns handle no mileage and an empty budget without invalid numbers', () => {
  const values = context.breakdownValues(0, { total: 0, ownerDraw: 0, totalMiles: 0 });
  assert.equal(values.perMile, '—');
  assert.equal(values.weekly, '$0.00');
  assert.equal(values.monthly, '$0.00');
  assert.equal(values.percentage, '0.0%');
});
