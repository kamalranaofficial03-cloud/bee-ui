import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

type ButtonAppearance = 'text' | 'filled' | 'elevated' | 'outlined' | 'tonal';

@Component({
  imports: [MatButtonModule],
  selector: 'app-action-button',
  template: `
    <button
      matButton
      [matButton]="appearance()"
      [type]="type()"
      [disabled]="disabled()"
      (click)="pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    button {
      width: 100%;
      min-height: 2.75rem;
      border-radius: 999px;
      font-weight: 700;
    }
  `,
})
export class ActionButton {
  readonly appearance = input<ButtonAppearance>('filled');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly pressed = output<void>();
}
