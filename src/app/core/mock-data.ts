export const DAY = 864e5;
export const START = Date.UTC(2024, 7, 1);      // 1 Aug 2024
export const MAX_DATE = Date.UTC(2024, 9, 29);  // 29 Oct 2024
export const PALETTE = ['#0f766e', '#2563eb', '#d97706', '#7c3aed', '#db2777'];

export interface Dept { name: string; slug: string; color: string; base: number; weight: number; lateRate: number; services: string[]; }
export const DEPARTMENTS: Dept[] = [
  { name: 'Housekeeping', slug: 'housekeeping', color: '#0f766e', base: 30, weight: .33, lateRate: .10, services: ['Room cleaning', 'Towels & linen', 'Turn-down', 'Minibar refill'] },
  { name: 'Food & Beverage', slug: 'food-beverage', color: '#2563eb', base: 25, weight: .28, lateRate: .20, services: ['Room dining', 'Beverages', 'Breakfast order', 'Special diet'] },
  { name: 'Front Office', slug: 'front-office', color: '#d97706', base: 15, weight: .21, lateRate: .24, services: ['Wake-up call', 'Key card', 'Luggage help', 'Cab booking'] },
  { name: 'Maintenance', slug: 'maintenance', color: '#7c3aed', base: 45, weight: .18, lateRate: .38, services: ['AC repair', 'Plumbing', 'Electrical', 'TV / Wi-Fi'] }
];
export const ESC_REASONS = ['Room not ready', 'Service delay', 'Quality issue', 'Billing issue', 'Wrong order'];
export const CANCEL_REASONS = ['Guest cancelled', 'Service unavailable', 'Hotel-side cancellation', 'Duplicate order'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
const ESC_STATUS = ['Open', 'In Progress', 'Resolved'];
const FIRST = ['Aarav', 'Priya', 'John', 'Maria', 'David', 'Emma', 'Raj', 'Sophia', 'Michael', 'Olivia', 'Arjun', 'Neha', 'Daniel', 'Ananya', 'Liam', 'Kavya', 'Noah', 'Isha', 'Ethan', 'Meera'];
const LAST = ['Smith', 'Nair', 'Kumar', 'Lopez', 'Chen', 'Wilson', 'Mehta', 'Lee', 'Brown', 'Davis', 'Sharma', 'Patel', 'Reddy', 'Iyer', 'Khan', 'Gupta', 'Das', 'Rao', 'Singh', 'Joshi', 'Verma'];
const guestName = (g: number) => FIRST[g % 20] + ' ' + LAST[Math.floor(g / 20) % 21];
const guestRoom = (g: number) => String(100 * (1 + g % 5) + 1 + Math.floor(g / 5) % 20);
const NAMES = ['John Smith', 'Priya Nair', 'Alex Kumar', 'Maria Lopez', 'David Chen', 'Emma Wilson', 'Raj Mehta', 'Sophia Lee', 'Michael Brown', 'Olivia Davis'];

export interface Order {
  id: string; date: number; dept: number; svc: number; guestId: string; guest: string; room: string; staff: string;
  status: 'Delivered' | 'Pending' | 'Cancelled';
  expected: number; actual?: number; late: boolean;
  escReason?: string; escLevel?: number; priority?: string; escStatus?: string; cancelReason?: string;
}

// ---- staff hierarchy: Staff -> Supervisor -> Manager -> General Manager ----
export const TEAM = [
  { staff: ['Ramesh K', 'Lakshmi P', 'Suresh B'], supervisor: 'Anita Rao', manager: 'Vikram Shetty' },      // Housekeeping
  { staff: ['Arjun M', 'Divya S', 'Karthik R'], supervisor: 'Pooja Iyer', manager: 'Sandeep Nair' },        // Food & Beverage
  { staff: ['Neha T', 'Rahul D', 'Fatima Z'], supervisor: 'Manoj Pillai', manager: 'Kavitha Reddy' },       // Front Office
  { staff: ['Gopal V', 'Imran A', 'Selvam J'], supervisor: 'Harish Gowda', manager: 'Deepa Menon' }        // Maintenance
];
export const GM = 'Rajiv Menon';
export const LEVELS = ['Level 1 – Supervisor', 'Level 2 – Manager', 'Level 3 – General Manager'];
/** escalation path of an order: handling staff -> ... -> highest level reached */
export function chain(o: Order): { name: string; role: string }[] {
  const t = TEAM[o.dept];
  return [{ name: o.staff, role: 'Staff' }, { name: t.supervisor, role: 'Supervisor' }, { name: t.manager, role: 'Manager' }, { name: GM, role: 'General Manager' }].slice(0, (o.escLevel ?? 0) + 1);
}

// seeded random generator -> same "static" data on every load
function rng(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function build(): Order[] {
  const R = rng(2024), pick = <T>(a: T[]) => a[Math.floor(R() * a.length)], out: Order[] = [];
  let n = 1000;
  for (let t = START; t <= MAX_DATE; t += DAY) {
    const count = 34 + Math.floor(R() * 18);
    for (let i = 0; i < count; i++) {
      let r = R(), d = 0, acc = DEPARTMENTS[0].weight;
      while (d < DEPARTMENTS.length - 1 && r > acc) { d++; acc += DEPARTMENTS[d].weight; }
      const dep = DEPARTMENTS[d], x = R(), g = Math.floor(R() * 420);
      const o: Order = { id: 'GS' + n++, date: t, dept: d, svc: Math.floor(R() * 4), guestId: 'G' + g,
        guest: guestName(g), room: guestRoom(g), staff: pick(TEAM[d].staff), status: x < .03 ? 'Cancelled' : x < .06 ? 'Pending' : 'Delivered',
        expected: Math.round(dep.base * (.85 + R() * .3)), late: false };
      if (o.status === 'Delivered') {
        const isLate = R() < dep.lateRate * .55;
        o.actual = Math.round(o.expected * (isLate ? 1.12 + R() * .7 : .55 + R() * .45));
        o.late = o.actual > o.expected;
      }
      if (o.status === 'Cancelled') o.cancelReason = pick(CANCEL_REASONS);
      if (o.status !== 'Cancelled' && ((o.late && R() < .3) || R() < .008)) {
        o.escReason = pick(ESC_REASONS); o.priority = R() < .25 ? 'High' : R() < .5 ? 'Medium' : 'Low'; o.escStatus = pick(ESC_STATUS);
        o.escLevel = o.priority === 'High' ? 3 : o.priority === 'Medium' ? 2 : 1;
      }
      out.push(o);
    }
  }
  return out;
}
export const ORDERS: Order[] = build();
