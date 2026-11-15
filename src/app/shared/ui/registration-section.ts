import { Component, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormField,
  FormRoot,
  email,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { ActionButton } from './action-button';

interface RegistrationModel {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  imports: [ActionButton, FormField, FormRoot, MatCardModule, MatFormFieldModule, MatInputModule],
  selector: 'app-registration-section',
  templateUrl: './registration-section.html',
  styleUrl: './registration-section.scss',
})
export class RegistrationSection {
  readonly signInRequested = output<void>();
  protected readonly registrationNotice = signal<string | null>(null);

  private readonly registrationModel = signal<RegistrationModel>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  protected readonly registrationForm = form(
    this.registrationModel,
    (path) => {
      required(path.firstName, { message: 'Enter your first name.' });
      required(path.lastName, { message: 'Enter your last name.' });
      required(path.email, { message: 'Enter your email address.' });
      email(path.email, { message: 'Enter a valid email address.' });
      required(path.password, { message: 'Create a password.' });
      minLength(path.password, 8, { message: 'Use at least 8 characters.' });
      required(path.confirmPassword, { message: 'Confirm your password.' });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value().length > 0 && value() !== valueOf(path.password)
          ? { kind: 'password-mismatch', message: 'Passwords do not match.' }
          : undefined,
      );
    },
    {
      submission: {
        action: async () => {
          this.registrationNotice.set(
            'The form is valid, but account creation is not connected yet. Nothing was submitted.',
          );
        },
      },
    },
  );
}
