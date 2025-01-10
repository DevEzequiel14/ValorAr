import { InflacionService } from './../../services/inflacion.service';
import { Component, inject } from '@angular/core';
import { IndiceInflacion } from '../../models/indice-inflacion';
import { BaseChartDirective } from 'ng2-charts';
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
  LineElement
} from 'chart.js';
import { NgFor, NgIf } from '@angular/common';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { FormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-inflation',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, BaseChartDirective, LoadingComponent],
  templateUrl: './inflation.component.html',
  styleUrl: './inflation.component.scss',
  animations: [
    trigger('scaleFadeIn', [
      state('void', style({
        transform: 'scale(0.5)', opacity: 0
      })),
      transition(':enter', [
        animate('400ms ease-in-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class InflationComponent {

  inflationService = inject(InflacionService);
  loading = true;
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
        borderColor: this.getCssVariable('--color-accent-primary'),
        backgroundColor: this.getCssVariable('--color-background-secondary'),
        fill: true,
        tension: 0.4
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' }
        }
      },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        ticks: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' }
        },
        title: { display: true, text: 'Meses', color: this.getCssVariable('--color-text-primary') }
      },
      y: {
        ticks: {
          color: this.getCssVariable('--color-text-primary'),
          font: { size: 12, family: 'Arial' }
        },
        title: { display: true, text: 'Índice (%)', color: this.getCssVariable('--color-text-primary') }
      }
    }
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
    this.fetchInflacion();
  }

  populateAvailableYears(): void {
    const years = this.indicesInflacion.map(data => new Date(data.fecha).getFullYear());
    this.availableYears = Array.from(new Set(years)).sort((a, b) => (a - b)).reverse();
    this.selectedYear = Math.max(...this.availableYears)
  }

  filterByYear(): void {
    const filteredData = this.indicesInflacion.filter(
      data => new Date(data.fecha).getFullYear() == this.selectedYear
    );
    const lastMonthWithData = Math.max(...filteredData.map(data => new Date(data.fecha).getMonth()));
    const allLabels = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const labels = allLabels.slice(0, lastMonthWithData + 1);
    const values = new Array(lastMonthWithData + 1).fill(0);
    filteredData.forEach(data => {
      const month = new Date(data.fecha).getMonth();
      values[month] = data.valor;
    });
    this.lineChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: `Índice de Inflación (${this.selectedYear})`,
          borderColor: this.getCssVariable('--color-accent-primary'),
          backgroundColor: this.getCssVariable('--color-background-secondary'),
          fill: true,
          tension: 0.4,
        }
      ]
    };
    this.loading = false;
  }


  fetchInflacion() {
    this.inflationService.getInflacion().subscribe({
      next: (data) => {
        this.indicesInflacion = (data);
        this.loading = false;
        this.populateAvailableYears();
        this.filterByYear();
      },
      error: (err) => {
        window.alert(err);
        this.loading = false;
      }
    });
  }

  populateChartData(indicesInflacion: IndiceInflacion[]): void {
    const labels = indicesInflacion.map(i => i.fecha);
    const values = indicesInflacion.map(i => i.valor);
    this.lineChartData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Índice de Inflación',
          borderColor: this.getCssVariable('--color-accent-primary'),
          backgroundColor: this.getCssVariable('--color-background-secondary'),
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
}
