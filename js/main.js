const calculatorType = document.body.dataset.calculator;

function runCalculator() {
  const inputs = readInputs(calculatorType);
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
  element.addEventListener('input', runCalculator);
});

requestAnimationFrame(runCalculator);
