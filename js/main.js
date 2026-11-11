const calculatorType = document.body.dataset.calculator;
let driverDrawWarningInput = null;
let driverModeActive = false;
let ownerEscrow = null;

function syncCompensationMode() {
  if (calculatorType !== 'owner') return;
  const driverMode = getNumericInputValue('driver_rate') > 0;
  const escrow = document.getElementById('escrow');
  const released = document.getElementById('escrow_released');
  const carrier = document.getElementById('carrier_pct');
  if (driverMode && !driverModeActive) {
    ownerEscrow = { contribution: escrow.value, released: released.value };
    escrow.value = released.value = carrier.value = '0';
  } else if (!driverMode && driverModeActive) {
    escrow.value = ownerEscrow.contribution;
    released.value = ownerEscrow.released;
    carrier.value = '12';
  }
  escrow.disabled = released.disabled = carrier.disabled = driverMode;
  driverModeActive = driverMode;
}

function handleDriverDrawExclusivity(changedInput) {
  if (!['driver_rate', 'owner_draw'].includes(changedInput.id)) return;

  const otherId = changedInput.id === 'driver_rate' ? 'owner_draw' : 'driver_rate';
  const otherInput = document.getElementById(otherId);
  const warning = document.getElementById('driver-draw-warning');
  const changedAmount = getNumericInputValue(changedInput.id);
  const otherAmount = getNumericInputValue(otherId);

  if (changedAmount > 0 && otherAmount > 0) {
    otherInput.value = '0';
    const clearedLabel = otherId === 'driver_rate' ? 'Hired-driver rate' : 'Owner-draw target';
    warning.textContent = `Hired-driver rate and owner-draw target cannot both be positive. ${clearedLabel} was set to 0.`;
    warning.hidden = false;
    driverDrawWarningInput = changedInput.id;
    return;
  }

  if (changedInput.id !== driverDrawWarningInput && !warning.hidden) {
    warning.hidden = true;
    warning.textContent = '';
    driverDrawWarningInput = null;
  }
}

function runCalculator() {
  const inputs = readInputs(calculatorType);
  if (inputs.driver_rate > 0 && inputs.owner_draw > 0) {
    const warning = document.getElementById('driver-draw-warning');
    warning.textContent = 'Hired-driver rate and owner-draw target cannot both be positive. Set one to 0 to continue.';
    warning.hidden = false;
  }
  const result = calculatorType === 'company' ? calculateCompanyDriver(inputs) : calculate(inputs);
  renderValidation(result.errors);
  const displayResult = result.valid ? result : null;
  if (calculatorType === 'company') {
    renderCompanyDriver(displayResult);
  } else {
    renderResults(displayResult);
    renderBreakdown(displayResult, inputs);
    renderDeadMiles(displayResult);
  }
}

document.querySelectorAll('input').forEach((element) => {
  element.min = element.min || '0';
  const label = element.closest('.field')?.querySelector('label');
  if (label) label.htmlFor = element.id;
  element.addEventListener('input', () => {
    handleDriverDrawExclusivity(element);
    syncCompensationMode();
    runCalculator();
  });
  element.addEventListener('blur', () => {
    if (element.id === driverDrawWarningInput) {
      const warning = document.getElementById('driver-draw-warning');
      warning.hidden = true;
      warning.textContent = '';
      driverDrawWarningInput = null;
    }
  });
});

syncCompensationMode();
requestAnimationFrame(runCalculator);
