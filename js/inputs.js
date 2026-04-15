const INPUT_IDS = [
  'miles',
  'rpm',
  'dead_miles',
  'dead_target_pct',
  'mpg',
  'fuel_price',
  'def',
  'occ_accident',
  'bobtail',
  'ntl',
  'trailer_interchange',
  'phys_damage',
  'cargo_ins',
  'primary_liability',
  'trailer_phys',
  'truck_pay',
  'trailer_pay',
  'escrow',
  'ifta_fee',
  'parking',
  'other_fixed',
  'truck_reg',
  'ucr',
  'ifta_sticker',
  'dot_physical',
  'hvut',
  'other_annual',
  'oil',
  'tires',
  'repairs',
  'carrier_pct',
  'tolls',
  'driver',
  'admin',
  'eld',
  'other_variable'
];

function getNumericInputValue(id) {
  const element = document.getElementById(id);
  return element ? parseFloat(element.value) || 0 : 0;
}

function readInputs() {
  const values = {};

  for (const id of INPUT_IDS) {
    values[id] = getNumericInputValue(id);
  }

  return values;
}
