function renderBreakdown(result) {
  const rows = document.getElementById('breakdown-rows');
  rows.innerHTML = result.breakdown
    .map((amount, index) => {
      const pct = result.total > 0 ? (amount / result.total) * 100 : 0;
      const cpm = amount / result.miles;

      return `<div class="breakdown-row">
      <div class="br-label">${CATS[index]}</div>
      <div class="br-bar-wrap">
        <div class="br-bar-bg">
          <div class="br-bar" style="width:${pct.toFixed(1)}%;background:${BAR_COLORS[index]}"></div>
        </div>
      </div>
      <div class="br-cpm">${formatCurrency(cpm, 3)}/mi</div>
      <div class="br-pct">${pct.toFixed(1)}%</div>
    </div>`;
    })
    .join('');
}
