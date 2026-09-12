# BetterMe-Inspired Home Pilates Assessment

A full-stack Next.js take-home implementation inspired by the public BetterMe Home Pilates quiz funnel. The project keeps the familiar age-selection/questionnaire experience while implementing its own persisted assessment backend, health calculation engine, access control, simulated subscription payment, automated tests, and browser E2E flow.

> This is an independent educational replica. It does not proxy private BetterMe APIs, process real payments, or provide medical advice.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Prisma ORM + PostgreSQL
- Zod validation
- Vitest + React Testing Library
- Playwright
- GitHub Actions
- Plain CSS modules/global CSS

## Core flow

```text
Age selection
  -> anonymous Visitor + AssessmentSession
  -> exact profile data saved incrementally
  -> Pilates questionnaire saved step-by-step
  -> server-side completion/health calculation
  -> preview result (locked fields omitted)
  -> mock /pay subscription activation
  -> full result
```

The browser receives an HTTP-only anonymous visitor cookie. The public session UUID is used to resume the assessment, but every session/result/payment operation also verifies visitor ownership on the server.

## Quick start

Requirements: Node.js 20.9+ and PostgreSQL 16+.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Example local database URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/betterme"
VISITOR_COOKIE_NAME="betterme_visitor"
```

Open:

```text
http://localhost:3000/first-page-brand-palette?flow=2117
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:watch
npm run test:e2e
npm run db:generate
npm run db:deploy
```

## Persistence model

```mermaid
erDiagram
    Visitor ||--o{ AssessmentSession : owns
    Visitor ||--o{ Subscription : has
    Visitor ||--o{ PaymentEvent : creates
    AssessmentSession ||--o{ AssessmentAnswer : contains
    AssessmentSession ||--o| HealthProfile : produces
    AssessmentSession ||--o| AssessmentResult : produces
    AssessmentSession ||--o{ PaymentEvent : references

    Visitor {
      uuid id PK
      datetime createdAt
      datetime updatedAt
    }

    AssessmentSession {
      uuid id PK
      uuid visitorId FK
      string flow
      string ageRange
      int currentStep
      int version
      enum status
      datetime completedAt
    }

    AssessmentAnswer {
      uuid id PK
      uuid sessionId FK
      string stepKey
      json value
      int revision
    }

    HealthProfile {
      uuid id PK
      uuid sessionId FK
      enum sex
      int age
      decimal heightCm
      decimal weightKg
      decimal targetWeightKg
      enum activityLevel
      enum goal
    }

    AssessmentResult {
      uuid id PK
      uuid sessionId FK
      decimal bmi
      string bmiCategory
      decimal bmr
      decimal tdee
      int recommendedCalories
      decimal weeklyChangeKg
      datetime targetDate
      json predictionCurve
      string algorithmVersion
    }

    Subscription {
      uuid id PK
      uuid visitorId FK
      enum plan
      enum status
      datetime startsAt
      datetime expiresAt
    }

    PaymentEvent {
      uuid id PK
      uuid visitorId FK
      uuid sessionId FK
      string idempotencyKey UK
      enum status
      json payload
    }
```

## API

### Create an assessment session

The existing age-selection UI calls the compatibility endpoint:

```http
POST /api/selections
Content-Type: application/json
```

```json
{
  "flow": "2117",
  "ageRange": "30-39"
}
```

It creates a real PostgreSQL-backed `AssessmentSession` and returns an onboarding URL containing its UUID.

The versioned API is also available at:

```http
POST /api/v1/sessions
```

### Resume a session

```http
GET /api/v1/sessions/:sessionId
```

Representative response:

```json
{
  "id": "<session-uuid>",
  "flow": "2117",
  "ageRange": "30-39",
  "currentStep": 4,
  "version": 9,
  "status": "DRAFT",
  "answers": {
    "sex": "FEMALE",
    "age": 30,
    "heightCm": 165,
    "weightKg": 70,
    "targetWeightKg": 62,
    "goal": "lose-weight"
  }
}
```

This server snapshot is used to restore progress even if browser `sessionStorage` is cleared.

### Incremental health-profile save

```http
PATCH /api/v1/sessions/:sessionId/health
Content-Type: application/json
```

```json
{
  "field": "weightKg",
  "value": 70,
  "expectedVersion": 4
}
```

Supported fields:

- `sex`: `FEMALE | MALE | OTHER`
- `age`: integer 18-100, also checked against selected age range at completion
- `heightCm`: 120-230
- `weightKg`: 35-300
- `targetWeightKg`: 35-300

Health-profile saves increment the session version but intentionally do not advance the Pilates questionnaire step.

### Incremental questionnaire save

```http
PATCH /api/v1/sessions/:sessionId/answers
Content-Type: application/json
```

```json
{
  "stepKey": "exerciseFrequency",
  "answer": "several-week",
  "stepIndex": 4,
  "expectedVersion": 10
}
```

The `(sessionId, stepKey)` row is upserted and `revision` increments. `currentStep` can only move forward.

#### Optimistic concurrency

Every mutable save requires `expectedVersion`. The transaction updates the session only when the database version still matches. Two clients writing the same version cannot both succeed.

A stale client receives HTTP `409`:

```json
{
  "code": "SESSION_VERSION_CONFLICT",
  "message": "The session changed since this client loaded it.",
  "details": {
    "currentVersion": 11
  }
}
```

### Complete the assessment

```http
POST /api/v1/sessions/:sessionId/complete
```

Completion requires:

- sex
- exact age
- height
- current weight
- target weight
- primary goal
- exercise frequency

The server projects the raw answers into a normalized `HealthProfile`, validates the complete combination, calculates the result, and persists `HealthProfile + AssessmentResult + COMPLETED session` in a transaction. Repeating completion is idempotent and returns the existing result.

### Read a result

```http
GET /api/v1/results/:sessionId
```

#### Free / preview access

Locked values are not serialized at all:

```json
{
  "access": "preview",
  "result": {
    "bmi": 25.71,
    "bmiCategory": "overweight",
    "targetDate": "2026-12-05T00:00:00.000Z"
  },
  "locked": [
    "predictionCurve",
    "recommendedCalories",
    "weeklyPlan"
  ]
}
```

The frontend draws only a decorative locked chart. It does not receive the real prediction data.

#### Active subscription

```json
{
  "access": "full",
  "result": {
    "bmi": 25.71,
    "bmiCategory": "overweight",
    "bmr": 1410.25,
    "tdee": 1939.09,
    "recommendedCalories": 1639,
    "weeklyChangeKg": -0.5,
    "targetDate": "2026-12-05T00:00:00.000Z",
    "predictionCurve": [],
    "algorithmVersion": "..."
  }
}
```

Expired subscriptions fall back to the preview DTO.

## Mock payment endpoint

No real payment provider or card data is involved. The simulator activates a database subscription only after the assessment is completed.

```http
POST /api/v1/pay
Idempotency-Key: <unique-key>
Content-Type: application/json
```

Monthly example:

```bash
curl -X POST "http://localhost:3000/api/v1/pay" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-payment-001" \
  -H "Cookie: betterme_visitor=<visitor-cookie-value>" \
  -d '{
    "sessionId": "<completed-session-id>",
    "plan": "monthly"
  }'
```

Response:

```json
{
  "paymentStatus": "SUCCEEDED",
  "subscriptionStatus": "ACTIVE",
  "sessionId": "<completed-session-id>"
}
```

Mock durations:

- `monthly`: 30 days
- `quarterly`: 90 days

`Idempotency-Key` is unique in `PaymentEvent`. Repeating the same successful key for the same visitor/session does not duplicate the purchase. Reusing it for a different visitor/session returns a conflict.

## Health algorithm

The calculation runs only on the server.

### BMI

```text
BMI = weightKg / (heightM²)
```

### BMR

Mifflin-St Jeor:

```text
base = 10 * weightKg + 6.25 * heightCm - 5 * age
male   = base + 5
female = base - 161
other  = neutral midpoint
```

### TDEE

```text
TDEE = BMR * activity multiplier
```

Exercise-frequency answers are normalized into activity levels before calculation.

### Recommended calories

The demo applies a bounded deterministic adjustment to TDEE based on the selected goal. It is intentionally an assessment example rather than a clinical nutrition recommendation.

### Target date / curve

The engine uses a bounded weekly-change model, calculates the number of weeks needed to approach the target, and persists a versioned prediction curve. Invalid or implausible profile combinations are rejected before result creation.

## Validation and safety constraints

Examples covered by automated tests include:

- age below 18 / above 100
- zero, negative, too-small, or too-large height/weight values
- numeric strings where actual numbers are required
- `NaN` / `Infinity`
- unsupported goals/activity levels
- target weight outside the planning BMI range
- a weight-loss target above current weight
- a weight-gain target below current weight
- exact age inconsistent with the initially selected age band
- completion with required answers missing

All displayed calculations are labeled as educational estimates and not medical advice.

## Tests

One-command unit/integration suite:

```bash
npm test
```

Full verification:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Coverage map:

| Area | Test |
| --- | --- |
| Health algorithm | `tests/assessment-engine.test.ts` |
| Extreme/invalid health input | `tests/assessment-validation.test.ts` |
| Session creation/ownership/recovery | `tests/session-service.integration.test.ts` |
| Exact profile incremental saves | `tests/health-answer.integration.test.ts` |
| Repeat/out-of-order/concurrent writes | `tests/session-service.integration.test.ts` |
| Completion/idempotency/result persistence | `tests/completion-service.integration.test.ts` |
| Preview field leakage / full access | `tests/result-access.integration.test.ts` |
| Mock payment transition/idempotency | `tests/payment-service.integration.test.ts` |
| Full browser funnel + interrupted recovery | `e2e/full-funnel.spec.ts` |

PostgreSQL integration test files execute serially because they share a single resettable CI database. The concurrency test itself still performs simultaneous writes inside one test, so optimistic-lock behavior is tested against real PostgreSQL concurrency rather than mocked persistence.

## CI

`.github/workflows/ci.yml` provisions PostgreSQL 16 and runs:

```text
npm ci
Prisma validate/generate/migrate
lint
typecheck
Vitest
Next.js build
Playwright Chromium install
full E2E
```

Failed Playwright runs upload the HTML report as a workflow artifact.

## Architecture boundaries

- `lib/assessment/engine.ts`: deterministic calculation only
- `lib/assessment/validation.ts`: profile validation and answer projection
- `lib/assessment/session-service.ts`: ownership, persistence, revisions, optimistic concurrency
- `lib/assessment/completion-service.ts`: completion transaction
- `lib/assessment/result-access.ts`: preview/full DTO construction
- `lib/payments/payment-service.ts`: mock billing/idempotency transaction
- `lib/auth/visitor.ts`: anonymous visitor identity
- Route handlers: HTTP parsing and response mapping; no health calculation logic
- React components: collection/presentation only; no BMI/calorie computation

## AI usage retrospective

AI was used to accelerate repository inspection, API/schema planning, test-case generation, implementation, and review. Changes were accepted only after automated verification against PostgreSQL and the Next.js build.

One AI suggestion was deliberately rejected: **a simple `upsert(sessionId, stepKey)` for progress persistence**. Upsert makes repeated submissions convenient, but by itself it does not prevent two stale clients from overwriting each other. The implementation instead combines answer upsert with a session-level optimistic `version` guard inside a database transaction and explicitly tests that two simultaneous writes using the same `expectedVersion` cannot both succeed.

Another issue discovered during verification was test isolation: multiple integration files originally reset the same PostgreSQL database concurrently, causing intermittent foreign-key failures. The test runner was changed to serialize database-sharing files while preserving intentional concurrency inside the concurrency test.

## Known limitations

- Visitor identity is anonymous cookie-based rather than an account login system.
- `/pay` is intentionally simulated and stores no real payment credentials.
- The health algorithm is deterministic educational logic, not a clinical model.
- Only flow `2117` is implemented.
- Public deployment configuration is environment-specific; PostgreSQL migrations must be applied before the first production request.

## Deployment / evaluator demo

The app is designed for Vercel plus a PostgreSQL provider such as Supabase. Configure `DATABASE_URL`, run `npm run db:deploy`, then deploy the Next.js app.

Public demo URL and a pre-paid evaluator `sessionId` should be recorded here after the production database/deployment is created:

```text
Demo URL: pending deployment
Paid demo sessionId: pending deployment
```
