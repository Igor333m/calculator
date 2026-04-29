function calculate(inputs) {
  const miles = inputs.miles || 1;
  const rpm = inputs.rpm;
  const deadMiles = inputs.dead_miles;
  const targetPct = inputs.dead_target_pct;
  const totalMiles = miles + deadMiles;

  const mpg = inputs.mpg || 1;
  const fuelPrice = inputs.fuel_price;
  const grossRevenue = rpm * miles;
  const fuel = (totalMiles / mpg) * fuelPrice + inputs.def;

  const monthlyInsurance =
    inputs.occ_accident +
    inputs.bobtail +
    inputs.ntl +
    inputs.trailer_interchange +
    inputs.phys_damage +
    inputs.cargo_ins +
    inputs.primary_liability +
    inputs.trailer_phys;

  const equipmentFixed =
    inputs.truck_pay +
    inputs.trailer_pay +
    inputs.escrow +
    inputs.ifta_fee +
    inputs.parking +
    inputs.other_fixed;

  const annualMonthly =
    (inputs.truck_reg +
      inputs.ucr +
      inputs.ifta_sticker +
      inputs.dot_physical +
      inputs.hvut +
      inputs.other_annual) /
    12;

  const maintenance = inputs.oil + inputs.tires + inputs.repairs;
  const carrierTotal = grossRevenue * (inputs.carrier_pct / 100);
  const driverPay = inputs.driver;
  const otherOps =
    inputs.tolls +
    inputs.admin +
    inputs.eld +
    inputs.other_variable;

  const total =
    fuel +
    monthlyInsurance +
    equipmentFixed +
    annualMonthly +
    maintenance +
    carrierTotal +
    driverPay +
    otherOps;

  const fixedExclCarrier = total - carrierTotal;
  const cpm = fixedExclCarrier / (miles * (1 - inputs.carrier_pct / 100));
  // const cpm = total / miles;
  const annualTotal = total * 12;
  const annualGrossRevenue = grossRevenue * 12;
  const monthlyProfit = grossRevenue - total;

  const maintenanceCpm = maintenance / miles; // TODO: Industry average maintenance cost per mile could be used here instead of actual maintenance spend to show true dead mile cost even if user doesn't input maintenance costs
  const deadMileCost = deadMiles > 0
    ? (deadMiles / mpg) * fuelPrice + deadMiles * maintenanceCpm
    : 0;

  const weeklyRevenue = grossRevenue / MONTHLY_TO_WEEKLY;
  const weeklyCost = total / MONTHLY_TO_WEEKLY;
  const weeklyFuel = fuel / MONTHLY_TO_WEEKLY;
  const weeklyProfit = monthlyProfit / MONTHLY_TO_WEEKLY;
  const rawTotalMiles = (inputs.miles || 0) + deadMiles;
  const fuelCostPerMile = rawTotalMiles > 0 ? fuel / rawTotalMiles : 0;

  const loadedPpm = miles > 0 ? monthlyProfit / miles : null;
  const truePpm = totalMiles > 0 ? monthlyProfit / totalMiles : null;
  const deadPct = deadMiles > 0 ? (deadMiles / totalMiles) * 100 : 0;

  return {
    miles,
    rpm,
    deadMiles,
    targetPct,
    totalMiles,
    grossRevenue,
    fuel,
    monthlyInsurance,
    equipmentFixed,
    annualMonthly,
    maintenance,
    carrierTotal,
    driverPay,
    otherOps,
    total,
    cpm,
    annualTotal,
    annualGrossRevenue,
    monthlyProfit,
    weeklyRevenue,
    weeklyCost,
    weeklyFuel,
    weeklyProfit,
    fuelCostPerMile,
    deadMileCost,
    loadedPpm,
    truePpm,
    deadPct,
    breakdown: [
      driverPay,
      fuel,
      monthlyInsurance,
      equipmentFixed,
      annualMonthly,
      maintenance,
      carrierTotal,
      otherOps
    ]
  };
}
