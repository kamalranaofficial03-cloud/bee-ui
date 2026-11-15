import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BeeLandingPage } from './bee-landing-page';

describe('BeeLandingPage', () => {
  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BeeLandingPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('filters the product list from the search field', async () => {
    const fixture = TestBed.createComponent(BeeLandingPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const search = fixture.nativeElement.querySelector(
      '.search-field input',
    ) as HTMLInputElement | null;
    expect(search).not.toBeNull();
    if (!search) {
      return;
    }

    search.value = 'headphones';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-product-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Studio wireless headphones');
  });

  it('shows required registration errors on submit', async () => {
    const fixture = TestBed.createComponent(BeeLandingPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    if (!form) {
      return;
    }

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Enter your first name.');
    expect(fixture.nativeElement.textContent).toContain('Enter your email address.');
  });
});
