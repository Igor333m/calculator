function breakdownDetails(inputs, result) {
  const monthly = (fields) => fields.map(([label, id]) => ({ label, amount: inputs[id] }));
  const miles = result.totalMiles.toLocaleString('en-US', { maximumFractionDigits: 10 });
  const rate = (value) => '$' + value.toLocaleString('en-US', { maximumFractionDigits: 10 });
  const annual = [
    ['Truck registration / plates', 'truck_reg'], ['UCR registration', 'ucr'],
    ['IFTA sticker / filing', 'ifta_sticker'], ['DOT physical exam', 'dot_physical'],
    ['HVUT 2290', 'hvut'], ['Other annual fees', 'other_annual']
  ];
  const reserves = [
    ['Oil & service reserve', 'oil_rate'], ['Tire reserve', 'tires_rate'],
    ['Repair reserve', 'repairs_rate']
  ];
  return [
    [
      { label: 'Fuel', amount: result.totalMiles / inputs.mpg * inputs.fuel_price, note: `${miles} business miles ÷ ${inputs.mpg} MPG × ${rate(inputs.fuel_price)}/gallon` },
      { label: 'DEF', amount: inputs.def }
    ],
    monthly([
      ['Occupational accident insurance', 'occ_accident'], ['Bobtail insurance', 'bobtail'],
      ['Non-trucking liability', 'ntl'], ['Trailer interchange insurance', 'trailer_interchange'],
      ['Truck physical damage insurance', 'phys_damage'], ['Cargo insurance', 'cargo_ins'],
      ['Primary liability insurance', 'primary_liability'], ['Trailer physical damage insurance', 'trailer_phys']
    ]),
    monthly([
      ['Truck payment', 'truck_pay'], ['Trailer payment', 'trailer_pay'],
      ['IFTA filing service', 'ifta_fee'], ['Parking', 'parking'], ['Other fixed costs', 'other_fixed']
    ]),
    annual.map(([label, id]) => ({ label, amount: inputs[id] / 12, note: `${formatCurrency(inputs[id])}/year ÷ 12` })),
    reserves.map(([label, id]) => ({ label, amount: inputs[id] * result.totalMiles, note: `${rate(inputs[id])}/business mile × ${miles} business miles` })),
    [{ label: 'Carrier fee', amount: result.carrierTotal, note: `${inputs.carrier_pct}% × ${formatCurrency(inputs.revenue)} monthly gross freight revenue` }],
    monthly([
      ['Tolls & scales', 'tolls'], ['Admin & bookkeeping', 'admin'],
      ['ELD / GPS / tech', 'eld'], ['Other operating costs', 'other_variable']
    ])
  ];
}

function breakdownValues(amount, result) {
  const shareBase = result.total + (result.ownerDraw || 0);
  return {
    perMile: formatPerMile(result.totalMiles > 0 ? amount / result.totalMiles : null),
    weekly: formatCurrency(amount / MONTHLY_TO_WEEKLY),
    monthly: formatCurrency(amount),
    percentage: (shareBase > 0 ? amount / shareBase * 100 : 0).toFixed(1) + '%'
  };
}

let breakdownPopoverCleanups = [];

function renderBreakdown(result, inputs) {
  const rows = document.getElementById('breakdown-rows');
  const shareLabel = document.getElementById('breakdown-share-label');
  if (shareLabel) {
    shareLabel.textContent = inputs.driver_rate > 0
      ? 'Share of business costs (%)'
      : 'Share of costs + owner draw (%)';
  }
  const openIndex = document.querySelector('.breakdown-popover:popover-open')?.dataset.index;
  breakdownPopoverCleanups.forEach((cleanup) => cleanup());
  breakdownPopoverCleanups = [];
  rows.innerHTML = '';
  if (!result) return;

  const ownerDraw = result.ownerDraw || 0;
  const driverPay = result.driverPay || 0;
  const driverMiles = result.totalMiles.toLocaleString('en-US', { maximumFractionDigits: 10 });
  const driverRate = '$' + inputs.driver_rate.toLocaleString('en-US', { maximumFractionDigits: 10 });
  const usesOwnerDraw = ownerDraw > 0;
  const usesDriverPay = !usesOwnerDraw && driverPay > 0;
  const primaryAmount = usesOwnerDraw ? ownerDraw : driverPay;
  const primaryLabel = usesOwnerDraw
    ? 'Owner-draw target'
    : usesDriverPay
      ? 'Hired-driver Wages'
      : 'Owner Draw / Hired-driver Wages';
  const primaryDetails = usesOwnerDraw
    ? [{ label: 'Owner-draw target', amount: ownerDraw }]
    : usesDriverPay
      ? [{ label: 'Hired-driver wages', amount: driverPay, note: `${driverRate}/business mile × ${driverMiles} business miles` }]
      : [{ label: 'Owner-draw target', amount: 0 }, { label: 'Hired-driver wages', amount: 0 }];

  function addRow(label, amount, color, details, index, primary = false) {
    const values = breakdownValues(amount, result);
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `breakdown-row${primary ? ' breakdown-primary-row' : ''}`;
    row.setAttribute('aria-expanded', 'false');
    row.setAttribute('aria-controls', `breakdown-details-${index}`);
    row.setAttribute('aria-haspopup', 'dialog');
    row.setAttribute('popovertarget', `breakdown-details-${index}`);
    row.innerHTML = `
      <span class="br-label">${label}</span>
      <span class="br-bar-wrap"><span class="br-bar-bg"><span class="br-bar"></span></span></span>
      <span class="br-cpm">${values.perMile}</span>
      <span class="br-weekly">${values.weekly}/wk</span>
      <span class="br-monthly">${values.monthly}/mo</span>
      <span class="br-pct">${values.percentage}</span>
    `;
    const bar = row.querySelector('.br-bar');
    bar.style.width = values.percentage;
    bar.style.background = color;

    const cells = (monthlyAmount) => {
      const value = breakdownValues(monthlyAmount, result);
      return `<td>${value.perMile}</td><td>${value.weekly}</td><td>${value.monthly}</td><td>${value.percentage}</td>`;
    };
    const panel = document.createElement('div');
    panel.className = 'breakdown-popover';
    panel.id = `breakdown-details-${index}`;
    panel.dataset.index = String(index);
    panel.setAttribute('popover', 'auto');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', `${panel.id}-title`);
    panel.tabIndex = -1;
    panel.innerHTML = `
      <div class="breakdown-popover-head">
        <h2 id="${panel.id}-title">${label}</h2>
        <button type="button" class="breakdown-popover-close" popovertarget="${panel.id}" popovertargetaction="hide" aria-label="Close cost details">&times;</button>
      </div>
      <div class="breakdown-table-scroll" tabindex="0" role="region" aria-label="${label} itemized costs">
        <table class="breakdown-details-table">
          <thead><tr><th scope="col">Item</th><th scope="col">$/mile</th><th scope="col">Weekly</th><th scope="col">Monthly</th><th scope="col">Share (%)</th></tr></thead>
          <tbody>${details.map((detail) => `<tr><th scope="row">${detail.label}${detail.note ? `<small>${detail.note}</small>` : ''}</th>${cells(detail.amount)}</tr>`).join('')}</tbody>
          <tfoot><tr><th scope="row">Total</th>${cells(amount)}</tr></tfoot>
        </table>
      </div>
      <p class="breakdown-popover-note">Percentages are shares of ${usesDriverPay ? 'business costs' : 'business costs plus owner draw'}. Weekly estimates use 52 weeks per year. Totals are calculated before rounding.</p>
    `;

    function positionPanel() {
      if (!panel.matches(':popover-open')) return;
      const anchor = row.getBoundingClientRect();
      const edge = 12;
      const gap = 8;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = Math.max(edge, Math.min(anchor.left, window.innerWidth - width - edge));
      const below = anchor.bottom + gap;
      const above = anchor.top - height - gap;
      const top = below + height <= window.innerHeight - edge ? below
        : above >= edge ? above
        : Math.max(edge, Math.min(anchor.top, window.innerHeight - height - edge));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    panel.addEventListener('toggle', () => {
      const open = panel.matches(':popover-open');
      row.setAttribute('aria-expanded', String(open));
      if (open) {
        positionPanel();
        window.addEventListener('resize', positionPanel);
        window.addEventListener('scroll', positionPanel, true);
      } else {
        window.removeEventListener('resize', positionPanel);
        window.removeEventListener('scroll', positionPanel, true);
      }
    });
    // Native buttons also activate on Enter/Space. Hover and focus alone do not open details.
    row.addEventListener('click', () => requestAnimationFrame(() => {
      if (panel.matches(':popover-open')) {
        positionPanel();
        panel.focus({ preventScroll: true });
      }
    }));
    breakdownPopoverCleanups.push(() => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
      panel.remove();
    });
    item.appendChild(row);
    rows.appendChild(item);
    document.body.appendChild(panel);
    // Preserve the selected category and refresh its values when calculator inputs change.
    if (String(index) === openIndex) panel.showPopover();
  }

  addRow(primaryLabel, primaryAmount, '#f59e0b', primaryDetails, 'primary', true);
  const details = breakdownDetails(inputs, result);
  result.breakdown.forEach((amount, index) => addRow(CATS[index], amount, BAR_COLORS[index], details[index], index));
}
