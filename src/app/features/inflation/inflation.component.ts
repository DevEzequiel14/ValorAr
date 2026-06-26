import { InflacionService } from '../../core/services/inflacion.service';
import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { IndiceInflacion } from '../../core/models/indice-inflacion';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { NgFor, NgIf } from '@angular/common';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { FormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import {
  getAccentPrimaryColor,
  getBackgroundSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartScaleTitle,
  getChartTicks,
} from '../../shared/charts/chart-theme';

@Component({
  selector: 'app-inflation',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, BaseChartDirective, LoadingComponent, StateMessageComponent],
  templateUrl: './inflation.component.html',
  styleUrl: './inflation.component.scss',
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
        animate('400ms ease-in-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class InflationComponent implements OnInit {
  private readonly inflationService = inject(InflacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  indicesInflacion: IndiceInflacion[] = [];
  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];

  public lineChartType = 'line' as const;
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Índice de Inflación',
        borderColor: getAccentPrimaryColor(),
        backgroundColor: getBackgroundSecondaryColor(),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    ...getChartBaseOptions(),
    plugins: getChartPlugins(),
    scales: {
      x: {
        ticks: getChartTicks(),
        title: getChartScaleTitle('Meses'),
      },
      y: {
        ticks: getChartTicks(),
        title: getChartScaleTitle('Índice (%)'),
      },
    },
  };

  ngOnInit(): void {
    this.fetchInflacion();
  }

  populateAvailableYears(): void {
    const years = this.indicesInflacion.map((data) => new Date(data.fecha).getFullYear());
    this.availableYears = [
      ...Array.from(new Set(years))
        .sort((a, b) => a - b)
        .reverse(),
    ];
    this.selectedYear = Math.max(...this.availableYears);
  }

  filterByYear(): void {
    const filteredData = this.indicesInflacion.filter(
      (data) => new Date(data.fecha).getFullYear() == this.selectedYear
    );
    const lastMonthWithData = Math.max(
      ...filteredData.map((data) => new Date(data.fecha).getMonth())
    );
    const allLabels = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const labels = allLabels.slice(0, lastMonthWithData + 1);
    const values = new Array(lastMonthWithData + 1).fill(0);
    filteredData.forEach((data) => {
      const month = new Date(data.fecha).getMonth();
      values[month] = data.valor;
    });
    this.lineChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: `Índice de Inflación (${this.selectedYear})`,
          borderColor: getAccentPrimaryColor(),
          backgroundColor: getBackgroundSecondaryColor(),
          fill: true,
          tension: 0.4,
        },
      ],
    };
    this.loading = false;
  }

  fetchInflacion(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;

    this.inflationService
      .getInflacion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.loading = false;
          if (data.length === 0) {
            this.isEmpty = true;
            this.cdr.markForCheck();
            return;
          }
          this.indicesInflacion = [...data];
          this.populateAvailableYears();
          this.filterByYear();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = this.resolveErrorMessage(err);
          this.cdr.markForCheck();
        },
      });
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión con el servidor. Verificá tu internet e intentá de nuevo.';
      }
      return `No se pudieron cargar los datos de inflación (error ${err.status}).`;
    }
    return 'Ocurrió un error inesperado al cargar la inflación.';
  }
}
