import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'dollars',
        loadComponent: () =>
          import('./features/dollars/dollars.component').then((m) => m.DollarsComponent),
      },
      {
        path: 'inflation',
        loadComponent: () =>
          import('./features/inflation/inflation.component').then((m) => m.InflationComponent),
      },
      {
        path: 'plazo-fijo',
        loadComponent: () =>
          import('./features/fixed-term-deposit/fixed-term-deposit.component').then(
            (m) => m.FixedTermDepositComponent
          ),
      },
      {
        path: 'TNA',
        redirectTo: 'plazo-fijo',
        pathMatch: 'full',
      },
      {
        path: 'performance',
        loadComponent: () =>
          import('./features/performance/performance.component').then(
            (m) => m.PerformanceComponent
          ),
      },
    ],
  },
];
