import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ACCOUNT_API_BASE_URL, AccountService } from './account.service';

describe('AccountService', () => {
  const username = 'account@example.test';
  const accessToken = `${btoa('{"alg":"none"}')}.${btoa(JSON.stringify({ sub: username }))}.signature`;

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('token_expiry_ts', String(Date.now() + 60_000));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('fetches the encoded account username with the OAuth bearer token', async () => {
    const service = TestBed.inject(AccountService);
    const http = TestBed.inject(HttpTestingController);
    const result = firstValueFrom(service.getAccount(username));
    const request = http.expectOne({
      method: 'GET',
      url: 'http://localhost:8090/account/account%40example.test',
    });

    expect(request.request.headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
    request.flush({
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

    await expect(result).resolves.toEqual({
      id: 17,
      firstName: 'Kamal',
      lastName: 'Rana',
      username,
      contactNo: '555-0100',
      address: [],
    });
  });

  it('rejects a response without an account body', async () => {
    const service = TestBed.inject(AccountService);
    const http = TestBed.inject(HttpTestingController);
    const result = firstValueFrom(service.getAccount(username));
    http.expectOne('http://localhost:8090/account/account%40example.test').flush({
      body: null,
    });

    await expect(result).rejects.toThrow('The account service returned an invalid response.');
  });
});
