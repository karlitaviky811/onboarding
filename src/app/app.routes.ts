import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { MainLayout } from './layouts/main-layout/main-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'request', pathMatch: 'full' },
  {
    path: 'request',
    component: AuthLayout,
    loadChildren: () =>
      import('./features/credit-application/infrastructure/ui/credit-application.routes').then(m => m.creditApplicationRoutes),
  },
  {
    path: 'onboarding',
    component: MainLayout,
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then(m => m.onboardingRoutes),
  },
  { path: '**', redirectTo: 'request' },
];
