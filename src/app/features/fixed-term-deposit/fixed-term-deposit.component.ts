import { DecimalPipe, NgIf } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FixedTermDepositService } from '../../core/services/fixed-term-deposit.service';
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
import { FixedTermDeposit } from '../../core/models/fixed-term-deposit';
import { IndiceInflacion } from '../../core/models/indice-inflacion';
import { ChartOptions, ChartConfiguration } from 'chart.js';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { animate, style, transition, trigger } from '@angular/animations';
import {
  getAccentPrimaryColor,
  getAccentSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartScaleTitle,
  getChartTextColor,
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
  selector: 'app-fixed-term-deposit',
  standalone: true,
  imports: [NgIf, BaseChartDirective, LoadingComponent, StateMessageComponent, DecimalPipe],
  templateUrl: './fixed-term-deposit.component.html',
  styleUrl: './fixed-term-deposit.component.scss',
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
export class FixedTermDepositComponent implements OnInit {
  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  bestTna: number | null = null;
  bestTnaEntity: string | null = null;
  ipcMensual: number | null = null;
  ipcAnualizado: number | null = null;
  gapEcho: string | null = null;
  dataFreshness: string | null = null;
  private ipcFecha: string | null = null;
  readonly ipcAnualizadoGloss = IPC_ANUALIZADO_GLOSS;
  heroLede =
    'La TNA tope de la muestra (nominal anual) es una referencia entre entidades, no la tasa de tu banco. El gráfico ordena de mayor a menor.';
  showAllEntities = false;
  readonly visibleLimit = 8;
  private sortedRows: FixedTermDeposit[] = [];

  private readonly fixedTermDepositService = inject(FixedTermDepositService);
  private readonly inflacionService = inject(InflacionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    ...getChartBaseOptions(),
    indexAxis: 'y',
    plugins: getChartPlugins(),
    scales: {
      x: {
        title: getChartScaleTitle('TNA (%)'),
        ticks: {
          color: getChartTextColor(),
          font: { size: 12 },
        },
      },
      y: {
        title: getChartScaleTitle(''),
        ticks: {
          color: getChartTextColor(),
          font: { size: 12 },
        },
      },
    },
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'TNA Clientes',
        backgroundColor: getAccentPrimaryColor(),
      },
      {
        data: [],
        label: 'TNA No Clientes',
        backgroundColor: getAccentSecondaryColor(),
      },
    ],
  };

  ngOnInit(): void {
    this.fetchFixedTermDeposit();
  }

  fetchFixedTermDeposit(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;
    this.ipcMensual = null;
    this.ipcAnualizado = null;
    this.gapEcho = null;
    this.dataFreshness = null;
    this.ipcFecha = null;

    forkJoin({
      plazos: this.fixedTermDepositService.getPlazoFijo(),
      inflation: this.inflacionService.getInflacion().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ plazos, inflation }) => {
          this.loading = false;
          if (plazos.length === 0) {
            this.isEmpty = true;
            this.cdr.markForCheck();
            return;
          }
          this.loadData(plazos);
          this.applyIpcCross(inflation);
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

  loadData(data: FixedTermDeposit[]): void {
    this.sortedRows = [...data].sort((a, b) => {
      const aMax = Math.max(a.tnaClientes ?? 0, a.tnaNoClientes ?? 0);
      const bMax = Math.max(b.tnaClientes ?? 0, b.tnaNoClientes ?? 0);
      return bMax - aMax;
    });

    const top = this.sortedRows[0];
    this.bestTna = Math.max(top.tnaClientes ?? 0, top.tnaNoClientes ?? 0);
    this.bestTnaEntity = top.entidad;
    this.showAllEntities = this.sortedRows.length <= this.visibleLimit;
    this.applyChartRows();
  }

  get canToggleEntities(): boolean {
    return this.sortedRows.length > this.visibleLimit;
  }

  get showingPartial(): boolean {
    return this.canToggleEntities && !this.showAllEntities;
  }

  toggleShowAllEntities(): void {
    this.showAllEntities = !this.showAllEntities;
    this.applyChartRows();
  }

  private applyIpcCross(inflation: IndiceInflacion[] | null): void {
    if (!inflation?.length || this.bestTna === null) {
      this.gapEcho =
        this.bestTna !== null
          ? 'Tenés la TNA tope de la muestra; falta el IPC para compararla con la inflación.'
          : null;
      this.heroLede = this.gapEcho
        ? `${this.gapEcho} Abajo, TNA por entidad para profundizar — sin asesoramiento.`
        : 'La TNA tope de la muestra (nominal anual) es una referencia entre entidades, no la tasa de tu banco. El gráfico ordena de mayor a menor.';
      return;
    }

    const latest = [...inflation].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1);
    if (!latest) {
      return;
    }

    this.ipcFecha = latest.fecha;
    this.ipcMensual = latest.valor;
    this.ipcAnualizado = annualizeMonthlyPct(latest.valor);
    this.gapEcho = tnaVsIpcVerdict(this.bestTna, this.ipcAnualizado);
    this.heroLede = `${this.gapEcho} Abajo, TNA por entidad para profundizar — sin asesoramiento.`;
  }

  private refreshDataFreshness(): void {
    const ipcPeriod = this.ipcFecha ? formatSourceMonthYear(this.ipcFecha) : null;
    this.dataFreshness = formatDatosMeta([
      ipcPeriod ? `IPC de ${ipcPeriod}` : null,
      this.bestTna !== null ? TNA_NO_TIMESTAMP : null,
    ]);
  }

  private applyChartRows(): void {
    const rows = this.showAllEntities
      ? this.sortedRows
      : this.sortedRows.slice(0, this.visibleLimit);
    this.barChartData = {
      labels: rows.map((d) => d.entidad),
      datasets: [
        {
          data: rows.map((d) => d.tnaClientes),
          label: 'TNA Clientes',
          backgroundColor: getAccentPrimaryColor(),
        },
        {
          data: rows.map((d) => d.tnaNoClientes),
          label: 'TNA No Clientes',
          backgroundColor: getAccentSecondaryColor(),
        },
      ],
    };
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión. Verificá tu internet e intentá de nuevo.';
      }
      return 'No se pudieron cargar las tasas de plazo fijo. Intentá de nuevo en unos minutos.';
    }
    return 'Algo salió mal al cargar el plazo fijo. Intentá de nuevo.';
  }
}
