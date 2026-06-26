import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';
import { FixedTermDeposit } from '../models/fixed-term-deposit';

@Injectable({
  providedIn: 'root',
})
export class FixedTermDepositService {
  private readonly http = inject(HttpClient);

  getPlazoFijo(): Observable<FixedTermDeposit[]> {
    return this.http.get<FixedTermDeposit[]>(
      environment.argentinaData + '/finanzas/tasas/plazoFijo'
    );
  }
}
