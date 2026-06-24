import { NgIf } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FixedTermDepositService } from './../../services/fixed-term-deposit.service';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FixedTermDeposit } from '../../models/fixed-term-deposit';
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
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StateMessageComponent } from '../../../shared/components/state-message/state-message.component';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-fixed-term-deposit',
  standalone: true,
  imports: [NgIf, BaseChartDirective, LoadingComponent, StateMessageComponent],
  templateUrl: './fixed-term-deposit.component.html',
  styleUrl: './fixed-term-deposit.component.scss',
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
export class FixedTermDepositComponent {
  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;

  private readonly fixedTermDepositService = inject(FixedTermDepositService);
  private readonly destroyRef = inject(DestroyRef);

  public barChartType = 'bar' as const;
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: true, position: 'top', labels: { color: this.getCssVariable('--color-text-primary') } },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'TNA (%)',
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' },
        },
        ticks: { color: this.getCssVariable('--color-text-primary'), font: { size: 12 } },
      },
      y: {
        title: {
          display: true,
          text: '',
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' },
        },
        ticks: { color: this.getCssVariable('--color-text-primary'), font: { size: 12 } },
      },
    },
  };

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'TNA Clientes',
        backgroundColor: this.getCssVariable('--color-accent-primary'),
      },
      {
        data: [],
        label: 'TNA No Clientes',
        backgroundColor: this.getCssVariable('--color-accent-secondary'),
      },
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
    this.fetchFixedTermDeposit();
  }

  fetchFixedTermDeposit(): void {
    this.loading = true;
    this.errorMessage = null;
    this.isEmpty = false;

    this.fixedTermDepositService.getPlazoFijo().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.length === 0) {
          this.isEmpty = true;
          return;
        }
        this.loadData(data);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.resolveErrorMessage(err);
      },
    });
  }

  loadData(data: FixedTermDeposit[]): void {
    const labels = data.map((d) => d.entidad);
    const tnaClientes = data.map((d) => d.tnaClientes);
    const tnaNoClientes = data.map((d) => d.tnaNoClientes);
    this.barChartData = {
      labels,
      datasets: [
        {
          data: tnaClientes,
          label: 'TNA Clientes',
          backgroundColor: this.getCssVariable('--color-accent-primary'),
        },
        {
          data: tnaNoClientes,
          label: 'TNA No Clientes',
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
      return `No se pudieron cargar las tasas de plazo fijo (error ${err.status}).`;
    }
    return 'Ocurrió un error inesperado al cargar el plazo fijo.';
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}
