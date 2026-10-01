import { Routes } from '@angular/router';
import { onboardingCompleteGuard } from './guards/onboarding-complete.guard';

export const onboardingRoutes: Routes = [
  {
    path: '',
    canActivate: [onboardingCompleteGuard],
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      // Screens will be added here from Figma designs:
      // { path: 'welcome', loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage) },
      // { path: 'profile', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
      // { path: 'preferences', loadComponent: () => import('./pages/preferences/preferences.page').then(m => m.PreferencesPage) },
    ],
  },
];
