import { Component, OnChanges, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ChartComponent } from './chart.component';
import { DataService } from '../core/data.service';
import { DEPARTMENTS, CANCEL_REASONS, PRIORITIES, LEVELS, Order, chain } from '../core/mock-data';

const fmt = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [ChartComponent, DecimalPipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnChanges {
  data = inject(DataService);
  dept = input<number | null>(null);          // null = Home, number = department index
  depts = DEPARTMENTS;

  ngOnChanges() { this.data.scope.set(this.dept()); }   // tell the service which scope to calculate

  s = this.data.stats;
  p = this.data.prevStats;
  groupName = computed(() => this.dept() === null ? 'Department' : 'Service');
  title = computed(() => this.dept() === null ? 'Home – All Departments' : DEPARTMENTS[this.dept()!].name + ' Department');
  period = computed(() => { const [a, b] = this.data.range(); return a === b ? fmt(a) : `${fmt(a)} – ${fmt(b)}`; });
  labels = computed(() => this.s().rows.map(r => r.label));
  colors = computed(() => this.s().rows.map(r => r.color));

  kpis = computed(() => {
    const s = this.s(), p = this.p();
    return [
      { l: 'Service requests', v: s.tot, d: this.delta(s.tot, p.tot) },
      { l: 'Delivered', v: s.del.length, d: this.delta(s.del.length, p.del.length) },
      { l: 'Escalations', v: s.esc.length, d: this.delta(s.esc.length, p.esc.length, true) },
      { l: 'Delayed', v: s.late.length, d: this.delta(s.late.length, p.late.length, true) },
      { l: 'Cancelled', v: s.can.length, d: this.delta(s.can.length, p.can.length, true) }
    ];
  });

  // ---- chart data ----
  c1 = computed(() => [{ data: this.s().rows.map(r => r.guests), backgroundColor: this.colors(), borderColor: '#fff', borderWidth: 2 }]);
  c2 = computed(() => [{ label: 'Delivery %', data: this.s().rows.map(r => +r.pct.toFixed(1)), backgroundColor: this.colors(), borderRadius: 4 }]);
  c2opt = { indexAxis: 'y', scales: { x: { min: 0, max: 100 } }, plugins: { legend: { display: false } } };
  c3 = computed(() => PRIORITIES.map((pr, i) => ({ label: pr, backgroundColor: ['#dc2626', '#f59e0b', '#10b981'][i],
    data: this.s().rows.map((_, g) => this.s().esc.filter(o => this.s().key(o) === g && o.priority === pr).length) })));
  c3opt = { scales: { x: { stacked: true }, y: { stacked: true, ticks: { precision: 0 } } } };
  c4 = computed(() => [{ label: 'Delayed orders', data: this.s().rows.map(r => r.late), backgroundColor: '#f59e0b', borderRadius: 4 }]);
  c4opt = { plugins: { legend: { display: false } }, scales: { y: { ticks: { precision: 0 } } } };
  c5 = computed(() => [{ data: [this.s().onTime, this.s().late.length, this.s().pen.length, this.s().can.length], backgroundColor: ['#10b981', '#f59e0b', '#94a3b8', '#ef4444'], borderWidth: 0 }]);
  c6 = computed(() => [{ data: this.s().reasons, backgroundColor: ['#2563eb', '#7c3aed', '#ef4444', '#94a3b8'], borderWidth: 0 }]);
  cancelReasons = CANCEL_REASONS;
  barOpt = { plugins: { legend: { display: false } }, scales: { y: { ticks: { precision: 0 } } } };
  hBarOpt = { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { precision: 0 } } } };
  // escalation hierarchy pie chart
  levelLabels = LEVELS;
  pie = computed(() => [{ data: this.s().levels, backgroundColor: ['#f59e0b', '#ea580c', '#dc2626'], borderColor: '#fff', borderWidth: 2 }]);
  chain = chain;
  // guest name / room no. / staff name, grouped department-wise (latest 2 per group)
  guestRows = computed(() => { const s = this.s(); return s.rows.flatMap((r, g) => s.list.filter(o => s.key(o) === g).sort((a, b) => b.date - a.date).slice(0, 2).map(o => ({ group: r.label, color: r.color, o }))); });
  dateOf = (t: number) => fmt(t);
  statusCls = (st: string) => st === 'Delivered' ? 'Resolved' : st === 'Pending' ? 'InProgress' : 'Open';
  topStaff = computed(() => this.s().byStaff.slice(0, 6));
  recentCan = computed(() => [...this.s().can].sort((a, b) => b.date - a.date).slice(0, 6));

  // ---- table data ----
  topEsc = computed(() => [...this.s().esc].sort((a, b) => PRIORITIES.indexOf(a.priority!) - PRIORITIES.indexOf(b.priority!) || b.date - a.date).slice(0, 8));
  topLate = computed(() => [...this.s().late].sort((a, b) => (b.actual! - b.expected) - (a.actual! - a.expected)).slice(0, 8));
  highCount = computed(() => this.s().esc.filter(o => o.priority === 'High').length);
  prio = (p: string) => this.s().esc.filter(o => o.priority === p).length;
  openEsc = computed(() => this.s().esc.filter(o => o.escStatus === 'Open').length);

  deptName = (o: Order) => DEPARTMENTS[o.dept].name;
  svcName = (o: Order) => DEPARTMENTS[o.dept].services[o.svc];
  cls = (s: string) => s.replace(' ', '');
  pctClass = (p: number) => p >= 90 ? 'Resolved' : p >= 75 ? 'InProgress' : 'Open';
  share = (n: number) => this.s().tot ? n / this.s().tot * 100 : 0;
  delta(cur: number, prev: number, bad = false) {
    if (!prev) return { t: '–', c: '' };
    const d = (cur - prev) / prev * 100, up = d >= 0;
    return { t: `${up ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}%`, c: (bad ? !up : up) ? 'up' : 'dn' };
  }
}
