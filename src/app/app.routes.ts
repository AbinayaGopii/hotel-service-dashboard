import { Routes } from '@angular/router';
import { HomePage } from './pages/home.page';
import { DepartmentPage } from './pages/department.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomePage },
  { path: 'department', pathMatch: 'full', redirectTo: 'department/housekeeping' },
  { path: 'department/:slug', component: DepartmentPage },
  { path: '**', redirectTo: 'home' }
];
