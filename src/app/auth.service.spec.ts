import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [AuthService] });
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('rejects callback state that does not match the saved OAuth state', async () => {
    sessionStorage.setItem('oauth_state', 'expected-state');
    sessionStorage.setItem('pkce_verifier', 'verifier');
    const auth = TestBed.inject(AuthService);

    const result = await auth.handleCallback(
      new URLSearchParams({ code: 'authorization-code', state: 'unexpected-state' }),
    );

    expect(result).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.authError()).toContain('could not be verified');
    expect(sessionStorage.getItem('oauth_state')).toBeNull();
    expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
  });

  it('clears expired tokens during session initialization', () => {
    sessionStorage.setItem('access_token', 'expired-token');
    sessionStorage.setItem('token_expiry_ts', String(Date.now() - 1));
    const auth = TestBed.inject(AuthService);

    expect(auth.isSessionValid()).toBe(false);
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('exposes the subject claim and valid access token for account requests', () => {
    const username = 'account@example.test';
    const token = `${btoa('{"alg":"none"}')}.${btoa(JSON.stringify({ sub: username }))}.signature`;
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('token_expiry_ts', String(Date.now() + 60_000));
    const auth = TestBed.inject(AuthService);

    expect(auth.username()).toBe(username);
    expect(auth.getValidAccessToken()).toBe(token);
  });

  it('updates the authentication signal when a callback exchanges tokens', async () => {
    sessionStorage.setItem('oauth_state', 'expected-state');
    sessionStorage.setItem('pkce_verifier', 'verifier');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'access-token', expires_in: 3600 }),
      }),
    );
    const auth = TestBed.inject(AuthService);

    const result = await auth.handleCallback(
      new URLSearchParams({ code: 'authorization-code', state: 'expected-state' }),
    );

    expect(result).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.authError()).toBeNull();
    expect(auth.logout()).toBe(false);
    expect(auth.isAuthenticated()).toBe(false);
  });
});
