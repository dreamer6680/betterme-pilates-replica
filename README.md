# BetterMe Pilates First Page Replica

A local-only Next.js reproduction of the observed BetterMe Pilates first page.

The application reproduces the first age-selection screen and its responsive desktop/mobile layout while intentionally replacing upstream mutations, analytics, and questionnaire infrastructure with local Next.js route handlers.

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Plain global CSS
- Next.js route handlers
- Vitest
- React Testing Library
- No database
- No authentication
- No analytics
- No external backend

## Requirements

Node.js 20.9 or newer is recommended.

## Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The root URL redirects to:

```text
/first-page-brand-palette?flow=2117
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
```

## Routes

### `/`

Redirects to:

```text
/first-page-brand-palette?flow=2117
```

### `/first-page-brand-palette?flow=2117`

Main BetterMe-inspired age-selection screen.

It loads normalized configuration from:

```text
GET /api/config?flow=2117
```

A compile-time local fallback is rendered immediately so the card layout does not collapse while the API request is pending or if the request fails.

### `/onboarding`

Local confirmation screen.

A successful selection navigates to a URL such as:

```text
/onboarding?flow=2117&order=53bef0a5-c144-46d7-b63f-9b534029bb70&age=18-29
```

This page is deliberately only a local confirmation page. It does not reproduce or call BetterMe's actual questionnaire.

## API

### `GET /api/health`

Response:

```json
{
  "status": "ok"
}
```

### `GET /api/config?flow=2117`

Returns normalized local page configuration.

Example:

```bash
curl "http://localhost:3000/api/config?flow=2117"
```

Representative response shape:

```json
{
  "flow": "2117",
  "page": {
    "id": 6893,
    "type": "generated",
    "title": "First Page Type",
    "variant": "four_cards"
  },
  "brand": {
    "logoUrl": "https://image-service.betterme.world/...",
    "logoAlt": "BetterMe"
  },
  "heading": {
    "line1": "HOME PILATES",
    "line2": "WORKOUT STUDIO",
    "prompt": "CHOOSE YOUR AGE"
  },
  "cards": []
}
```

Unsupported flows return HTTP `404`:

```json
{
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "No local configuration exists for flow \"9999\"."
  }
}
```

### `POST /api/selections`

Request:

```json
{
  "flow": "2117",
  "ageRange": "18-29"
}
```

Supported age values:

```text
18-29
30-39
40-49
50+
```

Example:

```bash
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"flow":"2117","ageRange":"18-29"}' \
  "http://localhost:3000/api/selections"
```

Successful response:

```http
HTTP/1.1 201 Created
```

```json
{
  "orderId": "53bef0a5-c144-46d7-b63f-9b534029bb70",
  "nextUrl": "/onboarding?flow=2117&order=53bef0a5-c144-46d7-b63f-9b534029bb70&age=18-29",
  "selection": {
    "flow": "2117",
    "ageRange": "18-29"
  }
}
```

`orderId` is generated locally with `crypto.randomUUID()`.

Malformed JSON returns HTTP `400`:

```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "Request body must contain valid JSON."
  }
}
```

Missing or malformed fields return HTTP `400`:

```json
{
  "error": {
    "code": "INVALID_PAYLOAD",
    "message": "Request body must contain non-empty string fields \"flow\" and \"ageRange\"."
  }
}
```

Unsupported flows return HTTP `422`:

```json
{
  "error": {
    "code": "UNSUPPORTED_FLOW",
    "message": "Unsupported flow \"9999\".",
    "details": {
      "supportedFlows": ["2117"]
    }
  }
}
```

Unsupported age ranges return HTTP `422`:

```json
{
  "error": {
    "code": "UNSUPPORTED_AGE_RANGE",
    "message": "Unsupported age range \"60-69\".",
    "details": {
      "supportedAgeRanges": [
        "18-29",
        "30-39",
        "40-49",
        "50+"
      ]
    }
  }
}
```

## Architecture

### `lib/config.ts`

Single local normalized representation of:

- flow metadata
- logo
- page headings
- age cards
- public legal links
- Docs menu entries
- support email

Both the server-rendered fallback and `/api/config` use this configuration.

### `lib/selection.ts`

Contains framework-independent selection validation and URL generation.

Keeping validation separate from the route handler makes it directly testable.

### `app/api`

Implements the application's local backend.

No request is proxied to a BetterMe API.

### `components/PilatesLanding.tsx`

Owns browser-side page state:

- configuration loading
- API errors
- card submission
- navigation
- Docs drawer state

### `components/DocsDrawer.tsx`

Accessible responsive drawer with:

- `role="dialog"`
- `aria-modal`
- initial focus
- Tab focus containment
- close button
- Escape handling
- backdrop handling
- background scroll locking
- focus restoration handled by the parent menu button

### `components/HelpPopover.tsx`

Small support popover exposing the published support email through a `mailto:` link.

## Accessibility

The implementation includes:

- semantic `header`, `main`, `section`, `nav`, and `footer`
- keyboard-operable age buttons
- visible `:focus-visible` states
- descriptive image alt text
- `aria-pressed` and `aria-busy` selection state
- live regions for loading/errors
- accessible Docs dialog
- Escape and backdrop dismissal
- focus trapping inside the Docs drawer
- reduced-motion handling through `prefers-reduced-motion`

## Responsive behavior

The desktop layout uses:

- approximately 87 px header
- four 264 × 281 px cards
- 24 px card gaps
- centered four-card row

At mobile widths the layout switches to:

- approximately 70 px compact header
- two-column card grid
- 16 px gaps
- approximately 196 px card height

At 390 px viewport width with 20 px horizontal page padding and a 16 px grid gap, each card is approximately 167 px wide.

## Differences from the source site

This is intentionally not a production BetterMe client.

Differences include:

- no Google Tag Manager
- no trackers
- no analytics
- no cookies copied from the source
- no payment processing
- no authentication
- no subscription creation
- no upstream BetterMe API mutations
- no questionnaire API request
- no external database
- no real order
- age selection produces only a local UUID and local confirmation page

The source site's publicly hosted image assets are used through `next/image` for visual fidelity.

Public legal/support links are navigation links only and are not application backend dependencies.

## Testing

Run:

```bash
npm run test
```

Tests cover:

- supported selection validation
- malformed payload rejection
- unsupported flow rejection
- unsupported age rejection
- encoded onboarding URL generation
- accessible card rendering
- age card click behavior
- busy/disabled card state

For complete verification also run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
