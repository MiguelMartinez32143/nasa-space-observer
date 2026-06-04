import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DiagnosticsService } from '../services/diagnostics.service';

export const nasaApiInterceptor: HttpInterceptorFn = (req, next) => {
  const diagnosticsService = inject(DiagnosticsService);
  const startTime = Date.now();

  let modifiedReq = req;

  // Append api_key if requesting NASA API
  if (req.url.startsWith(environment.nasaApiUrl)) {
    const params = req.params.set('api_key', environment.nasaApiKey);
    modifiedReq = req.clone({ params });
  }

  return next(modifiedReq).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const elapsed = Date.now() - startTime;
          diagnosticsService.addLog(
            req.method,
            req.url,
            event.status,
            event.statusText,
            elapsed,
            'Success'
          );
        }
      },
      error: (error: HttpErrorResponse) => {
        const elapsed = Date.now() - startTime;
        diagnosticsService.addLog(
          req.method,
          req.url,
          error.status,
          error.statusText || 'Error',
          elapsed,
          error.message || 'API request failed'
        );
      }
    })
  );
};
