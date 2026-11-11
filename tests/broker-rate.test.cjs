const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function setup() {
  const root = path.join(__dirname, '..');
  const html = readFileSync(path.join(root, 'owner-operator.html'), 'utf8');
  const elements = {};
  for (const [tag] of html.matchAll(/<input\b[^>]*>/g)) {
    const id = tag.match(/\bid="([^"]+)"/)[1];
    elements[id] = {
      id, value: tag.match(/\bvalue="([^"]+)"/)[1], disabled: false,
      validity: { badInput: false }, required: /\brequired\b/.test(tag),
      closest: () => null, addEventListener(type, callback) { this[type] = callback; }
    };
  }
  elements['driver-draw-warning'] = { hidden: true, textContent: '' };
  let displayed;
  const context = vm.createContext({
    document: {
      body: { dataset: { calculator: 'owner' } },
      getElementById: (id) => elements[id],
      querySelectorAll: () => Object.values(elements).filter((element) => element.addEventListener)
    },
    getNumericInputValue(id) {
      const el = elements[id];
      if (el.validity.badInput || (!el.value.trim() && el.required)) return NaN;
      return Number(el.value);
    },
    readInputs() {
      return Object.fromEntries(vm.runInContext('Object.keys(OWNER_FIELDS)', context).map((id) => [id, context.getNumericInputValue(id)]));
    },
    renderValidation(errors) { context.errors = errors; },
    renderResults(result) { displayed = result; }, renderBreakdown() {}, renderDeadMiles() {},
    requestAnimationFrame(callback) { callback(); }
  });
  for (const file of ['constants.js', 'calculations.js', 'main.js']) {
    vm.runInContext(readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  return { elements, context, result: () => displayed, edit(id, value) { elements[id].value = value; elements[id].input(); } };
}

test('broker rate and gross revenue update each other and connected results', () => {
  const app = setup();
  app.edit('miles', '1000');
  app.edit('broker_rate', '2.5');
  assert.equal(app.elements.revenue.value, '2500');
  assert.equal(app.result().grossRevenue, 2500);
  assert.equal(app.result().carrierTotal, 300);
  assert.equal(app.result().annualGrossRevenue, 30000);
  assert.equal(app.result().revenuePerMile, 2500 / 2000);
  app.edit('miles', '1200');
  assert.equal(app.elements.revenue.value, '3000');
  app.edit('revenue', '3600');
  assert.equal(app.elements.broker_rate.value, '3');
  app.edit('miles', '1000');
  assert.equal(app.elements.revenue.value, '3000');
});

test('derived rate retains precision until edited', () => {
  const app = setup();
  app.edit('miles', '3');
  app.edit('revenue', '1');
  assert.equal(app.elements.broker_rate.value, '0.3333');
  app.edit('miles', '6');
  assert.equal(Number(app.elements.revenue.value), 2);
  app.edit('broker_rate', '0.3333');
  assert.equal(Number(app.elements.revenue.value), 1.9998);
});

test('unavailable mileage preserves revenue, and invalid rates do not silently use old results', () => {
  const app = setup();
  app.edit('miles', '0');
  assert.equal(app.elements.revenue.value, '24500');
  assert.equal(app.elements.broker_rate.value, '');
  assert.equal(app.elements.broker_rate.disabled, true);
  app.edit('revenue', '2500');
  app.edit('miles', '');
  assert.equal(app.elements.revenue.value, '2500');
  app.edit('miles', '1000');
  assert.equal(app.elements.broker_rate.value, '2.5');
  assert.equal(app.elements.broker_rate.disabled, false);
  app.edit('broker_rate', '-1');
  assert.equal(app.result(), null);
  assert.ok(app.context.errors.broker_rate);
  assert.equal(app.elements.revenue.value, '2500');
  app.edit('broker_rate', '0');
  assert.equal(app.result().grossRevenue, 0);
});

test('clearing and retyping loaded miles restores the cached broker rate', () => {
  const app = setup();
  app.edit('miles', '');
  assert.equal(app.elements.revenue.value, '24500');
  assert.equal(app.elements.broker_rate.value, '');

  for (const digit of '2000') {
    app.elements.miles.value += digit;
    app.elements.miles.input();
  }

  assert.equal(app.elements.broker_rate.value, '2.45');
  assert.equal(app.elements.revenue.value, '4900');
  assert.equal(app.result().grossRevenue, 4900);
});

test('editing revenue while mileage is unavailable derives a new rate on re-entry', () => {
  const app = setup();
  app.edit('miles', '');
  app.edit('revenue', '30000');
  for (const digit of '12000') {
    app.elements.miles.value += digit;
    app.elements.miles.input();
  }

  assert.equal(app.elements.revenue.value, '30000');
  assert.equal(app.elements.broker_rate.value, '2.5');
});
