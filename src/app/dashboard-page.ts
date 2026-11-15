import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    if (!this.auth.logout()) {
      void this.router.navigateByUrl('/login');
    }
  }
}
