import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject, Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AccountApiResponse, AccountDetails } from './account.model';

export const ACCOUNT_API_BASE_URL = new InjectionToken<string>('ACCOUNT_API_BASE_URL');

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiBaseUrl = inject(ACCOUNT_API_BASE_URL).replace(/\/+$/, '');

  getAccount(username: string): Observable<AccountDetails> {
    const token = this.auth.getValidAccessToken();
    if (!token) {
      return throwError(() => new Error('A valid sign-in session is required.'));
    }
    if (!username.trim()) {
      return throwError(() => new Error('An account username is required.'));
    }

    const url = `${this.apiBaseUrl}/account/${encodeURIComponent(username)}`;
    return this.http
      .get<AccountApiResponse>(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((response) => {
          if (!response?.body || typeof response.body !== 'object') {
            throw new Error('The account service returned an invalid response.');
          }
          return response.body;
        }),
      );
  }
}
