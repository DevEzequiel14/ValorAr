import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

let chartJsRegistered = false;

export function registerChartJs(): void {
  if (chartJsRegistered) {
    return;
  }

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
    Title
  );

  chartJsRegistered = true;
}
