import { Injectable, computed, signal } from '@angular/core';
import { CANCEL_REASONS, DAY, DEPARTMENTS, MAX_DATE, ORDERS, Order, PALETTE } from './mock-data';

export type Mode = 'daily' | 'weekly' | 'monthly' | 'custom';
export interface Row { label: string; color: string; guests: number; tot: number; del: number; pen: number; avgT: number; late: number; esc: number; can: number; pct: number; }
export interface Stats {
  list: Order[]; del: Order[]; can: Order[]; pen: Order[]; late: Order[]; esc: Order[];
  tot: number; guests: number; onTime: number; avgTime: number; avgDelay: number; successRate: number; cancelRate: number;
  rows: Row[]; reasons: number[]; levels: number[]; byStaff: { name: string; dept: string; count: number; high: number }[]; key: (o: Order) => number;
}
const avg = (a: number[]) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const ok = (t: number) => isNaN(t) ? MAX_DATE : t;

@Injectable({ providedIn: 'root' })
export class DataService {
  // ---- filter state (signals) ----
  mode = signal<Mode>('daily');
  day = signal('2024-10-29');
  week = signal('2024-W44');
  month = signal('2024-10');
  from = signal('2024-10-23');
  to = signal('2024-10-29');
  /** null = Home (all departments), number = one department */
  scope = signal<number | null>(null);

  range = computed<[number, number]>(() => {
    switch (this.mode()) {
      case 'daily': { const t = ok(Date.parse(this.day())); return [t, t]; }
      case 'weekly': {
        const [y, w] = this.week().split('-W').map(Number), j = Date.UTC(y, 0, 4);
        const mon = j - ((new Date(j).getUTCDay() + 6) % 7) * DAY + (w - 1) * 7 * DAY;
        return [mon, mon + 6 * DAY];
      }
      case 'monthly': { const [y, m] = this.month().split('-').map(Number); return [Date.UTC(y, m - 1, 1), Date.UTC(y, m, 0)]; }
      default: { const a = ok(Date.parse(this.from())), b = ok(Date.parse(this.to())); return a > b ? [b, a] : [a, b]; }
    }
  });
  prevRange = computed<[number, number]>(() => {
    const [a, b] = this.range(), len = Math.round((b - a) / DAY) + 1, pb = a - DAY;
    return [pb - (len - 1) * DAY, pb];
  });
  periodLabel = computed(() => ({ daily: 'day', weekly: 'week', monthly: 'month', custom: 'period' }[this.mode()]));
  stats = computed(() => this.compute(this.range(), this.scope()));
  prevStats = computed(() => this.compute(this.prevRange(), this.scope()));

  private compute(r: [number, number], scope: number | null): Stats {
    const list = ORDERS.filter(o => o.date >= r[0] && o.date <= r[1] && (scope === null || o.dept === scope));
    const del = list.filter(o => o.status === 'Delivered'), can = list.filter(o => o.status === 'Cancelled');
    const pen = list.filter(o => o.status === 'Pending'), late = del.filter(o => o.late), esc = list.filter(o => !!o.escReason);
    // Home groups by department, Department page groups by service
    const labels = scope === null ? DEPARTMENTS.map(d => d.name) : DEPARTMENTS[scope].services;
    const colors = scope === null ? DEPARTMENTS.map(d => d.color) : PALETTE;
    const key = (o: Order) => scope === null ? o.dept : o.svc;
    const rows: Row[] = labels.map((label, i) => {
      const l = list.filter(o => key(o) === i), d = l.filter(o => o.status === 'Delivered');
      return { label, color: colors[i], tot: l.length, guests: new Set(l.map(o => o.guestId)).size, del: d.length, pen: l.filter(o => o.status === 'Pending').length,
        avgT: avg(d.map(o => o.actual!)), late: d.filter(o => o.late).length, esc: l.filter(o => o.escReason).length,
        can: l.filter(o => o.status === 'Cancelled').length, pct: l.length ? d.length / l.length * 100 : 0 };
    });
    const sm = new Map<string, { name: string; dept: string; count: number; high: number }>();
    for (const o of esc) { const e = sm.get(o.staff) ?? { name: o.staff, dept: DEPARTMENTS[o.dept].name, count: 0, high: 0 }; e.count++; if (o.priority === 'High') e.high++; sm.set(o.staff, e); }
    const byStaff = [...sm.values()].sort((a, b) => b.count - a.count || b.high - a.high);
    const levels = [1, 2, 3].map(l => esc.filter(o => o.escLevel === l).length);
    return { levels, byStaff, list, del, can, pen, late, esc, tot: list.length, guests: new Set(list.map(o => o.guestId)).size,
      onTime: del.length - late.length, avgTime: avg(del.map(o => o.actual!)), avgDelay: avg(late.map(o => o.actual! - o.expected)),
      successRate: del.length ? (del.length - late.length) / del.length * 100 : 0, cancelRate: list.length ? can.length / list.length * 100 : 0,
      rows, key, reasons: CANCEL_REASONS.map(c => can.filter(o => o.cancelReason === c).length) };
  }
}
