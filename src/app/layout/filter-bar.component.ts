import { Component, HostListener, inject, signal } from '@angular/core';
import { DataService, Mode } from '../core/data.service';
import { ReportService } from '../core/report.service';

@Component({
  selector: 'app-filter-bar', standalone: true,
  templateUrl: './filter-bar.component.html'
})
export class FilterBarComponent {
  data = inject(DataService);
  private report = inject(ReportService);
  modes: { id: Mode; label: string }[] = [{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'custom', label: 'Custom Range' }];
  menuOpen = signal(false);

  val(e: Event) { return (e.target as HTMLInputElement).value; }
  download(t: 'xlsx' | 'pdf' | 'csv') { this.report.download(t); this.menuOpen.set(false); }
  toggle(e: Event) { e.stopPropagation(); this.menuOpen.update(v => !v); }
  @HostListener('document:click') close() { this.menuOpen.set(false); }
}
