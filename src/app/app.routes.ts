import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/pages/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./core/pages/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'dollars',
        loadComponent: () => import('./core/pages/dollars/dollars.component').then((m) => m.DollarsComponent)
      },
      {
        path: 'inflation',
        loadComponent: () => import('./core/pages/inflation/inflation.component').then((m) => m.InflationComponent)
      },
      {
        path: 'TNA',
        loadComponent: () => import('./core/pages/fixed-term-deposit/fixed-term-deposit.component').then((m) => m.FixedTermDepositComponent)
      },
      {
        path: 'performance',
        loadComponent: () => import('./core/pages/performance/performance.component').then((m) => m.PerformanceComponent)
      }
    ]
  }
];
