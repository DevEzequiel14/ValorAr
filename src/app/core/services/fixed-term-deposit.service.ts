import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class FixedTermDepositService {

  http = inject(HttpClient)

  getPlazoFijo(): Observable<any> {
    return this.http.get<any>(environment.argentinaData + '/finanzas/tasas/plazoFijo')
  }
}
