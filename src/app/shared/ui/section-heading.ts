import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  template: `
    <div class="section-heading">
      @if (eyebrow()) {
        <p class="eyebrow">{{ eyebrow() }}</p>
      }
      <div class="heading-copy">
        <h2 [id]="headingId()">{{ title() }}</h2>
        @if (description()) {
          <p>{{ description() }}</p>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      color: var(--store-primary);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .heading-copy {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
    }

    h2 {
      margin: 0;
      color: var(--store-ink);
      font-size: clamp(1.7rem, 3vw, 2.35rem);
      letter-spacing: -0.05em;
      line-height: 1.12;
    }

    .heading-copy p {
      max-width: 28rem;
      margin: 0;
      color: var(--store-muted);
      line-height: 1.5;
    }

    @media (max-width: 640px) {
      .heading-copy {
        align-items: start;
        flex-direction: column;
      }
    }
  `,
})
export class SectionHeading {
  readonly eyebrow = input('');
  readonly headingId = input('');
  readonly title = input.required<string>();
  readonly description = input('');
}
