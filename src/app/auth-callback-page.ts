import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-callback-page',
  templateUrl: './auth-callback-page.html',
})
export class AuthCallbackPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly authError = this.auth.authError;
  protected readonly isLoading = this.auth.isLoading;

  ngOnInit(): void {
    void this.completeSignIn();
  }

  private async completeSignIn(): Promise<void> {
    const params = new URLSearchParams();
    for (const key of this.route.snapshot.queryParamMap.keys) {
      for (const value of this.route.snapshot.queryParamMap.getAll(key)) {
        params.append(key, value);
      }
    }
    const success = await this.auth.handleCallback(params);

    if (success) {
      await this.router.navigateByUrl(this.auth.consumeReturnUrl());
      return;
    }

    await this.router.navigateByUrl('/login');
  }
}
