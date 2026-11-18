import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { ActionButton } from './shared/ui/action-button';
import { AuthService } from './auth.service';
import { AccountService } from './account.service';
import { AccountDetails } from './account.model';

type AccountPageState =
  | { kind: 'loading' }
  | { kind: 'loaded'; account: AccountDetails }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

@Component({
  imports: [ActionButton, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  selector: 'app-account-page',
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  private readonly auth = inject(AuthService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly retryCount = signal(0);

  protected readonly accountState = toSignal(
    combineLatest([toObservable(this.auth.username), toObservable(this.retryCount)]).pipe(
      switchMap(([username]) => {
        if (!username) {
          return of<AccountPageState>({
            kind: 'error',
            message: 'Your sign-in did not include an account username. Please sign in again.',
          });
        }

        return this.accountService.getAccount(username).pipe(
          map((account): AccountPageState => ({ kind: 'loaded', account })),
          startWith<AccountPageState>({ kind: 'loading' }),
          catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 404) {
              return of<AccountPageState>({ kind: 'not-found' });
            }

            console.error('[Account] Failed to load account details:', error);
            const message =
              error instanceof HttpErrorResponse && [401, 403].includes(error.status)
                ? 'Your session is not authorized to load account details. Please sign in again.'
                : 'We could not load your account details. Please try again.';
            return of<AccountPageState>({ kind: 'error', message });
          }),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } as AccountPageState },
  );

  protected readonly accountName = computed(() => {
    const state = this.accountState();
    if (state.kind !== 'loaded') {
      return '';
    }
    return [state.account.firstName, state.account.lastName].filter(Boolean).join(' ');
  });

  protected retry(): void {
    this.retryCount.update((count) => count + 1);
  }

  protected logout(): void {
    if (!this.auth.logout()) {
      void this.router.navigateByUrl('/');
    }
  }
}
