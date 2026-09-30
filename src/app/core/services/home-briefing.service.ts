import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { Dollar } from '../models/dollar';
import { FixedTermDeposit } from '../models/fixed-term-deposit';
import { IndiceInflacion } from '../models/indice-inflacion';
import { DollarService } from './dollar.service';
import { FixedTermDepositService } from './fixed-term-deposit.service';
import { InflacionService } from './inflacion.service';

export type BriefingSource = 'dollar' | 'inflation' | 'plazo';

export interface HomeBriefingSnapshot {
  blueVenta: number | null;
  blueCompra: number | null;
  blueUpdatedAt: string | null;
  oficialVenta: number | null;
  ipcMensual: number | null;
  ipcFecha: string | null;
  mejorTna: number | null;
  mejorTnaEntidad: string | null;
  dollarError: boolean;
  inflationError: boolean;
  plazoError: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HomeBriefingService {
  private readonly dollarService = inject(DollarService);
  private readonly inflacionService = inject(InflacionService);
  private readonly plazoService = inject(FixedTermDepositService);

  getSnapshot(): Observable<HomeBriefingSnapshot> {
    return forkJoin({
      dollars: this.dollarService.getDollars().pipe(catchError(() => of(null))),
      inflation: this.inflacionService.getInflacion().pipe(catchError(() => of(null))),
      plazos: this.plazoService.getPlazoFijo().pipe(catchError(() => of(null))),
    }).pipe(map(({ dollars, inflation, plazos }) => this.toSnapshot(dollars, inflation, plazos)));
  }

  refreshSource(source: BriefingSource): Observable<Partial<HomeBriefingSnapshot>> {
    switch (source) {
      case 'dollar':
        return this.dollarService.getDollars().pipe(
          map((dollars) => this.dollarSlice(dollars)),
          catchError(() => of(this.dollarSlice(null)))
        );
      case 'inflation':
        return this.inflacionService.getInflacion().pipe(
          map((inflation) => this.inflationSlice(inflation)),
          catchError(() => of(this.inflationSlice(null)))
        );
      case 'plazo':
        return this.plazoService.getPlazoFijo().pipe(
          map((plazos) => this.plazoSlice(plazos)),
          catchError(() => of(this.plazoSlice(null)))
        );
    }
  }

  private toSnapshot(
    dollars: Dollar[] | null,
    inflation: IndiceInflacion[] | null,
    plazos: FixedTermDeposit[] | null
  ): HomeBriefingSnapshot {
    return {
      ...this.dollarSlice(dollars),
      ...this.inflationSlice(inflation),
      ...this.plazoSlice(plazos),
    };
  }

  private dollarSlice(dollars: Dollar[] | null): Pick<
    HomeBriefingSnapshot,
    'blueVenta' | 'blueCompra' | 'blueUpdatedAt' | 'oficialVenta' | 'dollarError'
  > {
    const blue = dollars?.find(
      (d) => d.casa === 'blue' || d.nombre.toLowerCase().includes('blue')
    );
    const oficial = dollars?.find(
      (d) => d.casa === 'oficial' || d.nombre.toLowerCase().includes('oficial')
    );
    return {
      blueVenta: blue?.venta ?? null,
      blueCompra: blue?.compra ?? null,
      blueUpdatedAt: blue?.fechaActualizacion ?? null,
      oficialVenta: oficial?.venta ?? null,
      dollarError: dollars === null,
    };
  }

  private inflationSlice(inflation: IndiceInflacion[] | null): Pick<
    HomeBriefingSnapshot,
    'ipcMensual' | 'ipcFecha' | 'inflationError'
  > {
    const latestIpc = inflation?.length
      ? [...inflation].sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1)
      : null;
    return {
      ipcMensual: latestIpc?.valor ?? null,
      ipcFecha: latestIpc?.fecha ?? null,
      inflationError: inflation === null,
    };
  }

  private plazoSlice(plazos: FixedTermDeposit[] | null): Pick<
    HomeBriefingSnapshot,
    'mejorTna' | 'mejorTnaEntidad' | 'plazoError'
  > {
    let mejorTna: number | null = null;
    let mejorTnaEntidad: string | null = null;
    if (plazos?.length) {
      for (const row of plazos) {
        const tna = Math.max(row.tnaClientes ?? 0, row.tnaNoClientes ?? 0);
        if (tna > 0 && (mejorTna === null || tna > mejorTna)) {
          mejorTna = tna;
          mejorTnaEntidad = row.entidad;
        }
      }
    }
    return {
      mejorTna,
      mejorTnaEntidad,
      plazoError: plazos === null,
    };
  }
}
