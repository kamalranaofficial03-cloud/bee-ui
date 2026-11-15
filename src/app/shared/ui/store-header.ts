import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ActionButton } from './action-button';

export type StoreCategory = 'All' | 'Tech' | 'Home' | 'Style' | 'Wellness';

@Component({
  imports: [ActionButton, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  selector: 'app-store-header',
  templateUrl: './store-header.html',
  styleUrl: './store-header.scss',
})
export class StoreHeader {
  readonly categories = input.required<readonly StoreCategory[]>();
  readonly selectedCategory = input.required<StoreCategory>();
  readonly searchQuery = input.required<string>();
  readonly cartCount = input.required<number>();
  readonly isAuthenticated = input.required<boolean>();
  readonly isStartingSignIn = input(false);

  readonly queryChange = output<string>();
  readonly categoryChange = output<StoreCategory>();
  readonly signInRequested = output<void>();

  protected updateSearch(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.queryChange.emit(event.target.value);
    }
  }
}
