const calculatorType = document.body.dataset.calculator;
let driverDrawWarningInput = null;

function handleDriverDrawExclusivity(changedInput) {
  if (!['driver', 'owner_draw'].includes(changedInput.id)) return;

  const otherId = changedInput.id === 'driver' ? 'owner_draw' : 'driver';
  const otherInput = document.getElementById(otherId);
  const warning = document.getElementById('driver-draw-warning');
  const changedAmount = getNumericInputValue(changedInput.id);
  const otherAmount = getNumericInputValue(otherId);

  if (changedAmount > 0 && otherAmount > 0) {
    otherInput.value = '0';
    const clearedLabel = otherId === 'driver' ? 'Hired-driver wages' : 'Owner-draw target';
    warning.textContent = `Hired-driver wages and owner-draw target cannot both be above $0. ${clearedLabel} was set to $0.`;
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
  if (inputs.driver > 0 && inputs.owner_draw > 0) {
    const warning = document.getElementById('driver-draw-warning');
    warning.textContent = 'Hired-driver wages and owner-draw target cannot both be above $0. Set one to $0 to continue.';
    warning.hidden = false;
  }
  const result = calculatorType === 'company' ? calculateCompanyDriver(inputs) : calculate(inputs);
  renderValidation(result.errors);
  const displayResult = result.valid ? result : null;
  if (calculatorType === 'company') {
    renderCompanyDriver(displayResult);
  } else {
    renderResults(displayResult);
    renderBreakdown(displayResult);
    renderDeadMiles(displayResult);
  }
}

document.querySelectorAll('input').forEach((element) => {
  element.min = element.min || '0';
  const label = element.closest('.field')?.querySelector('label');
  if (label) label.htmlFor = element.id;
  element.addEventListener('input', () => {
    handleDriverDrawExclusivity(element);
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

requestAnimationFrame(runCalculator);
