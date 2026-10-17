import { Component } from '@angular/core';
import { DashboardComponent } from '../shared/dashboard.component';

/** Home = the 6 sections for ALL departments (broken down by department) */
@Component({ standalone: true, imports: [DashboardComponent], template: '<app-dashboard [dept]="null" />' })
export class HomePage {}
