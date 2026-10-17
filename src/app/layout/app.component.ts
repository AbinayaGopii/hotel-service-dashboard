import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FilterBarComponent } from './filter-bar.component';
import { DEPARTMENTS } from '../core/mock-data';

@Component({
  selector: 'app-root', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FilterBarComponent],
  templateUrl: './app.component.html'
})
export class AppComponent { depts = DEPARTMENTS; }
