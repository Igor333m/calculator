const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

test('switching compensation modes updates escrow and carrier fee, then restores owner settings', () => {
  const elements = Object.fromEntries(Object.entries({ driver_rate: '0', owner_draw: '6000', escrow: '150', escrow_released: '40', carrier_pct: '12' }).map(([id, value]) => [id, {
    id, value, validity: { badInput: false }, closest: () => null,
    addEventListener(type, callback) { this[type] = callback; }
  }]));
  elements['driver-draw-warning'] = { hidden: true, textContent: '' };
  const context = vm.createContext({
    document: { body: { dataset: { calculator: 'owner' } }, getElementById: (id) => elements[id], querySelectorAll: () => Object.values(elements).filter((element) => element.addEventListener) },
    getNumericInputValue: (id) => Number(elements[id].value),
    readInputs: () => ({}), calculate: () => ({ valid: true, errors: {} }),
    renderValidation() {}, renderResults() {}, renderBreakdown() {}, renderDeadMiles() {}, requestAnimationFrame() {}
  });
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8'), context);
  elements.driver_rate.value = '0.6';
  elements.driver_rate.input();
  for (const id of ['owner_draw', 'escrow', 'escrow_released', 'carrier_pct']) assert.equal(elements[id].value, '0', id);
  for (const id of ['escrow', 'escrow_released', 'carrier_pct']) assert.equal(elements[id].disabled, true, id);
  elements.owner_draw.value = '6000';
  elements.owner_draw.input();
  assert.equal(elements.driver_rate.value, '0');
  assert.equal(elements.carrier_pct.value, '12');
  assert.equal(elements.escrow.value, '150');
  assert.equal(elements.escrow_released.value, '40');
  for (const id of ['escrow', 'escrow_released', 'carrier_pct']) assert.equal(elements[id].disabled, false, id);
  elements.carrier_pct.value = '15';
  elements.carrier_pct.input();
  assert.equal(elements.carrier_pct.value, '15');
  elements.driver_rate.value = '0.5';
  elements.driver_rate.input();
  elements.driver_rate.value = '0';
  elements.driver_rate.input();
  assert.equal(elements.carrier_pct.value, '12');
  assert.equal(elements.escrow.value, '150');
  assert.equal(elements.escrow_released.value, '40');
});
