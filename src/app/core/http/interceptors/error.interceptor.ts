import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiErrorTracker } from '../services/api-error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ApiErrorTracker);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      errorService.setError({
        status: error.status,
        message: error.error?.message ?? error.message,
        code: error.error?.code,
      });
      return throwError(() => error);
    }),
  );
};
