const BAR_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

const CATS = [
  'Hired-driver Wages',
  'Fuel & DEF',
  'Monthly Fixed Insurance',
  'Equipment / Filing / Parking',
  'Annual Costs (÷12)',
  'Maintenance & Tires',
  'Carrier Fee (% of gross)',
  'Additional Operating Costs'
];
const MONTHLY_TO_WEEKLY = 52 / 12;

const OWNER_FIELDS = {
  miles: 'Loaded miles', revenue: 'Monthly gross freight revenue',
  dead_miles: 'Deadhead miles', dead_target_pct: 'Deadhead target',
  mpg: 'Truck MPG', fuel_price: 'Fuel price', def: 'DEF budget',
  occ_accident: 'Occupational accident insurance', bobtail: 'Bobtail insurance',
  ntl: 'Non-trucking liability', trailer_interchange: 'Trailer interchange insurance',
  phys_damage: 'Truck physical damage insurance', cargo_ins: 'Cargo insurance',
  primary_liability: 'Primary liability insurance', trailer_phys: 'Trailer physical damage insurance',
  truck_pay: 'Truck payment', trailer_pay: 'Trailer payment',
  escrow: 'Escrow contributions', escrow_released: 'Escrow releases', owner_draw: 'Owner-draw target',
  ifta_fee: 'IFTA filing service', parking: 'Parking', other_fixed: 'Other fixed costs',
  truck_reg: 'Truck registration', ucr: 'UCR registration', ifta_sticker: 'IFTA sticker',
  dot_physical: 'DOT physical', hvut: 'HVUT', other_annual: 'Other annual fees',
  oil_rate: 'Oil and service reserve rate', tires_rate: 'Tire reserve rate', repairs_rate: 'Repair reserve rate',
  carrier_pct: 'Carrier percentage', tolls: 'Tolls and scales', driver: 'Hired-driver wages',
  admin: 'Admin and bookkeeping', eld: 'ELD and technology', other_variable: 'Other operating costs'
};

const COMPANY_FIELDS = {
  company_miles: 'Monthly business miles',
  company_rate: 'Pay rate'
};
