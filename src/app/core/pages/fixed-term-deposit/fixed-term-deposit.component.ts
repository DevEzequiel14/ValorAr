import { NgIf } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FixedTermDepositService } from './../../services/fixed-term-deposit.service';
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FixedTermDeposit } from '../../models/fixed-term-deposit';
import {
  ChartOptions,
  ChartConfiguration,
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
import {
  getAccentPrimaryColor,
  getAccentSecondaryColor,
  getChartBaseOptions,
  getChartPlugins,
  getChartScaleTitle,
  getChartTextColor,
} from '../../../shared/charts/chart-theme';

@Component({
  selector: 'app-fixed-term-deposit',
  standalone: true,
  imports: [NgIf, BaseChartDirective, LoadingComponent, StateMessageComponent],
  templateUrl: './fixed-term-deposit.component.html',
  styleUrl: './fixed-term-deposit.component.scss',
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
export class FixedTermDepositComponent implements OnInit {
  loading = true;
  errorMessage: string | null = null;
  isEmpty = false;

  private readonly fixedTermDepositService = inject(FixedTermDepositService);
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

    this.fixedTermDepositService.getPlazoFijo().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.loading = false;
        if (data.length === 0) {
          this.isEmpty = true;
          this.cdr.markForCheck();
          return;
        }
        this.loadData(data);
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
    const labels = data.map((d) => d.entidad);
    const tnaClientes = data.map((d) => d.tnaClientes);
    const tnaNoClientes = data.map((d) => d.tnaNoClientes);
    this.barChartData = {
      labels,
      datasets: [
        {
          data: tnaClientes,
          label: 'TNA Clientes',
          backgroundColor: getAccentPrimaryColor(),
        },
        {
          data: tnaNoClientes,
          label: 'TNA No Clientes',
          backgroundColor: getAccentSecondaryColor(),
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
}
