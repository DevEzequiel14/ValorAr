import { Component, inject } from '@angular/core';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartConfiguration,
  LineController,
  PointElement,
  Title,
  LineElement,
} from 'chart.js';
import { Dollar } from '../../models/dollar';
import { DollarService } from '../../services/dollar.service';

@Component({
  selector: 'app-dollars',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, LoadingComponent],
  templateUrl: './dollars.component.html',
  styleUrl: './dollars.component.scss',
  animations: [
    trigger('scaleFadeIn', [
      state(
        'void',
        style({
          transform: 'scale(0.5)',
          opacity: 0,
        })
      ),
      transition(':enter', [
        animate(
          '400ms ease-in-out',
          style({ transform: 'scale(1)', opacity: 1 })
        ),
      ]),
    ]),
  ],
})
export class DollarsComponent {
  loading = true;
  dollars: Dollar[] = [];
  dollarService = inject(DollarService);

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' },
        },
      },
      y: {
        ticks: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: this.getCssVariable('--color-text-primary') },
      },
      tooltip: { enabled: true },
    },
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Compra',
        backgroundColor: this.getCssVariable('--color-accent-primary'),
      },
      { data: [], label: 'Venta', backgroundColor: this.getCssVariable('--color-accent-secondary') },
    ],
  };

  ngOnInit(): void {
    Chart.register(
      BarController,
      BarElement,
      CategoryScale,
      LinearScale,
      Tooltip,
      Legend,
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      Title,
      Tooltip,
      CategoryScale
    );
    this.fetchDolars();
  }

  fetchDolars() {
    this.dollarService.getDolars().subscribe({
      next: (data) => {
        this.dollars = data;
        this.updateChart(data);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        window.alert(err);
      },
    });
  }

  updateChart(dollars: Dollar[]): void {
    const labels = dollars.map((d) => d.nombre);
    const compraData = dollars.map((d) => d.compra);
    const ventaData = dollars.map((d) => d.venta);
    this.barChartData = {
      labels,
      datasets: [
        {
          data: compraData,
          label: 'Compra',
          backgroundColor: this.getCssVariable('--color-accent-primary'),
        },
        {
          data: ventaData,
          label: 'Venta',
          backgroundColor: this.getCssVariable('--color-accent-secondary'),
        },
      ],
    };
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }

}
