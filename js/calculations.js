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

  const cpm = total / miles;
  const annualTotal = total * 12;
  const annualGrossRevenue = grossRevenue * 12;
  const monthlyProfit = grossRevenue - total;

  const maintenanceCpm = maintenance / miles;
  const deadMileCost = deadMiles > 0
    ? (deadMiles / mpg) * fuelPrice + deadMiles * maintenanceCpm
    : 0;

  const weeklyRevenue = grossRevenue / 4.33;
  const weeklyCost = total / 4.33;
  const weeklyFuel = fuel / 4.33;
  const weeklyProfit = monthlyProfit / 4.33;

  const loadedPpm = rpm > 0 ? rpm - cpm : null;
  const truePpm = rpm > 0 ? monthlyProfit / totalMiles : null;
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
