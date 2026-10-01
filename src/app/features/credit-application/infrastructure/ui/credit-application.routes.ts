import { Routes } from '@angular/router';
import { provideCreditApplication } from '../providers/credit-application.providers';

export const creditApplicationRoutes: Routes = [
  {
    path: '',
    providers: [provideCreditApplication()],
    children: [
      {
        path: '',
        redirectTo: 'basic-data',
        pathMatch: 'full',
      },

      {
        path: 'basic-data',
        loadComponent: () =>
          import('./pages/request/basic-data/basic-data').then(m => m.BasicData),
      },
      {
        path: 'consent',
        loadComponent: () =>
          import('./pages/request/consent/consent').then(m => m.Consent),
      },
      {
        path: 'identity-validation',
        loadComponent: () =>
          import('./pages/identity-validation/identity-validation/identity-validation').then(m => m.IdentityValidation),
      },
      {
        path: 'result',
        loadComponent: () =>
          import('./pages/result/result/result').then(m => m.Result),
      },
      // { path: 'income',             loadComponent: () => import('./pages/result/income/income').then(m => m.Income) },
      // { path: 'credentials',        loadComponent: () => import('./pages/result/credentials/credentials').then(m => m.Credentials) },
      // { path: 'document-delivery',  loadComponent: () => import('./pages/result/document-delivery/document-delivery').then(m => m.DocumentDelivery) },

      // ── Stage: KYC ───────────────────────────────────────────────────────────
      // { path: 'personal-data',    loadComponent: () => import('./pages/kyc/personal-data/personal-data').then(m => m.PersonalData) },
      // { path: 'address',           loadComponent: () => import('./pages/kyc/address/address').then(m => m.Address) },
      // { path: 'income-details',    loadComponent: () => import('./pages/kyc/income-details/income-details').then(m => m.IncomeDetails) },
      // { path: 'employment',             loadComponent: () => import('./pages/kyc/employment/employment').then(m => m.Employment) },

      // ── Stage: Personalization ────────────────────────────────────────────────
      // { path: 'card',             loadComponent: () => import('./pages/personalization/card/card').then(m => m.Card) },
      // { path: 'acceptance',          loadComponent: () => import('./pages/personalization/acceptance/acceptance').then(m => m.Acceptance) },
      // { path: 'delivery',             loadComponent: () => import('./pages/personalization/delivery/delivery').then(m => m.Delivery) },
      // { path: 'branch',            loadComponent: () => import('./pages/personalization/branch/branch').then(m => m.Branch) },
      // { path: 'location',           loadComponent: () => import('./pages/personalization/location/location').then(m => m.Location) },

      // ── Stage: Activation ─────────────────────────────────────────────────────
      // { path: 'completion',          loadComponent: () => import('./pages/activation/completion/completion').then(m => m.Completion) },

      // ── Stage: CardInsurance ──────────────────────────────────────────────────
      // { path: 'insurance-request',    loadComponent: () => import('./pages/card-insurance/insurance-request/insurance-request').then(m => m.InsuranceRequest) },
      // { path: 'acquisition',         loadComponent: () => import('./pages/card-insurance/acquisition/acquisition').then(m => m.Acquisition) },
    ],
  },
];
