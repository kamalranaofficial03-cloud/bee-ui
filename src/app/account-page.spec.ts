import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { AccountPage } from './account-page';
import { ACCOUNT_API_BASE_URL } from './account.service';

describe('AccountPage', () => {
  const username = 'account@example.test';
  const accessToken = `${btoa('{"alg":"none"}')}.${btoa(JSON.stringify({ sub: username }))}.signature`;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('token_expiry_ts', String(Date.now() + 60_000));
    TestBed.configureTestingModule({
      imports: [AccountPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ACCOUNT_API_BASE_URL, useValue: 'http://localhost:8090' },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.inject(AuthService).logout();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('renders account details after the request succeeds', () => {
    const fixture = TestBed.createComponent(AccountPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http.expectOne('http://localhost:8090/account/account%40example.test').flush({
      body: {
        id: 17,
        firstName: 'Kamal',
        lastName: 'Rana',
        username,
        contactNo: '555-0100',
        address: [],
      },
      message: 'Account loaded',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Welcome back, Kamal Rana');
    expect(fixture.nativeElement.textContent).toContain(username);
    expect(fixture.nativeElement.textContent).toContain('555-0100');
  });

  it('shows a not-found state for a 404 response', () => {
    const fixture = TestBed.createComponent(AccountPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http
      .expectOne('http://localhost:8090/account/account%40example.test')
      .flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Account not found');
  });
});
