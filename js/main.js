function runCalculator() {
  const inputs = readInputs();
  const result = calculate(inputs);

  renderResults(result);
  renderBreakdown(result);
  renderDeadMiles(result);
}

document.querySelectorAll('input').forEach((element) => {
  element.addEventListener('input', runCalculator);
});

runCalculator();
