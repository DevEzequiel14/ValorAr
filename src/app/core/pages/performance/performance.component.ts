import { PerformanceService } from './../../services/performance.service';
import { NgIf } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineController,
  PointElement,
  Title,
  LineElement,
  ChartOptions,
  ChartConfiguration,
} from 'chart.js';
import { Performance } from '../../models/performance';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { SelectSearchComponent } from '../../../shared/components/select-search/select-search.component';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    StateMessageComponent,
    BaseChartDirective,
    SelectSearchComponent,
    FormsModule],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.scss',
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
export class PerformanceComponent {
  private readonly performanceService = inject(PerformanceService);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;
  rendimientos: Performance[] = [];
  availableCurrencies: string[] = [];
  selectedCurrency: string = '';

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Entidades',
          font: { size: 12, family: 'Arial' },
          color: this.getCssVariable('--color-text-primary'),
        },
        ticks: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' },
        },
      },
      y: {
        title: {
          display: true,
          text: 'APY (%)',
          font: { size: 12, family: 'Arial' },
          color: this.getCssVariable('--color-text-primary'),
        },
        ticks: {
          callback: (value) => `${value}%`,
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
    datasets: [],
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
    this.fetchRendimientos();
  }


  fetchRendimientos(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;

    this.performanceService.getPerformance().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.length === 0) {
          this.isEmpty = true;
          return;
        }
        this.rendimientos = JSON.parse(JSON.stringify(data));
        this.initCurrencies();
        if (this.availableCurrencies.length === 0) {
          this.isEmpty = true;
          return;
        }
        this.loadData(this.selectedCurrency || this.availableCurrencies[0]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(err);
      },
    });
  }

  initCurrencies(): void {
    const currencies = new Set<string>();
    this.rendimientos.forEach((entidad) =>
      entidad.rendimientos.forEach((r) => {
        if (r.apy) currencies.add(r.moneda)
      })
    );
    this.availableCurrencies = Array.from(currencies).sort((a, b) => a.localeCompare(b));
    this.selectedCurrency = this.availableCurrencies[0];
  }

  loadData(currency: string): void {
    const labels = this.rendimientos.map((r) => r.entidad);
    const apyData = this.rendimientos.map((r) => {
      const rendimiento = r.rendimientos.find(
        (rend) => rend.moneda.toLowerCase() === currency.toLowerCase()
      );
      return rendimiento ? rendimiento.apy : null;
    });

    const validLabels: string[] = [];
    const validData: number[] = [];
    labels.forEach((label, index) => {
      if (apyData[index] !== null) {
        validLabels.push(label);
        validData.push(apyData[index] || 0);
      }
    });
    this.barChartData = {
      labels: validLabels,
      datasets: [
        {
          data: validData,
          label: `Rendimientos en ${currency}`,
          backgroundColor: this.getCssVariable('--color-accent-primary'),
        },
      ],
    };
  }

  onCurrencyChange(selectedCurrency: string): void {
    this.selectedCurrency = selectedCurrency;
    this.loadData(selectedCurrency);
  }

  private resolveErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'No hay conexión con el servidor. Verificá tu internet e intentá de nuevo.';
      }
      return `No se pudieron cargar los rendimientos (error ${err.status}).`;
    }
    return 'Ocurrió un error inesperado al cargar los rendimientos.';
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
  }
}
