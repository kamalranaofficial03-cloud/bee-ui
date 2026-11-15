import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly authError = this.auth.authError;
  protected readonly isStartingLogin = signal(false);

  protected login(): void {
    this.isStartingLogin.set(true);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.auth.startLogin(returnUrl).catch(() => {
      this.isStartingLogin.set(false);
    });
  }
}
