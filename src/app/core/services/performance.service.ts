import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../env/environment';
import { Performance } from '../models/performance';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  http = inject(HttpClient)

  getPerformance(): Observable<Performance[]> {
    return this.http.get<Performance[]>(environment.argentinaData + '/finanzas/rendimientos')
  }
}
