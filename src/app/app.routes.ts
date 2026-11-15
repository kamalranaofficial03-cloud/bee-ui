import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./bee-landing-page').then((page) => page.BeeLandingPage),
  },
  { path: 'login', loadComponent: () => import('./login-page').then((page) => page.LoginPage) },
  {
    path: 'callback',
    loadComponent: () => import('./auth-callback-page').then((page) => page.AuthCallbackPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./account-page').then((page) => page.AccountPage),
  },
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'account' },
  { path: '**', redirectTo: '' },
];
