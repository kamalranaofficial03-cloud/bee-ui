import { computed, Injectable, signal } from '@angular/core';

interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authServer = 'http://localhost:9000';
  private readonly clientId = 'frontend-client';
  private readonly redirectUri = new URL('/callback', window.location.origin).href;
  private readonly scopes = 'profile';
  private readonly tokenKeys = [
    'access_token',
    'id_token',
    'refresh_token',
    'expires_in',
    'token_expiry_ts',
    'token_issued_ts',
  ];

  private readonly accessToken = signal<string | null>(this.readStoredAccessToken());
  private readonly tokenExpiresAt = signal<number | null>(this.readStoredExpiry());
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);
  private expirationTimer: ReturnType<typeof setTimeout> | undefined;

  readonly isAuthenticated = computed(() => {
    const expiresAt = this.tokenExpiresAt();
    return this.accessToken() !== null && expiresAt !== null && expiresAt > Date.now();
  });
  readonly username = computed(() => {
    const token = this.accessToken();
    if (!token || !this.isAuthenticated()) {
      return null;
    }

    const payload = this.decodeJwt(token)?.payload;
    if (payload === null || typeof payload !== 'object' || !('sub' in payload)) {
      return null;
    }

    const subject = payload.sub;
    return typeof subject === 'string' && subject.trim().length > 0 ? subject : null;
  });
  readonly isLoading = this.loading.asReadonly();
  readonly authError = this.error.asReadonly();

  constructor() {
    const expiresAt = this.tokenExpiresAt();
    if (this.isAuthenticated() && expiresAt !== null) {
      this.scheduleExpiration(expiresAt);
    } else {
      this.clearTokens();
    }
  }

  isSessionValid(): boolean {
    const expiresAt = this.tokenExpiresAt();
    if (expiresAt === null || expiresAt <= Date.now()) {
      this.clearTokens();
      return false;
    }
    return this.accessToken() !== null;
  }

  getValidAccessToken(): string | null {
    const token = this.accessToken();
    return token !== null && this.isSessionValid() ? token : null;
  }

  generateCodeVerifier(): string {
    return this.base64urlEncode(crypto.getRandomValues(new Uint8Array(64)));
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64urlEncode(new Uint8Array(digest));
  }

  base64urlEncode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  base64urlDecode(value: string): string {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  }

  decodeJwt(token: string): {
    header: unknown;
    payload: unknown;
    signature: string;
    raw: string[];
  } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      return {
        header: JSON.parse(this.base64urlDecode(parts[0])),
        payload: JSON.parse(this.base64urlDecode(parts[1])),
        signature: parts[2],
        raw: parts,
      };
    } catch {
      return null;
    }
  }

  async startLogin(returnUrl = '/account'): Promise<void> {
    this.error.set(null);
    try {
      const verifier = this.generateCodeVerifier();
      const challenge = await this.generateCodeChallenge(verifier);
      const state = this.base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));

      sessionStorage.setItem('pkce_verifier', verifier);
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('auth_return_url', this.normalizeReturnUrl(returnUrl));

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopes,
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      });

      window.location.assign(`${this.authServer}/oauth2/authorize?${params}`);
    } catch (error) {
      console.error('[OAuth2] Unable to start sign-in:', error);
      this.error.set('Unable to start sign-in. Please try again.');
      throw error;
    }
  }

  async handleCallback(params: URLSearchParams): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      if (params.has('error')) {
        this.clearLoginTransaction();
        this.error.set('Sign-in was cancelled or could not be completed.');
        return false;
      }

      const code = params.get('code');
      const state = params.get('state');
      const savedState = sessionStorage.getItem('oauth_state');
      const codeVerifier = sessionStorage.getItem('pkce_verifier');
      this.clearLoginTransaction();

      if (!code || !state || !savedState || state !== savedState || !codeVerifier) {
        this.error.set('The sign-in response could not be verified. Please try again.');
        return false;
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        code,
        code_verifier: codeVerifier,
      });

      const response = await fetch(`${this.authServer}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        this.error.set('Sign-in failed while exchanging the authorization code. Please try again.');
        return false;
      }

      const tokens = (await response.json()) as TokenResponse;
      if (!tokens.access_token || typeof tokens.access_token !== 'string') {
        this.error.set('The sign-in server returned an invalid token response.');
        return false;
      }

      this.saveTokens(tokens);
      return true;
    } catch (error) {
      console.error('[OAuth2] Sign-in callback failed:', error);
      this.error.set('Unable to complete sign-in. Please try again.');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  consumeReturnUrl(): string {
    const returnUrl = sessionStorage.getItem('auth_return_url');
    sessionStorage.removeItem('auth_return_url');
    return this.normalizeReturnUrl(returnUrl ?? '/account');
  }

  logout(): boolean {
    const token = this.accessToken();
    const idToken = sessionStorage.getItem('id_token');
    const hasValidSession = this.isSessionValid();
    this.clearTokens();

    if (hasValidSession && token && idToken) {
      const params = new URLSearchParams({
        id_token_hint: idToken,
        post_logout_redirect_uri: window.location.origin,
      });
      window.location.assign(`${this.authServer}/connect/logout?${params}`);
      return true;
    }
    return false;
  }

  private saveTokens(tokens: TokenResponse): void {
    const expiresIn = Number(tokens.expires_in ?? 3600);
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error('The sign-in server returned an invalid token expiry.');
    }

    const expiresAt = Date.now() + expiresIn * 1000;
    sessionStorage.setItem('access_token', tokens.access_token);
    sessionStorage.setItem('id_token', tokens.id_token ?? '');
    sessionStorage.setItem('refresh_token', tokens.refresh_token ?? '');
    sessionStorage.setItem('expires_in', String(expiresIn));
    sessionStorage.setItem('token_expiry_ts', String(expiresAt));
    sessionStorage.setItem('token_issued_ts', String(Date.now()));
    this.accessToken.set(tokens.access_token);
    this.tokenExpiresAt.set(expiresAt);
    this.scheduleExpiration(expiresAt);
  }

  private clearTokens(): void {
    this.tokenKeys.forEach((key) => sessionStorage.removeItem(key));
    this.accessToken.set(null);
    this.tokenExpiresAt.set(null);
    if (this.expirationTimer !== undefined) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  }

  private clearLoginTransaction(): void {
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('oauth_state');
  }

  private readStoredAccessToken(): string | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('access_token');
  }

  private readStoredExpiry(): number | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    const expiry = Number(sessionStorage.getItem('token_expiry_ts'));
    return Number.isFinite(expiry) && expiry > 0 ? expiry : null;
  }

  private scheduleExpiration(expiresAt: number): void {
    if (this.expirationTimer !== undefined) {
      clearTimeout(this.expirationTimer);
    }
    const delay = Math.min(Math.max(expiresAt - Date.now(), 0), 2_147_483_647);
    this.expirationTimer = setTimeout(() => {
      if (expiresAt <= Date.now()) {
        this.clearTokens();
      } else {
        this.scheduleExpiration(expiresAt);
      }
    }, delay);
  }

  private normalizeReturnUrl(returnUrl: string): string {
    if (!returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
      return '/account';
    }

    const url = new URL(returnUrl, window.location.origin);
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : '/account';
  }
}
