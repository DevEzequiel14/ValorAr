import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
import { BaseChartDirective } from 'ng2-charts';
import { CommonModule } from '@angular/common';
import { animate, state, style, transition, trigger } from '@angular/animations';

import {
  ChartOptions,
  ChartConfiguration,
} from 'chart.js';
import { Dollar } from '../../models/dollar';
import { DollarService } from '../../services/dollar.service';
import {
  getAccentPrimaryColor,
  getAccentSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartTicks,
} from '../../../shared/charts/chart-theme';

@Component({
  selector: 'app-dollars',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, LoadingComponent, StateMessageComponent],
  templateUrl: './dollars.component.html',
  styleUrl: './dollars.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class DollarsComponent implements OnInit {
  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  dollars: Dollar[] = [];
  lastUpdated: string | null = null;

  private readonly dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  private readonly dollarService = inject(DollarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    ...getChartBaseOptions(),
    scales: {
      x: { ticks: getChartTicks() },
      y: { ticks: getChartTicks() },
    },
    plugins: getChartPlugins(),
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Compra',
        backgroundColor: getAccentPrimaryColor(),
      },
      { data: [], label: 'Venta', backgroundColor: getAccentSecondaryColor() },
    ],
  };

  ngOnInit(): void {
    this.fetchDolars();
  }

  fetchDolars(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;
    this.lastUpdated = null;

    this.dollarService.getDollars().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.length === 0) {
          this.isEmpty = true;
          this.cdr.markForCheck();
          return;
        }
        this.dollars = [...data];
        this.updateChart(data);
        this.setLastUpdated(data);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(err);
        this.cdr.markForCheck();
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
          backgroundColor: getAccentPrimaryColor(),
        },
        {
          data: ventaData,
          label: 'Venta',
          backgroundColor: getAccentSecondaryColor(),
        },
      ],
    };
  }

  private setLastUpdated(dollars: Dollar[]): void {
    const latestTimestamp = dollars.reduce((max, dollar) => {
      const time = new Date(dollar.fechaActualizacion).getTime();
      return Number.isNaN(time) ? max : Math.max(max, time);
    }, 0);

    if (latestTimestamp === 0) {
      this.lastUpdated = null;
      return;
    }

    this.lastUpdated = `Actualizado: ${this.dateTimeFormatter.format(new Date(latestTimestamp))}`;
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
}
