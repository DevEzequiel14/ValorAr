import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class InflacionService {

  http = inject(HttpClient)

  getInflacion(): Observable<any> {
    return this.http.get<any>(environment.argentinaData + '/finanzas/indices/inflacion')
  }
}
