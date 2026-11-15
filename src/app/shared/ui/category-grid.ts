import { Component, output } from '@angular/core';
import { SectionHeading } from './section-heading';
import type { StoreCategory } from './store-header';

@Component({
  imports: [SectionHeading],
  selector: 'app-category-grid',
  templateUrl: './category-grid.html',
  styleUrl: './category-grid.scss',
})
export class CategoryGrid {
  readonly categorySelected = output<StoreCategory>();
}
