# BetterMe-Inspired Home Pilates Assessment

A full-stack Next.js take-home implementation inspired by the public BetterMe Home Pilates quiz funnel. It implements persisted anonymous assessment sessions, health calculations, preview/full result access, a simulated subscription payment, automated tests, and browser E2E coverage.

> Independent educational replica. It does not proxy private BetterMe APIs, process real payments, or provide medical advice.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Prisma ORM + PostgreSQL 16
- Docker Compose for PostgreSQL
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

## Quick start with Docker PostgreSQL

Requirements:

- Node.js 20.9+
- Docker with Docker Compose

Start PostgreSQL:

```bash
docker compose up -d
```

The Compose service starts `postgres:16-alpine` with:

```text
host: localhost
port: 5432
database: betterme
user: postgres
password: postgres
```

Create the application environment and initialize Prisma:

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Default development connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/betterme"
VISITOR_COOKIE_NAME="betterme_visitor"
NODE_ENV=development
```

Open:

```text
http://localhost:3000/first-page-brand-palette?flow=2117
```

Check the database container:

```bash
docker compose ps
docker compose logs postgres
```

Stop the database while preserving data:

```bash
docker compose down
```

Delete the local database volume and start clean:

```bash
docker compose down -v
docker compose up -d
npm run db:deploy
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
      uuid publicId UK
    }
    AssessmentSession {
      uuid id PK
      uuid visitorId FK
      string flow
      string ageRange
      int currentStep
      int version
      enum status
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
      decimal bmr
      decimal tdee
      int recommendedCalories
      datetime targetDate
      json predictionCurve
    }
    Subscription {
      uuid id PK
      uuid visitorId FK
      enum plan
      enum status
      datetime expiresAt
    }
    PaymentEvent {
      uuid id PK
      uuid visitorId FK
      uuid sessionId FK
      string idempotencyKey UK
      enum status
    }
```

## API overview

### Create an assessment session

The landing page uses the compatibility endpoint:

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

The versioned endpoint is also available:

```http
POST /api/v1/sessions
```

### Resume a session

```http
GET /api/v1/sessions/:sessionId
```

The returned server snapshot contains `currentStep`, `version`, `status`, and persisted answers, allowing recovery even after browser `sessionStorage` is cleared.

### Save exact health/profile data

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
- `age`: integer 18-100
- `heightCm`: 120-230
- `weightKg`: 35-300
- `targetWeightKg`: 35-300

### Save questionnaire progress

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

Answers are upserted by `(sessionId, stepKey)`, revisions increment, and `currentStep` never moves backward.

Every mutable save uses optimistic concurrency through `expectedVersion`. A stale write receives HTTP `409` with `SESSION_VERSION_CONFLICT`.

### Complete assessment

```http
POST /api/v1/sessions/:sessionId/complete
```

Completion requires sex, exact age, height, current weight, target weight, goal, and exercise frequency. The server validates the complete profile, calculates the health result, and persists the normalized profile/result in a transaction. Completion is idempotent.

### Read result

```http
GET /api/v1/results/:sessionId
```

Unpaid sessions receive a preview DTO. Protected values such as the real prediction curve and recommended calories are physically absent from the response. Active subscriptions receive the full persisted result.

## Mock payment endpoint

No real payment provider or card data is used.

```http
POST /api/v1/pay
Idempotency-Key: <unique-key>
Content-Type: application/json
```

Example:

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

Mock durations:

- `monthly`: 30 days
- `quarterly`: 90 days

Repeating a successful request with the same idempotency key for the same visitor/session does not create a duplicate purchase.

## Health algorithm

The calculation runs only on the server.

```text
BMI = weightKg / heightM²
base BMR = 10 * weightKg + 6.25 * heightCm - 5 * age
male BMR = base + 5
female BMR = base - 161
other BMR = midpoint(male, female)
TDEE = BMR * activityMultiplier
```

Recommended calories apply a deterministic bounded adjustment to TDEE. The prediction engine uses bounded weekly change rates and persists a versioned weekly curve and target date.

The result is an educational estimate, not clinical advice.

## Validation

Automated tests cover, among other cases:

- missing required profile data
- age outside 18-100
- invalid/extreme height and weight
- numeric strings where actual numbers are required
- `NaN` / `Infinity`
- invalid weight-loss/weight-gain target direction
- target weight outside the supported planning BMI range
- unsupported questionnaire answers
- exact age inconsistent with the selected age band
- repeated/out-of-order writes
- concurrent writes using the same session version
- preview/full result access
- payment idempotency

## Tests

Run the main suite:

```bash
npm test
```

Full local verification after PostgreSQL is running:

```bash
npm run db:deploy
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
| Completion/result persistence | `tests/completion-service.integration.test.ts` |
| Preview/full result access | `tests/result-access.integration.test.ts` |
| Mock payment transition/idempotency | `tests/payment-service.integration.test.ts` |
| Full browser funnel + interrupted recovery | `e2e/full-funnel.spec.ts` |

PostgreSQL integration test files execute serially because they share a resettable test database. The explicit concurrency test still performs simultaneous writes against PostgreSQL.

## CI

`.github/workflows/ci.yml` provisions PostgreSQL 16 as a GitHub Actions service and runs:

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

CI intentionally uses the GitHub Actions PostgreSQL service rather than Docker Compose. `docker-compose.yml` is the reproducible local/server database runtime configuration.

## Architecture boundaries

- `lib/assessment/engine.ts`: deterministic calculation
- `lib/assessment/validation.ts`: validation and answer projection
- `lib/assessment/session-service.ts`: ownership, persistence, revisions, optimistic concurrency
- `lib/assessment/completion-service.ts`: completion transaction
- `lib/assessment/result-access.ts`: preview/full DTOs
- `lib/payments/payment-service.ts`: mock billing/idempotency transaction
- `lib/auth/visitor.ts`: anonymous visitor identity
- route handlers: HTTP parsing/response mapping
- React components: collection/presentation; no health calculation logic

## AI usage retrospective

AI was used to accelerate repository inspection, API/schema planning, test-case generation, implementation, and review. Changes were accepted only after automated PostgreSQL and Next.js verification.

One AI suggestion was deliberately rejected: a simple `upsert(sessionId, stepKey)` persistence design. Upsert alone allows stale clients to overwrite each other, so the implementation adds a session-level optimistic `version` guard inside the same transaction and tests that simultaneous writes using one `expectedVersion` cannot both succeed.

A second verification issue involved database test isolation: multiple integration files initially reset one PostgreSQL database concurrently, causing intermittent foreign-key failures. Database-sharing test files are now serialized while intentional concurrency remains inside the concurrency test itself.

## Known limitations

- Visitor identity is anonymous cookie-based rather than account-based authentication.
- `/pay` is intentionally simulated.
- The health algorithm is deterministic educational logic, not a clinical model.
- Only flow `2117` is implemented.

## Deployment

The database is designed to run as PostgreSQL 16 in Docker. On a server with Docker installed:

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:generate
npm run db:deploy
npm run build
npm run start
```

For a remote application host, change `DATABASE_URL` to the reachable Docker/PostgreSQL host rather than committing credentials to the repository.

The database volume `betterme_postgres_data` persists PostgreSQL data across normal `docker compose down` / restart operations.

```text
Demo URL: pending deployment
Paid demo sessionId: pending deployment
```
