import { InflacionService } from '../../core/services/inflacion.service';
import { FixedTermDepositService } from '../../core/services/fixed-term-deposit.service';
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
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { DecimalPipe, NgIf } from '@angular/common';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { SelectSearchComponent } from '../../shared/components/select-search/select-search.component';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  getAccentPrimaryColor,
  getBackgroundSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartScaleTitle,
  getChartTicks,
} from '../../shared/charts/chart-theme';
import {
  annualizeMonthlyPct,
  IPC_ANUALIZADO_GLOSS,
  tnaVsIpcVerdict,
} from '../../shared/readings/tna-vs-ipc';
import {
  formatDatosMeta,
  formatSourceMonthYear,
  TNA_NO_TIMESTAMP,
} from '../../shared/readings/source-freshness';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-inflation',
  standalone: true,
  imports: [
    NgIf,
    BaseChartDirective,
    LoadingComponent,
    StateMessageComponent,
    SelectSearchComponent,
    DecimalPipe,
  ],
  templateUrl: './inflation.component.html',
  styleUrl: './inflation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('320ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class InflationComponent implements OnInit {
  private readonly inflationService = inject(InflacionService);
  private readonly plazoService = inject(FixedTermDepositService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  indicesInflacion: IndiceInflacion[] = [];
  selectedYear = String(new Date().getFullYear());
  availableYears: string[] = [];
  latestIpcForYear: number | null = null;
  latestIpcLabel: string | null = null;
  parteIpcAnualizado: number | null = null;
  parteIpcPeriod: string | null = null;
  bestTna: number | null = null;
  bestTnaEntity: string | null = null;
  gapEcho: string | null = null;
  dataFreshness: string | null = null;
  readonly ipcAnualizadoGloss = IPC_ANUALIZADO_GLOSS;
  heroLede =
    'El gráfico sigue el año elegido. El cruce TNA vs IPC anualizado es siempre del parte (último índice) — sin asesoramiento.';

  private readonly monthFormatter = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  });

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
    this.availableYears = Array.from(new Set(years))
      .sort((a, b) => b - a)
      .map(String);
    this.selectedYear = this.availableYears[0] ?? this.selectedYear;
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.filterByYear();
    this.refreshDataFreshness();
    this.cdr.markForCheck();
  }

  filterByYear(): void {
    const year = Number(this.selectedYear);
    const filteredData = this.indicesInflacion.filter(
      (data) => new Date(data.fecha).getFullYear() === year
    );
    this.updateYearHero(filteredData);

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
    this.parteIpcAnualizado = null;
    this.parteIpcPeriod = null;
    this.bestTna = null;
    this.bestTnaEntity = null;
    this.gapEcho = null;
    this.dataFreshness = null;

    forkJoin({
      inflation: this.inflationService.getInflacion(),
      plazos: this.plazoService.getPlazoFijo().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ inflation, plazos }) => {
          this.loading = false;
          if (inflation.length === 0) {
            this.isEmpty = true;
            this.cdr.markForCheck();
            return;
          }
          this.indicesInflacion = [...inflation];
          this.populateAvailableYears();
          this.filterByYear();
          this.applyTnaCross(plazos);
          this.refreshDataFreshness();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = this.resolveErrorMessage(err);
          this.cdr.markForCheck();
        },
      });
  }

  private updateYearHero(filteredData: IndiceInflacion[]): void {
    if (filteredData.length === 0) {
      this.latestIpcForYear = null;
      this.latestIpcLabel = null;
      return;
    }
    const latest = [...filteredData].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1)!;
    this.latestIpcForYear = latest.valor;
    const label = this.monthFormatter.format(new Date(latest.fecha));
    this.latestIpcLabel = label.charAt(0).toUpperCase() + label.slice(1);
  }

  private applyTnaCross(plazos: FixedTermDeposit[] | null): void {
    const latestOverall = [...this.indicesInflacion]
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .at(-1);
    if (!latestOverall) {
      return;
    }

    this.parteIpcAnualizado = annualizeMonthlyPct(latestOverall.valor);
    this.parteIpcPeriod = formatSourceMonthYear(latestOverall.fecha);

    if (!plazos?.length) {
      this.bestTna = null;
      this.bestTnaEntity = null;
      this.gapEcho = 'Tenés el IPC; falta la TNA de plazo fijo para comparar.';
      this.heroLede = `${this.gapEcho} El gráfico es del año elegido; el cruce usa el último IPC del parte.`;
      return;
    }

    let mejorTna: number | null = null;
    let mejorEntidad: string | null = null;
    for (const row of plazos) {
      const tna = Math.max(row.tnaClientes ?? 0, row.tnaNoClientes ?? 0);
      if (tna > 0 && (mejorTna === null || tna > mejorTna)) {
        mejorTna = tna;
        mejorEntidad = row.entidad;
      }
    }

    this.bestTna = mejorTna;
    this.bestTnaEntity = mejorEntidad;

    if (mejorTna === null) {
      this.gapEcho = 'Tenés el IPC; falta la TNA de plazo fijo para comparar.';
      this.heroLede = `${this.gapEcho} El gráfico es del año elegido; el cruce usa el último IPC del parte.`;
      return;
    }

    this.gapEcho = tnaVsIpcVerdict(mejorTna, this.parteIpcAnualizado);
    this.heroLede = `${this.gapEcho} El gráfico es del año elegido; el cruce TNA vs IPC es del parte — sin asesoramiento.`;
  }

  private refreshDataFreshness(): void {
    const parts: Array<string | null> = [];
    if (this.latestIpcLabel) {
      parts.push(`IPC de ${this.latestIpcLabel}`);
    } else {
      const latestOverall = [...this.indicesInflacion]
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .at(-1);
      if (latestOverall) {
        const period = formatSourceMonthYear(latestOverall.fecha);
        parts.push(period ? `IPC de ${period}` : null);
      }
    }
    if (this.bestTna !== null) {
      parts.push(TNA_NO_TIMESTAMP);
    }
    this.dataFreshness = formatDatosMeta(parts);
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión. Verificá tu internet e intentá de nuevo.';
      }
      return 'No se pudieron cargar los datos de inflación. Intentá de nuevo en unos minutos.';
    }
    return 'Algo salió mal al cargar la inflación. Intentá de nuevo.';
  }
}
