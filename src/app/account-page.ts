import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { ActionButton } from './shared/ui/action-button';
import { AuthService } from './auth.service';

@Component({
  imports: [ActionButton, MatButtonModule, RouterLink],
  selector: 'app-account-page',
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    if (!this.auth.logout()) {
      void this.router.navigateByUrl('/');
    }
  }
}
