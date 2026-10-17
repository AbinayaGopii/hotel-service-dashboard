import { Injectable, inject } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataService } from './data.service';
import { DEPARTMENTS, chain } from './mock-data';

const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

@Injectable({ providedIn: 'root' })
export class ReportService {
  private data = inject(DataService);

  private build() {
    const s = this.data.stats(), [a, b] = this.data.range(), sc = this.data.scope();
    const scopeName = sc === null ? 'All departments' : DEPARTMENTS[sc].name;
    const f = (n: number) => +n.toFixed(1);
    const sections: Record<string, (string | number)[][]> = {
      'Summary': [['Metric', 'Value'], ['Total service requests', s.tot], ['Unique guests', s.guests], ['Delivered', s.del.length], ['Delivered on time', s.onTime],
        ['Delivered late', s.late.length], ['Avg delivery time (min)', f(s.avgTime)], ['Delivery success rate %', f(s.successRate)], ['Escalations', s.esc.length],
        ['High priority escalations', s.esc.filter(o => o.priority === 'High').length], ['Avg delay (min)', f(s.avgDelay)], ['Cancelled', s.can.length], ['Cancellation rate %', f(s.cancelRate)]],
      [sc === null ? 'Department stats' : 'Service stats']: [[sc === null ? 'Department' : 'Service', 'Total', 'Delivered', 'Pending', 'Avg time (min)', 'Delivery %', 'Delayed', 'Escalated', 'Cancelled'],
        ...s.rows.map(r => [r.label, r.tot, r.del, r.pen, f(r.avgT), f(r.pct), r.late, r.esc, r.can])],
      'Guest services': [['Order', 'Date', 'Guest', 'Room', 'Staff', 'Department', 'Service', 'Status'], ...s.list.map(o => [o.id, iso(o.date), o.guest, o.room, o.staff, DEPARTMENTS[o.dept].name, DEPARTMENTS[o.dept].services[o.svc], o.status])],
      'Escalations by staff': [['Staff', 'Department', 'Escalations', 'High priority'], ...s.byStaff.map(b => [b.name, b.dept, b.count, b.high])],
      'Escalations': [['Order', 'Date', 'Guest', 'Room', 'Department', 'Handled by (staff)', 'Escalation path', 'Reason', 'Priority', 'Status'], ...s.esc.map(o => [o.id, iso(o.date), o.guest, o.room, DEPARTMENTS[o.dept].name, o.staff, chain(o).map(c => `${c.name} (${c.role})`).join(' > '), o.escReason!, o.priority!, o.escStatus!])],
      'Delays': [['Order', 'Date', 'Guest', 'Room', 'Staff', 'Department', 'Expected (min)', 'Actual (min)', 'Delay (min)'], ...s.late.map(o => [o.id, iso(o.date), o.guest, o.room, o.staff, DEPARTMENTS[o.dept].name, o.expected, o.actual!, o.actual! - o.expected])],
      'Cancellations': [['Order', 'Date', 'Guest', 'Room', 'Staff', 'Department', 'Reason'], ...s.can.map(o => [o.id, iso(o.date), o.guest, o.room, o.staff, DEPARTMENTS[o.dept].name, o.cancelReason!])]
    };
    const period = a === b ? fmtDate(a) : `${fmtDate(a)} to ${fmtDate(b)}`;
    return { sections, period, scopeName, file: `hotel-report_${sc === null ? 'home' : DEPARTMENTS[sc].slug}_${iso(a)}_${iso(b)}` };
  }

  download(type: 'xlsx' | 'pdf' | 'csv') {
    const { sections, period, scopeName, file } = this.build();
    if (type === 'csv') {
      const q = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
      const lines = [`${q('Scope')},${q(scopeName)}`, `${q('Report period')},${q(period)}`];
      for (const [name, rows] of Object.entries(sections)) lines.push('', q(name.toUpperCase()), ...rows.map(r => r.map(q).join(',')));
      this.save(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv' }), file + '.csv');
    }
    if (type === 'xlsx') {
      const wb = XLSX.utils.book_new();
      for (const [name, rows] of Object.entries(sections)) {
        const data = name === 'Summary' ? [['Scope', scopeName], ['Report period', period], [], ...rows] : rows;
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name.slice(0, 31));
      }
      XLSX.writeFile(wb, file + '.xlsx');
    }
    if (type === 'pdf') {
      const doc = new jsPDF(); doc.setFontSize(18); doc.text('Hotel Guest Service Report', 14, 16);
      doc.setFontSize(10); doc.text(`${scopeName}  |  ${period}`, 14, 23);
      let y = 30;
      for (const [name, rows] of Object.entries(sections)) {
        if (y > 245) { doc.addPage(); y = 16; }
        doc.setFontSize(12); doc.text(name, 14, y);
        autoTable(doc, { head: [rows[0] as string[]], body: rows.slice(1, 41) as string[][], startY: y + 3, styles: { fontSize: 8 }, headStyles: { fillColor: [15, 118, 110] }, margin: { left: 14, right: 14 } });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
      doc.save(file + '.pdf');
    }
  }
  private save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
  }
}
