import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dollar } from '../models/dollar';
import { environment } from '../../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class DollarService {

  constructor() { }

  http = inject(HttpClient)

  /**
   * Devuelve un Observable con la lista de cotizaciones de dolares
   * en todas las casas de cambio.
   */
  getDolars(): Observable<Dollar[]> {
    return this.http.get<Dollar[]>(environment.dollar + '/dolares')
  }
}
