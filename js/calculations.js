function validateInputs(inputs, fields) {
  const errors = {};
  for (const [id, label] of Object.entries(fields)) {
    if (!Number.isFinite(inputs[id])) {
      errors[id] = 'Enter a valid number for ' + label.toLowerCase() + '.';
    } else if (inputs[id] < 0) {
      errors[id] = label + ' cannot be negative.';
    }
  }
  if ('mpg' in fields && Number.isFinite(inputs.mpg) && inputs.mpg <= 0) {
    errors.mpg = 'Truck MPG must be greater than zero.';
  }
  if ('carrier_pct' in fields && Number.isFinite(inputs.carrier_pct) && inputs.carrier_pct >= 100) {
    errors.carrier_pct = 'Carrier percentage must be less than 100%.';
  }
  if ('dead_target_pct' in fields && Number.isFinite(inputs.dead_target_pct) && inputs.dead_target_pct > 100) {
    errors.dead_target_pct = 'Deadhead target must be between 0% and 100%.';
  }
  return errors;
}

function finishCalculation(result) {
  const amounts = Object.values(result).flat();
  if (amounts.some((value) => typeof value === 'number' && !Number.isFinite(value))) {
    return { valid: false, errors: { calculation: 'These amounts are too large to calculate. Enter smaller values.' } };
  }
  return { ...result, valid: true, errors: {} };
}

function calculate(inputs) {
  const errors = validateInputs(inputs, OWNER_FIELDS);
  if (Object.keys(errors).length) return { valid: false, errors };
  const miles = inputs.miles;
  const deadMiles = inputs.dead_miles;
  const totalMiles = miles + deadMiles;
  const grossRevenue = inputs.revenue;
  const fuel = totalMiles / inputs.mpg * inputs.fuel_price + inputs.def;
  const monthlyInsurance = inputs.occ_accident + inputs.bobtail + inputs.ntl +
    inputs.trailer_interchange + inputs.phys_damage + inputs.cargo_ins +
    inputs.primary_liability + inputs.trailer_phys;
  const equipmentFixed = inputs.truck_pay + inputs.trailer_pay +
    inputs.ifta_fee + inputs.parking + inputs.other_fixed;
  const annualMonthly = (inputs.truck_reg + inputs.ucr + inputs.ifta_sticker +
    inputs.dot_physical + inputs.hvut + inputs.other_annual) / 12;
  const oilReserve = inputs.oil_rate * totalMiles;
  const tiresReserve = inputs.tires_rate * totalMiles;
  const repairsReserve = inputs.repairs_rate * totalMiles;
  const maintenanceRate = inputs.oil_rate + inputs.tires_rate + inputs.repairs_rate;
  const maintenance = oilReserve + tiresReserve + repairsReserve;
  const driverPay = inputs.driver;
  const otherOps = inputs.tolls + inputs.admin + inputs.eld + inputs.other_variable;
  const baseCost = fuel + monthlyInsurance + equipmentFixed + annualMonthly +
    maintenance + driverPay + otherOps;
  const carrierRate = inputs.carrier_pct / 100;
  const carrierTotal = grossRevenue * carrierRate;
  const total = baseCost + carrierTotal;
  const netEscrow = inputs.escrow - inputs.escrow_released;
  const cashBeforeDraw = grossRevenue - total - netEscrow;
  const cashAfterDraw = cashBeforeDraw - inputs.owner_draw;
  const breakEvenRevenue = baseCost / (1 - carrierRate);
  const ownerTargetRevenue = Math.max(0, baseCost + netEscrow + inputs.owner_draw) / (1 - carrierRate);
  const perMile = (amount) => totalMiles > 0 ? amount / totalMiles : null;
  const fuelCostPerMile = perMile(fuel);
  // Attribution only: fuel/DEF and reserves already belong to the full budget.
  const deadMileCost = totalMiles > 0
    ? deadMiles * (fuelCostPerMile + maintenanceRate)
    : 0;
  return finishCalculation({
    miles, deadMiles, totalMiles, targetPct: inputs.dead_target_pct,
    grossRevenue, fuel, monthlyInsurance, equipmentFixed, annualMonthly,
    oilReserve, tiresReserve, repairsReserve, maintenance, maintenanceRate,
    driverPay, otherOps, baseCost, carrierTotal, total, netEscrow,
    cashBeforeDraw, cashAfterDraw, breakEvenRevenue, ownerTargetRevenue,
    revenuePerMile: perMile(grossRevenue), costPerMile: perMile(total),
    cashPerMile: perMile(cashBeforeDraw), breakEvenRate: perMile(breakEvenRevenue),
    ownerTargetRate: perMile(ownerTargetRevenue), fuelCostPerMile,
    deadMileCost, deadPct: totalMiles > 0 ? deadMiles / totalMiles * 100 : null,
    weeklyRevenue: grossRevenue / MONTHLY_TO_WEEKLY,
    weeklyCost: total / MONTHLY_TO_WEEKLY,
    weeklyFuel: fuel / MONTHLY_TO_WEEKLY,
    weeklyCashBeforeDraw: cashBeforeDraw / MONTHLY_TO_WEEKLY,
    weeklyCashAfterDraw: cashAfterDraw / MONTHLY_TO_WEEKLY,
    annualGrossRevenue: grossRevenue * 12,
    annualTotal: total * 12,
    breakdown: [driverPay, fuel, monthlyInsurance, equipmentFixed, annualMonthly,
      maintenance, carrierTotal, otherOps]
  });
}

function calculateCompanyDriver(inputs) {
  const errors = validateInputs(inputs, COMPANY_FIELDS);
  if (Object.keys(errors).length) return { valid: false, errors };
  const grossPay = inputs.company_miles * inputs.company_rate;
  return finishCalculation({
    grossPay,
    weeklyPay: grossPay / MONTHLY_TO_WEEKLY,
    annualPay: grossPay * 12,
    payPerMile: inputs.company_miles > 0 ? grossPay / inputs.company_miles : null
  });
}
