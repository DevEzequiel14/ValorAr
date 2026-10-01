import { PerformanceService } from '../../core/services/performance.service';
import { FixedTermDepositService } from '../../core/services/fixed-term-deposit.service';
import { InflacionService } from '../../core/services/inflacion.service';
import { DecimalPipe, NgIf } from '@angular/common';
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
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { Performance } from '../../core/models/performance';
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';
import { IndiceInflacion } from '../../core/models/indice-inflacion';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { SelectSearchComponent } from '../../shared/components/select-search/select-search.component';
import {
  getAccentPrimaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartScaleTitle,
  getChartTicks,
} from '../../shared/charts/chart-theme';
import {
  annualizeMonthlyPct,
  apyVsIpcVerdict,
  IPC_ANUALIZADO_GLOSS,
} from '../../shared/readings/tna-vs-ipc';
import {
  APY_NO_TIMESTAMP,
  formatDatosMeta,
  formatSourceMonthYear,
  TNA_NO_TIMESTAMP,
} from '../../shared/readings/source-freshness';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    StateMessageComponent,
    BaseChartDirective,
    SelectSearchComponent,
    FormsModule,
    DecimalPipe,
  ],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss',
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
export class PerformanceComponent implements OnInit {
  private readonly performanceService = inject(PerformanceService);
  private readonly plazoService = inject(FixedTermDepositService);
  private readonly inflacionService = inject(InflacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  rendimientos: Performance[] = [];
  availableCurrencies: string[] = [];
  selectedCurrency: string = '';
  bestApy: number | null = null;
  bestApyEntity: string | null = null;
  bestTna: number | null = null;
  bestTnaEntity: string | null = null;
  ipcAnualizado: number | null = null;
  gapEcho: string | null = null;
  dataFreshness: string | null = null;
  private ipcFecha: string | null = null;
  readonly ipcAnualizadoGloss = IPC_ANUALIZADO_GLOSS;
  heroLede =
    'El APY (rendimiento porcentual anual) más alto de la moneda elegida es una referencia entre entidades. Cambiá la moneda para comparar.';
  showAllEntities = false;
  readonly visibleLimit = 8;
  private sortedRows: { entidad: string; apy: number }[] = [];

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    ...getChartBaseOptions(),
    scales: {
      x: {
        title: getChartScaleTitle('Entidades'),
        ticks: getChartTicks(),
      },
      y: {
        title: getChartScaleTitle('APY (%)'),
        ticks: {
          ...getChartTicks(),
          callback: (value) => `${value}%`,
        },
      },
    },
    plugins: getChartPlugins(),
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  ngOnInit(): void {
    this.fetchRendimientos();
  }

  fetchRendimientos(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;
    this.bestTna = null;
    this.bestTnaEntity = null;
    this.ipcAnualizado = null;
    this.gapEcho = null;
    this.dataFreshness = null;
    this.ipcFecha = null;

    forkJoin({
      performance: this.performanceService.getPerformance(),
      plazos: this.plazoService.getPlazoFijo().pipe(catchError(() => of(null))),
      inflation: this.inflacionService.getInflacion().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ performance, plazos, inflation }) => {
          this.loading = false;
          if (performance.length === 0) {
            this.isEmpty = true;
            this.cdr.markForCheck();
            return;
          }
          this.rendimientos = JSON.parse(JSON.stringify(performance));
          this.initCurrencies();
          if (this.availableCurrencies.length === 0) {
            this.isEmpty = true;
            this.cdr.markForCheck();
            return;
          }
          this.applyParteCross(plazos, inflation);
          this.loadData(this.selectedCurrency || this.availableCurrencies[0]);
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

  initCurrencies(): void {
    const currencies = new Set<string>();
    this.rendimientos.forEach((entidad) =>
      entidad.rendimientos.forEach((r) => {
        if (r.apy) currencies.add(r.moneda);
      })
    );
    this.availableCurrencies = [...Array.from(currencies).sort((a, b) => a.localeCompare(b))];
    const ars = this.availableCurrencies.find((c) => c.toUpperCase() === 'ARS');
    this.selectedCurrency = ars ?? this.availableCurrencies[0];
  }

  loadData(currency: string): void {
    this.sortedRows = this.rendimientos
      .map((r) => {
        const rendimiento = r.rendimientos.find(
          (rend) => rend.moneda.toLowerCase() === currency.toLowerCase()
        );
        return rendimiento?.apy != null ? { entidad: r.entidad, apy: rendimiento.apy } : null;
      })
      .filter((row): row is { entidad: string; apy: number } => row !== null)
      .sort((a, b) => b.apy - a.apy);

    if (this.sortedRows.length === 0) {
      this.bestApy = null;
      this.bestApyEntity = null;
      this.barChartData = { labels: [], datasets: [] };
      this.refreshHeroLede();
      return;
    }

    this.bestApy = this.sortedRows[0].apy;
    this.bestApyEntity = this.sortedRows[0].entidad;
    this.showAllEntities = this.sortedRows.length <= this.visibleLimit;
    this.applyChartRows(currency);
    this.refreshHeroLede();
  }

  get canToggleEntities(): boolean {
    return this.sortedRows.length > this.visibleLimit;
  }

  get showingPartial(): boolean {
    return this.canToggleEntities && !this.showAllEntities;
  }

  /** El cruce TNA/IPC del parte solo aplica a pesos. */
  get showParteCross(): boolean {
    return this.selectedCurrency.toUpperCase() === 'ARS';
  }

  toggleShowAllEntities(): void {
    this.showAllEntities = !this.showAllEntities;
    this.applyChartRows(this.selectedCurrency);
  }

  private applyChartRows(currency: string): void {
    const rows = this.showAllEntities
      ? this.sortedRows
      : this.sortedRows.slice(0, this.visibleLimit);
    this.barChartData = {
      labels: rows.map((r) => r.entidad),
      datasets: [
        {
          data: rows.map((r) => r.apy),
          label: `Rendimientos en ${currency}`,
          backgroundColor: getAccentPrimaryColor(),
        },
      ],
    };
  }

  onCurrencyChange(selectedCurrency: string): void {
    this.selectedCurrency = selectedCurrency;
    this.loadData(selectedCurrency);
    this.cdr.markForCheck();
  }

  private applyParteCross(
    plazos: FixedTermDeposit[] | null,
    inflation: IndiceInflacion[] | null
  ): void {
    if (plazos?.length) {
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
    }

    if (inflation?.length) {
      const latest = [...inflation].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1);
      if (latest) {
        this.ipcFecha = latest.fecha;
        this.ipcAnualizado = annualizeMonthlyPct(latest.valor);
      }
    }
  }

  private refreshDataFreshness(): void {
    const ipcPeriod = this.ipcFecha ? formatSourceMonthYear(this.ipcFecha) : null;
    this.dataFreshness = formatDatosMeta([
      ipcPeriod ? `IPC de ${ipcPeriod}` : null,
      this.bestApy !== null ? APY_NO_TIMESTAMP : null,
      this.bestTna !== null ? TNA_NO_TIMESTAMP : null,
    ]);
  }

  private refreshHeroLede(): void {
    const isArs = this.selectedCurrency.toUpperCase() === 'ARS';

    if (!isArs) {
      this.gapEcho = null;
      this.heroLede = `APY en ${this.selectedCurrency} es una referencia entre entidades. El cruce con TNA e IPC del parte aplica a pesos (ARS).`;
      return;
    }

    if (this.bestApy !== null && this.ipcAnualizado !== null) {
      this.gapEcho = apyVsIpcVerdict(this.bestApy, this.ipcAnualizado);
      this.heroLede = `${this.gapEcho} Abajo, APY por entidad — sin asesoramiento.`;
      return;
    }

    if (this.bestApy !== null && this.bestTna !== null) {
      this.gapEcho =
        'Tenés APY y TNA de referencia; falta el IPC para cerrar la lectura del parte.';
      this.heroLede = `${this.gapEcho} Abajo, APY por entidad.`;
      return;
    }

    this.gapEcho = 'Tenés el APY; falta TNA o IPC del parte para cruzar.';
    this.heroLede = `${this.gapEcho} Cambiá la moneda o reintentá más tarde.`;
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión. Verificá tu internet e intentá de nuevo.';
      }
      return 'No se pudieron cargar los rendimientos. Intentá de nuevo en unos minutos.';
    }
    return 'Algo salió mal al cargar los rendimientos. Intentá de nuevo.';
  }
}
