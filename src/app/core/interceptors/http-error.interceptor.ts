import { isDevMode } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

function isNetworkOrServerError(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status >= 500;
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isNetworkOrServerError(error)) {
        if (isDevMode()) {
          console.warn(
            '[HTTP]',
            req.method,
            req.urlWithParams,
            `status=${error.status}`,
            error.message
          );
        }
      }

      return throwError(() => error);
    })
  );
};
