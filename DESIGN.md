# Signal-Based Account Details

## Purpose

The protected account page fetches the signed-in user's account from the account API and displays loading, success, not-found, and error states. The current backend contract is `GET http://localhost:8090/account/{username}` with an OAuth bearer token. The username comes from the JWT `sub` claim.

## Proposed structure

```text
src/app/
  account-page.ts             # Signal-driven view state
  account-page.html
  account-page.scss
  account.service.ts          # Authenticated REST access
  account.model.ts            # API/view model types
  account-page.spec.ts
  account.service.spec.ts
```

Keep HTTP access in the injectable service. The page coordinates authentication identity, request state, and presentation. The existing `/account` route remains protected by the auth guard.

## API contract

The account endpoint accepts the username path segment and bearer token:

```http
GET /account/{username}
Authorization: Bearer <access-token>
Accept: application/json
```

```json
{
  "body": {
    "id": 17,
    "firstName": "Example",
    "lastName": "User",
    "username": "account@example.test",
    "contactNo": "555-0100",
    "address": []
  },
  "message": "Account loaded"
}
```

The service should expose a typed `getAccount(username)` method using Angular `HttpClient`, send the OAuth access token in the `Authorization` header, URL-encode the username, and unwrap the response's `body`. The account page currently displays name, username, contact number, and account ID. Address fields were not supplied, so addresses are not displayed. TypeScript types do not validate JSON at runtime; reject a response without an account body.

## State and data flow

Use one discriminated state signal rather than separate `data`, `loading`, and `error` signals. A single state prevents impossible combinations such as showing an error and successful data simultaneously:

```ts
type DetailsState =
  | { kind: 'loading' }
  | { kind: 'loaded'; details: Details }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };
```

The page should:

1. Read the username from the authenticated access token's `sub` claim.
2. Observe username and retry signals to trigger account loads.
3. Use RxJS `switchMap` to cancel stale requests; convert the resulting observable to a read-only signal with `toSignal`.
4. Map a successful response to `loaded`, a 404 to `not-found`, and other failures to a safe, user-facing `error` message. Log unexpected failures; do not expose raw server messages or silently substitute empty data.
5. Offer retry for recoverable failures. A retry should repeat the GET without changing the route or producing duplicate requests.

Represent state as one discriminated union (`loading`, `loaded`, `not-found`, or `error`) instead of independent data/loading/error signals. Initialize it as `loading`; the service remains stateless unless caching is explicitly required.

## UI behavior

Render the state explicitly in the template:

- **Loading:** Material progress indicator with an accessible status announcement.
- **Loaded:** Account card showing the account fields supported by the current page.
- **Not found:** Clear message explaining that no account is available for this signed-in user.
- **Error:** Friendly message and a retry action.

Use `role="status"`/polite live announcements for loading and `role="alert"` for actionable errors. Keep labels and headings semantic, provide a visible focus style, and avoid blank screens while requests are in progress. If using a Material component not currently themed, add its theme mixin in `src/styles.scss`.

## Security and reliability

- Require authentication only if the endpoint requires it; use the existing authentication flow and the agreed API authorization mechanism.
- Do not put credentials or access tokens in URLs, logs, or the document.
- Encode route IDs as path segments and handle missing or invalid IDs before making a request.
- Use HTTPS outside local development and configure the API base URL through the project’s environment/configuration pattern rather than hard-coding it in the component.
- Treat server data as untrusted text; let Angular interpolation escape content and avoid binding API strings to unsafe HTML.

## Verification

Add focused tests for the service’s request URL and response/error handling using Angular HTTP testing utilities. Component tests should cover loading, loaded, not-found, error, retry, and changing IDs (including ensuring a stale response is ignored). Verify keyboard access and screen-reader status announcements. Run the existing build and unit test commands after implementation.
