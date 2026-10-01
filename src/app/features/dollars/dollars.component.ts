import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';
import { BaseChartDirective } from 'ng2-charts';
import { animate, style, transition, trigger } from '@angular/animations';

import { ChartOptions, ChartConfiguration } from 'chart.js';
import { Dollar } from '../../core/models/dollar';
import { DollarService } from '../../core/services/dollar.service';
import {
  getAccentPrimaryColor,
  getAccentSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartTicks,
} from '../../shared/charts/chart-theme';
import { blueOficialSpreadPct, dollarGapVerdict } from '../../shared/readings/dollar-gap';
import { formatDatosMeta, formatSourceDateTime } from '../../shared/readings/source-freshness';

/** Casas cotidianas primero; el resto queda detrás de “Ver todas”. */
export const DOLLARS_VISIBLE_LIMIT = 5;

/** Orden de lectura: blue → oficial → MEP → CCL → tarjeta → resto. */
export function prioritizeDollars(dollars: Dollar[]): Dollar[] {
  return [...dollars].sort((a, b) => dollarPriority(a) - dollarPriority(b));
}

function dollarPriority(d: Dollar): number {
  const key = `${d.casa} ${d.nombre}`.toLowerCase();
  if (d.casa === 'blue' || key.includes('blue')) return 0;
  if (d.casa === 'oficial' || key.includes('oficial')) return 1;
  if (key.includes('bolsa') || key.includes('mep')) return 2;
  if (key.includes('contado') || key.includes('liqui') || key.includes('ccl')) return 3;
  if (key.includes('tarjeta')) return 4;
  if (key.includes('mayorista')) return 5;
  if (key.includes('cripto')) return 6;
  return 10;
}

@Component({
  selector: 'app-dollars',
  standalone: true,
  imports: [BaseChartDirective, LoadingComponent, StateMessageComponent, CurrencyPipe, DecimalPipe],
  templateUrl: './dollars.component.html',
  styleUrl: './dollars.component.scss',
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
export class DollarsComponent implements OnInit {
  readonly visibleLimit = DOLLARS_VISIBLE_LIMIT;
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isEmpty = signal(false);
  readonly dollars = signal<Dollar[]>([]);
  readonly showAllCasas = signal(false);

  readonly blueVenta = computed(() => {
    const blue = this.dollars().find(
      (d) => d.casa === 'blue' || d.nombre.toLowerCase().includes('blue')
    );
    return blue?.venta ?? null;
  });

  readonly oficialVenta = computed(() => {
    const oficial = this.dollars().find(
      (d) => d.casa === 'oficial' || d.nombre.toLowerCase().includes('oficial')
    );
    return oficial?.venta ?? null;
  });

  readonly blueOficialSpread = computed(() => {
    const blue = this.blueVenta();
    const oficial = this.oficialVenta();
    if (blue === null || oficial === null) {
      return null;
    }
    return blueOficialSpreadPct(blue, oficial);
  });

  /** Eco del strip “¿Dólar o pesos?” para no perder el cruce al entrar. */
  readonly gapEcho = computed(() => {
    const spread = this.blueOficialSpread();
    if (spread === null) {
      if (this.blueVenta() !== null && this.oficialVenta() === null) {
        return 'Tenés blue; falta el oficial para medir la brecha.';
      }
      if (this.blueVenta() === null) {
        return 'Cuando cargue el blue, lo cruzamos con el oficial.';
      }
      return null;
    }
    return dollarGapVerdict(spread);
  });

  readonly heroLede = computed(() => {
    const echo = this.gapEcho();
    if (echo) {
      return `${echo} Abajo, compra y venta por casa para profundizar — sin tip de compra.`;
    }
    return 'El dólar blue es la referencia informal cotidiana. El oficial y el resto de casas completan el panorama de compra y venta.';
  });

  readonly canToggleCasas = computed(() => this.dollars().length > this.visibleLimit);

  readonly showingPartial = computed(() => this.canToggleCasas() && !this.showAllCasas());

  readonly chartTitle = computed(() =>
    this.showingPartial() ? 'Principales casas' : 'Todas las casas'
  );

  lastUpdated: string | null = null;

  private readonly dollarService = inject(DollarService);
  private readonly destroyRef = inject(DestroyRef);

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
    this.loading.set(true);
    this.errorMessage.set(null);
    this.isEmpty.set(false);
    this.lastUpdated = null;
    this.showAllCasas.set(false);

    this.dollarService
      .getDollars()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.length === 0) {
            this.loading.set(false);
            this.isEmpty.set(true);
            return;
          }
          const ordered = prioritizeDollars(data);
          this.dollars.set(ordered);
          this.showAllCasas.set(ordered.length <= this.visibleLimit);
          this.applyChartRows();
          this.setLastUpdated(ordered);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(this.resolveErrorMessage(err));
        },
      });
  }

  toggleShowAllCasas(): void {
    this.showAllCasas.update((value) => !value);
    this.applyChartRows();
  }

  private applyChartRows(): void {
    const all = this.dollars();
    const rows = this.showAllCasas() ? all : all.slice(0, this.visibleLimit);
    this.barChartData = {
      labels: rows.map((d) => d.nombre),
      datasets: [
        {
          data: rows.map((d) => d.compra),
          label: 'Compra',
          backgroundColor: getAccentPrimaryColor(),
        },
        {
          data: rows.map((d) => d.venta),
          label: 'Venta',
          backgroundColor: getAccentSecondaryColor(),
        },
      ],
    };
  }

  private setLastUpdated(dollars: Dollar[]): void {
    let latestIso: string | null = null;
    let latestTime = 0;
    for (const dollar of dollars) {
      const time = new Date(dollar.fechaActualizacion).getTime();
      if (!Number.isNaN(time) && time >= latestTime) {
        latestTime = time;
        latestIso = dollar.fechaActualizacion;
      }
    }

    if (!latestIso) {
      this.lastUpdated = null;
      return;
    }

    const stamped = formatSourceDateTime(latestIso);
    this.lastUpdated = formatDatosMeta([stamped ? `cotizaciones ${stamped}` : null]);
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión. Verificá tu internet e intentá de nuevo.';
      }
      return 'No se pudieron cargar las cotizaciones. Intentá de nuevo en unos minutos.';
    }
    return 'Algo salió mal al cargar las cotizaciones. Intentá de nuevo.';
  }
}
