import { Component, computed, input } from '@angular/core';
import { DashboardComponent } from '../shared/dashboard.component';
import { DEPARTMENTS } from '../core/mock-data';

/** Department-wise = the same 6 sections for ONE department (broken down by service) */
@Component({ standalone: true, imports: [DashboardComponent], template: '<app-dashboard [dept]="idx()" />' })
export class DepartmentPage {
  slug = input.required<string>();            // comes from the route :slug
  idx = computed(() => Math.max(0, DEPARTMENTS.findIndex(d => d.slug === this.slug())));
}
