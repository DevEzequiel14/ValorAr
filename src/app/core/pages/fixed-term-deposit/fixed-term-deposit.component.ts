import { NgIf } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FixedTermDepositService } from './../../services/fixed-term-deposit.service';
import { Component, inject } from '@angular/core';
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
  imports: [NgIf, BaseChartDirective, LoadingComponent],
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
  fixedTermDepositService = inject(FixedTermDepositService);

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

  fetchFixedTermDeposit() {
    this.fixedTermDepositService.getPlazoFijo().subscribe({
      next: (data) => {
        this.loadData(data);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
      },
    });
  }

  loadData(
    data: {
      entidad: string;
      logo: string;
      tnaClientes: number;
      tnaNoClientes: number;
    }[]
  ): void {
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
    this.loading = false;
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}
