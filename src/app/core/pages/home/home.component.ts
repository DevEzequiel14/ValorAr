import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { DollarService } from '../../services/dollar.service';

interface HubCard {
  iconSrc: string;
  iconAlt: string;
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
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
export class HomeComponent implements OnInit {
  readonly hubCards: HubCard[] = [
    {
      iconSrc: '/assets/icons/currency-dollar.svg',
      iconAlt: 'Ícono de dólar',
      title: 'Dólares',
      description: 'Cotizaciones de compra y venta en todas las casas de cambio.',
      route: '/dollars',
    },
    {
      iconSrc: '/assets/icons/chart-bar.svg',
      iconAlt: 'Ícono de gráfico de barras',
      title: 'Inflación',
      description: 'Evolución mensual del índice de precios al consumidor.',
      route: '/inflation',
    },
    {
      iconSrc: '/assets/icons/building-library.svg',
      iconAlt: 'Ícono de banco',
      title: 'Plazo fijo',
      description: 'Tasas nominales anuales por entidad financiera.',
      route: '/plazo-fijo',
    },
    {
      iconSrc: '/assets/icons/banknotes.svg',
      iconAlt: 'Ícono de billetes',
      title: 'Rendimientos',
      description: 'Rendimientos APY por entidad y moneda.',
      route: '/performance',
    },
  ];

  bluePreview: string | null = null;

  private readonly dollarService = inject(DollarService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadBluePreview();
  }

  private loadBluePreview(): void {
    this.dollarService.getDollars().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        const blue = data.find(
          (d) => d.casa === 'blue' || d.nombre.toLowerCase() === 'blue'
        );
        if (!blue) {
          return;
        }
        this.bluePreview = `Blue: $${blue.venta.toLocaleString('es-AR')}`;
      },
      error: () => {
        // La card se muestra sin preview si falla el fetch
      },
    });
  }
}
