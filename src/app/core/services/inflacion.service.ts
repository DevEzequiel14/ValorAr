import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';
import { IndiceInflacion } from '../models/indice-inflacion';

@Injectable({
  providedIn: 'root'
})
export class InflacionService {

  http = inject(HttpClient)

  getInflacion(): Observable<IndiceInflacion[]> {
    return this.http.get<IndiceInflacion[]>(environment.argentinaData + '/finanzas/indices/inflacion')
  }
}
