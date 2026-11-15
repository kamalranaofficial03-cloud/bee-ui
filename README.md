# BeeUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Authentication flow

The app uses the authorization-code flow with PKCE. `/login` starts sign-in, `/callback` validates the OAuth state and exchanges the code, and `/account` is protected by the functional `canActivate` guard. An unauthenticated visit is redirected to login and its internal destination is restored after sign-in.

The home page is a small example storefront built with Angular Material and the project-owned reusable components in `src/app/shared/ui`. Its category/search/cart state and registration form use Angular signals and Signal Forms. Registration is currently UI-only and does not send or store submitted details.

Authentication status, loading state, and errors are exposed as Angular signals by `AuthService`. The demo stores tokens in `sessionStorage`; configure the auth server and client settings in `src/app/auth.service.ts` for your environment before deployment. The Material theme is defined in `src/styles.scss`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
