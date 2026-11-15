import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LoginPage } from './login-page';
import { routes } from './app.routes';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('redirects unauthenticated users to login and preserves their destination', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/account', LoginPage);

    expect(TestBed.inject(Router).url).toBe('/login?returnUrl=%2Faccount');
  });
});
