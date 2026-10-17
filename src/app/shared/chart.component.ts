import { Component, ElementRef, ViewChild, OnDestroy, effect, input } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-chart', standalone: true,
  template: '<canvas #cv></canvas>',
  styles: [':host{display:block;position:relative;height:220px;margin:8px 0}']
})
export class ChartComponent implements OnDestroy {
  type = input.required<any>();
  labels = input<string[]>([]);
  datasets = input<any[]>([]);
  options = input<any>({});
  @ViewChild('cv', { static: true }) cv!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  constructor() {
    effect(() => {
      const type = this.type(), datasets = this.datasets(), dough = type === 'doughnut' || type === 'pie';
      this.chart?.destroy();
      this.chart = new Chart(this.cv.nativeElement, {
        type, data: { labels: this.labels(), datasets },
        options: { responsive: true, maintainAspectRatio: false, cutout: type === 'doughnut' ? '62%' : undefined,
          plugins: { legend: { display: dough || datasets.length > 1, position: dough ? 'right' : 'bottom', labels: { boxWidth: 10 } } }, ...this.options() }
      });
    });
  }
  ngOnDestroy() { this.chart?.destroy(); }
}
