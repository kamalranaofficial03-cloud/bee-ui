import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthCallbackPage } from './auth-callback-page';
import { DashboardPage } from './dashboard-page';
import { LoginPage } from './login-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginPage },
  { path: 'callback', component: AuthCallbackPage },
  { path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
