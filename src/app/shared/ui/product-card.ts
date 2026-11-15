import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActionButton } from './action-button';

export interface StoreProduct {
  id: string;
  name: string;
  category: 'Tech' | 'Home' | 'Style' | 'Wellness';
  description: string;
  price: string;
  badge: string;
  art: string;
  background: string;
}

@Component({
  imports: [ActionButton, MatCardModule],
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  readonly product = input.required<StoreProduct>();
  readonly addToBasket = output<StoreProduct>();
}
