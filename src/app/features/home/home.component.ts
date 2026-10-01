import { animate, style, transition, trigger } from '@angular/animations';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
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
import { RouterModule } from '@angular/router';
import {
  BriefingSource,
  HomeBriefingService,
  HomeBriefingSnapshot,
} from '../../core/services/home-briefing.service';
import { blueOficialSpreadPct, dollarGapVerdict } from '../../shared/readings/dollar-gap';
import { annualizeMonthlyPct, tnaVsIpcVerdict } from '../../shared/readings/tna-vs-ipc';
import {
  formatDatosMeta,
  formatSourceDateTime,
  formatSourceMonthYear,
} from '../../shared/readings/source-freshness';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../shared/components/state-message/state-message.component';

export { blueOficialSpreadPct } from '../../shared/readings/dollar-gap';
export { annualizeMonthlyPct } from '../../shared/readings/tna-vs-ipc';

interface HubLink {
  title: string;
  description: string;
  route: string;
}

/** Lectura cruzada: cierre primero, matiz después. */
export interface StripReading {
  verdict: string;
  detail: string;
}

function formatPct(value: number, digits = 1): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatMoneyArs(value: number): string {
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

function formatTodayIso(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTodayLabel(date = new Date()): string {
  const raw = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CurrencyPipe, DecimalPipe, LoadingComponent, StateMessageComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
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
export class HomeComponent implements OnInit {
  readonly todayIso = formatTodayIso();
  readonly todayLabel = formatTodayLabel();

  readonly hubLinks: HubLink[] = [
    {
      title: 'Dólares',
      description: 'Cotizaciones por casa',
      route: '/dollars',
    },
    {
      title: 'Inflación',
      description: 'Evolución del IPC',
      route: '/inflation',
    },
    {
      title: 'Plazo fijo',
      description: 'TNA por entidad',
      route: '/plazo-fijo',
    },
    {
      title: 'Rendimientos',
      description: 'APY por entidad',
      route: '/performance',
    },
  ];

  readonly loading = signal(true);
  readonly snapshot = signal<HomeBriefingSnapshot | null>(null);
  readonly loadFailed = signal(false);
  readonly retryingSource = signal<BriefingSource | null>(null);

  readonly hasBriefing = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return false;
    }
    return s.blueVenta !== null || s.ipcMensual !== null || s.mejorTna !== null;
  });

  readonly hasPartialFailure = computed(() => {
    const s = this.snapshot();
    if (!s || this.loadFailed()) {
      return false;
    }
    return s.dollarError || s.inflationError || s.plazoError;
  });

  readonly failedSourcesLabel = computed(() => {
    const s = this.snapshot();
    if (!s) {
      return '';
    }
    const names: string[] = [];
    if (s.dollarError) {
      names.push('dólar');
    }
    if (s.inflationError) {
      names.push('inflación');
    }
    if (s.plazoError) {
      names.push('plazo fijo');
    }
    if (names.length === 0) {
      return '';
    }
    if (names.length === 1) {
      return names[0];
    }
    const last = names.pop();
    return `${names.join(', ')} y ${last}`;
  });

  readonly briefingLede = computed(() => {
    const s = this.snapshot();
    if (!s || !this.hasBriefing()) {
      return 'Síntesis del día con blue, inflación y tasas para leer el momento sin saltar entre sitios.';
    }

    const dollar = this.dollarStrip();
    const tna = this.tnaStrip();
    const hasDollarCross = !s.dollarError && s.blueVenta !== null && s.oficialVenta !== null;
    const hasTnaCross = s.mejorTna !== null && s.ipcMensual !== null;

    if (hasDollarCross && hasTnaCross) {
      return `${dollar.verdict} ${tna.verdict}`;
    }
    if (hasDollarCross) {
      return dollar.verdict;
    }
    if (hasTnaCross) {
      return tna.verdict;
    }
    if (s.blueVenta !== null || s.ipcMensual !== null || s.mejorTna !== null) {
      return 'Hay datos parciales del parte: mirá los números de abajo y los cruces cuando completen.';
    }
    return 'Todavía no hay cifras del parte; reintentá en un momento.';
  });

  /**
   * Frescura de fuentes (no la fecha del masthead).
   * Blue trae hora de cotización; IPC es período del índice; TNA no expone timestamp en la API.
   */
  readonly dataFreshness = computed(() => {
    const s = this.snapshot();
    if (!s || !this.hasBriefing()) {
      return null;
    }
    const parts: Array<string | null> = [];
    if (s.blueUpdatedAt) {
      const stamped = formatSourceDateTime(s.blueUpdatedAt);
      parts.push(stamped ? `blue ${stamped}` : null);
    }
    if (s.ipcFecha) {
      const period = formatSourceMonthYear(s.ipcFecha);
      parts.push(period ? `IPC de ${period}` : null);
    }
    return formatDatosMeta(parts);
  });

  readonly blueOficialSpread = computed(() => {
    const s = this.snapshot();
    if (!s || s.blueVenta === null || s.oficialVenta === null) {
      return null;
    }
    return blueOficialSpreadPct(s.blueVenta, s.oficialVenta);
  });

  readonly dollarStrip = computed((): StripReading => {
    const s = this.snapshot();
    if (!s || s.dollarError) {
      return {
        verdict: 'No pudimos cargar cotizaciones.',
        detail: 'Reintentá el blue arriba para cerrar la lectura dólar vs pesos.',
      };
    }
    if (s.blueVenta === null) {
      return {
        verdict: 'Falta el blue para anclar la lectura.',
        detail: 'Cuando cargue, lo cruzamos con el oficial (brecha) y el IPC.',
      };
    }
    if (s.oficialVenta === null) {
      const ipcBit =
        s.ipcMensual !== null
          ? ` Con IPC al ${formatPct(s.ipcMensual)}% este mes, los pesos siguen perdiendo poder de compra.`
          : '';
      return {
        verdict: 'Tenés blue; falta el oficial para medir la brecha.',
        detail: `Blue venta ${formatMoneyArs(s.blueVenta)}.${ipcBit} En cotizaciones vas a ver el oficial y el resto de casas — sin orden de compra.`,
      };
    }

    const spreadPct = blueOficialSpreadPct(s.blueVenta, s.oficialVenta);
    const gapAbs = Math.abs(s.blueVenta - s.oficialVenta);
    const ipcBit =
      s.ipcMensual !== null
        ? ` El IPC al ${formatPct(s.ipcMensual)}% mensual marca cuánto se erosiona el peso.`
        : '';

    return {
      verdict: dollarGapVerdict(spreadPct),
      detail: `Blue ${formatMoneyArs(s.blueVenta)} vs oficial ${formatMoneyArs(s.oficialVenta)} (Δ ${formatMoneyArs(gapAbs)}).${ipcBit} Es una foto educativa del mercado dual, no un tip de compra.`,
    };
  });

  readonly tnaStrip = computed((): StripReading => {
    const s = this.snapshot();
    if (!s || s.mejorTna === null || s.ipcMensual === null) {
      return {
        verdict: 'Falta TNA o IPC para comparar.',
        detail:
          'Cuando carguen ambos, acá anualizamos el IPC para ponerlo en la misma escala que la TNA.',
      };
    }
    const tna = s.mejorTna;
    const ipcAnual = annualizeMonthlyPct(s.ipcMensual);
    const tnaLabel = formatPct(tna);
    const ipcMensualLabel = formatPct(s.ipcMensual);
    const ipcAnualLabel = formatPct(ipcAnual);
    const entidad = s.mejorTnaEntidad ? ` (${s.mejorTnaEntidad})` : '';

    return {
      verdict: tnaVsIpcVerdict(tna, ipcAnual),
      detail: `TNA ${tnaLabel}% anual${entidad} vs IPC ${ipcMensualLabel}% mensual → ~${ipcAnualLabel}% anualizado. Es una foto educativa (TNA nominal, IPC que cambia); no es asesoramiento.`,
    };
  });

  readonly ipcAnualizado = computed(() => {
    const ipc = this.snapshot()?.ipcMensual;
    return ipc === null || ipc === undefined ? null : annualizeMonthlyPct(ipc);
  });

  private readonly briefingService = inject(HomeBriefingService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadBriefing();
  }

  retry(): void {
    this.loadBriefing();
  }

  retrySource(source: BriefingSource): void {
    if (this.retryingSource() !== null) {
      return;
    }
    this.retryingSource.set(source);
    this.briefingService
      .refreshSource(source)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (partial) => {
          this.snapshot.update((current) => (current ? { ...current, ...partial } : current));
          const snap = this.snapshot();
          if (snap) {
            this.loadFailed.set(snap.dollarError && snap.inflationError && snap.plazoError);
          }
          this.retryingSource.set(null);
        },
        error: () => {
          this.retryingSource.set(null);
        },
      });
  }

  private loadBriefing(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.retryingSource.set(null);
    this.briefingService
      .getSnapshot()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (snap) => {
          this.snapshot.set(snap);
          this.loadFailed.set(snap.dollarError && snap.inflationError && snap.plazoError);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }
}
