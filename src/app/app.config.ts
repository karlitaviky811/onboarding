import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig, withPreloading, NoPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/interceptors/auth.interceptor';
import { errorInterceptor } from './core/http/interceptors/error.interceptor';
import { loadingInterceptor } from './core/http/interceptors/loading.interceptor';
import { mockInterceptor } from './core/http/interceptors/mock.interceptor';
import { provideCore } from './core/core';
import { API_BASE_URL } from './core/config/api.config';
import { environment } from '../environments/environment';
import { AdminConfigAdapter } from './features/credit-application/infrastructure/adapters/admin/admin-config.adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimations(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withPreloading(NoPreloading),
    ),
    provideHttpClient(
      withInterceptors([mockInterceptor, authInterceptor, errorInterceptor, loadingInterceptor]),
    ),
    provideCore(),
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    // Preloads the identity provider name from the backend before any DI factory
    // resolves. Registered at the ROOT level (not in the lazy feature route) so
    // the cache is warm before bootstrap completes, regardless of route activation.
    provideAppInitializer(() => inject(AdminConfigAdapter).preload()),
  ],
};
