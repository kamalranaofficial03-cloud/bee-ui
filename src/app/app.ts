import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html'
})
export class App {
  private readonly authService = inject(AuthService);
  protected readonly title = signal('bee-ui');

  ngOnInit(): void {
    this.init();
  }

  async init() {
    const isCallback =
      window.location.pathname === '/callback' ||
      window.location.pathname.endsWith('/callback') ||
      new URLSearchParams(window.location.search).has('code');

    if (isCallback && new URLSearchParams(window.location.search).has('code')) {
      await this.authService.handleCallback();
    }
  }

  
  startLogin(): Promise<void> {
    return this.authService.startLogin();
  }

  logout(): void {
    this.authService.logout();
  }
}
