import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should propagate successful responses unchanged', () => {
    http.get<{ ok: boolean }>('/api/test').subscribe((data) => {
      expect(data).toEqual({ ok: true });
    });

    httpMock.expectOne('/api/test').flush({ ok: true });
  });

  it('should propagate 5xx errors to subscribers', () => {
    http.get('/api/test').subscribe({
      next: () => fail('expected an error'),
      error: (error) => {
        expect(error.status).toBe(503);
      },
    });

    httpMock.expectOne('/api/test').flush('Service Unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  });

  it('should propagate network errors (status 0) to subscribers', () => {
    http.get('/api/test').subscribe({
      next: () => fail('expected an error'),
      error: (error) => {
        expect(error.status).toBe(0);
      },
    });

    httpMock
      .expectOne('/api/test')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('should propagate 4xx errors without altering them', () => {
    http.get('/api/test').subscribe({
      next: () => fail('expected an error'),
      error: (error) => {
        expect(error.status).toBe(404);
      },
    });

    httpMock.expectOne('/api/test').flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
