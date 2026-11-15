import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import {
  ActionButton,
  CategoryGrid,
  HeroBanner,
  ProductCard,
  RegistrationSection,
  SectionHeading,
  StoreHeader,
  type StoreCategory,
  type StoreProduct,
} from './shared/ui';
import { AuthService } from './auth.service';

const products: StoreProduct[] = [
  {
    id: 'studio-headphones',
    name: 'Studio wireless headphones',
    category: 'Tech',
    description: 'Comfort-first sound for work, travel, and everything between.',
    price: '$89.00',
    badge: 'Staff pick',
    art: '🎧',
    background: 'linear-gradient(145deg, #dcecf4, #eff7f8)',
  },
  {
    id: 'pour-over-set',
    name: 'Ceramic pour-over set',
    category: 'Home',
    description: 'A slower, brighter start to your everyday coffee ritual.',
    price: '$36.00',
    badge: 'Small batch',
    art: '☕',
    background: 'linear-gradient(145deg, #f3e4d7, #fcf4e9)',
  },
  {
    id: 'canvas-weekender',
    name: 'Canvas weekender tote',
    category: 'Style',
    description: 'Room for the little extras, made for days on the move.',
    price: '$42.00',
    badge: 'Everyday favorite',
    art: '👜',
    background: 'linear-gradient(145deg, #e8e4f2, #f4eff7)',
  },
  {
    id: 'soft-glow-lamp',
    name: 'Soft glow bedside lamp',
    category: 'Home',
    description: 'Warm, dimmable light to make winding down feel easy.',
    price: '$54.00',
    badge: 'New arrival',
    art: '💡',
    background: 'linear-gradient(145deg, #f7edc9, #fcf6e5)',
  },
  {
    id: 'daily-movement-mat',
    name: 'Daily movement yoga mat',
    category: 'Wellness',
    description: 'A steady, cushioned surface for your at-home practice.',
    price: '$38.00',
    badge: 'Easy-care',
    art: '🧘',
    background: 'linear-gradient(145deg, #dcebe1, #edf5ed)',
  },
  {
    id: 'desk-speaker',
    name: 'Pocket-size desk speaker',
    category: 'Tech',
    description: 'A compact companion for playlists, podcasts, and calls.',
    price: '$64.00',
    badge: 'Just in',
    art: '🔊',
    background: 'linear-gradient(145deg, #e3eaf5, #f0f3fa)',
  },
];

@Component({
  imports: [
    ActionButton,
    CategoryGrid,
    HeroBanner,
    MatButtonModule,
    ProductCard,
    RegistrationSection,
    RouterLink,
    SectionHeading,
    StoreHeader,
  ],
  selector: 'app-bee-landing-page',
  templateUrl: './bee-landing-page.html',
  styleUrl: './bee-landing-page.scss',
})
export class BeeLandingPage {
  private readonly auth = inject(AuthService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly authError = this.auth.authError;
  protected readonly isStartingSignIn = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly selectedCategory = signal<StoreCategory>('All');
  protected readonly cartItems = signal<StoreProduct[]>([]);
  protected readonly cartCount = computed(() => this.cartItems().length);

  protected readonly categories: readonly StoreCategory[] = [
    'All',
    'Tech',
    'Home',
    'Style',
    'Wellness',
  ];

  protected readonly visibleProducts = computed(() => {
    const category = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const matchesQuery =
        query.length === 0 ||
        `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  });

  protected updateSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected selectCategory(category: StoreCategory): void {
    this.selectedCategory.set(category);
  }

  protected addToBasket(product: StoreProduct): void {
    this.cartItems.update((items) => [...items, product]);
  }

  protected beginSignIn(): void {
    if (this.isStartingSignIn()) {
      return;
    }
    this.isStartingSignIn.set(true);
    void this.auth.startLogin('/account').catch(() => this.isStartingSignIn.set(false));
  }
}
