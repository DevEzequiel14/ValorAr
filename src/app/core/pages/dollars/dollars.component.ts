import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
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
  imports: [CommonModule, BaseChartDirective, LoadingComponent, StateMessageComponent],
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
  errorMessage: string | null = null;
  isEmpty = false;
  dollars: Dollar[] = [];

  private readonly dollarService = inject(DollarService);
  private readonly destroyRef = inject(DestroyRef);

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

  fetchDolars(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;

    this.dollarService.getDollars().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.length === 0) {
          this.isEmpty = true;
          return;
        }
        this.dollars = data;
        this.updateChart(data);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(err);
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

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión con el servidor. Verificá tu internet e intentá de nuevo.';
      }
      return `No se pudieron cargar las cotizaciones (error ${err.status}).`;
    }
    return 'Ocurrió un error inesperado al cargar las cotizaciones.';
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}
