# Health Assessment Funnel Backend Design

Date: 2026-09-12
Repository: `dreamer6680/betterme-pilates-replica`
Status: Approved design.

## Goal

Extend the existing BetterMe-inspired Pilates funnel into a production-style health assessment system demonstrating incremental persistence, resumable sessions, health calculations, subscription-gated results, simulated payment, automated tests, CI, and public deployment.

The current age-selection page and questionnaire should be preserved and evolved rather than rewritten wholesale.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- Vitest
- React Testing Library
- Playwright
- GitHub Actions
- Vercel
- Managed PostgreSQL such as Supabase or Neon

## Architecture

```text
Browser
  -> Next.js UI
      -> POST /api/v1/sessions
      -> GET /api/v1/sessions/:sessionId
      -> PATCH /api/v1/sessions/:sessionId/answers
      -> POST /api/v1/sessions/:sessionId/complete
      -> GET /api/v1/results/:sessionId
      -> POST /api/v1/pay
           -> application services
           -> Prisma
           -> PostgreSQL
```

Route handlers stay thin. Validation, persistence, assessment logic, access policy, and payment behavior live in framework-independent modules.

## Data Model

### Visitor
- `id UUID PK`
- `publicId UUID UNIQUE`
- `createdAt`
- `updatedAt`

An HTTP-only cookie stores the anonymous visitor identity.

### AssessmentSession
- `id UUID PK`
- `visitorId FK`
- `flow String`
- `ageRange String?`
- `currentStep Int`
- `status Enum(DRAFT, COMPLETED)`
- `version Int`
- `completedAt DateTime?`
- `createdAt`
- `updatedAt`

`version` provides optimistic concurrency control.

### AssessmentAnswer
- `id UUID PK`
- `sessionId FK`
- `stepKey String`
- `value Json`
- `revision Int`
- `createdAt`
- `updatedAt`
- unique `(sessionId, stepKey)`

### HealthProfile
- `id UUID PK`
- `sessionId UUID UNIQUE FK`
- `sex Enum(FEMALE, MALE, OTHER)`
- `age Int`
- `heightCm Decimal`
- `weightKg Decimal`
- `targetWeightKg Decimal`
- `activityLevel Enum(SEDENTARY, LIGHT, MODERATE, ACTIVE, VERY_ACTIVE)`
- `goal Enum(LOSE_WEIGHT, MAINTAIN, GAIN_WEIGHT, FITNESS)`
- timestamps

### AssessmentResult
- `id UUID PK`
- `sessionId UUID UNIQUE FK`
- `bmi Decimal`
- `bmiCategory String`
- `bmr Decimal`
- `tdee Decimal`
- `recommendedCalories Int`
- `weeklyChangeKg Decimal`
- `targetDate DateTime`
- `predictionCurve Json`
- `algorithmVersion String`
- timestamps

Results are persisted snapshots so algorithm changes do not silently mutate historical results.

### Subscription
- `id UUID PK`
- `visitorId UUID FK`
- `status Enum(INACTIVE, ACTIVE, EXPIRED)`
- `plan Enum(MONTHLY, QUARTERLY)`
- `startsAt DateTime?`
- `expiresAt DateTime?`
- timestamps

### PaymentEvent
- `id UUID PK`
- `eventId String UNIQUE`
- `visitorId UUID FK`
- `sessionId UUID FK`
- `idempotencyKey String UNIQUE`
- `type String`
- `status Enum(CREATED, SUCCEEDED, FAILED)`
- `payload Json`
- timestamps

## Identity and Ownership

On first entry the server creates a Visitor and sets an HTTP-only cookie. Every session/result/payment operation validates ownership using that visitor identity. A session ID by itself is not authorization.

## API

### `POST /api/v1/sessions`
Creates a persisted session from `flow` and `ageRange`. Returns `sessionId`, `status`, `currentStep`, `version`, and `nextUrl`.

### `GET /api/v1/sessions/:sessionId`
Returns the persisted session and answers for recovery. It rejects access to another visitor's session.

### `PATCH /api/v1/sessions/:sessionId/answers`
Request:

```json
{
  "stepKey": "activity-level",
  "answer": "light",
  "stepIndex": 7,
  "expectedVersion": 7
}
```

The answer upsert and session version increment are atomic. Concurrent writers using the same `expectedVersion` cause exactly one success; the stale writer receives `409 SESSION_VERSION_CONFLICT`.

Rules:
- duplicate step saves update the existing answer row
- editing an older step never regresses `currentStep`
- invalid step keys or answer shapes are rejected
- write and version increment occur in one transaction

### `POST /api/v1/sessions/:sessionId/complete`
Validates all required answers, projects them into `HealthProfile`, computes the versioned assessment result, persists profile/result, and marks the session completed. Repeated completion safely returns the existing result.

### `GET /api/v1/results/:sessionId`
Server-side access policy returns either a preview DTO or a full DTO.

Preview example:

```json
{
  "access": "preview",
  "result": {
    "bmi": 24.6,
    "bmiCategory": "normal",
    "targetDate": "2027-01-16T00:00:00.000Z"
  },
  "locked": ["predictionCurve", "recommendedCalories", "weeklyPlan"]
}
```

Paid response contains the protected fields. Preview and full serializers are separate so protected fields are never returned and merely hidden in CSS.

### `POST /api/v1/pay`
Uses `Idempotency-Key` and activates a simulated subscription transactionally. Repeating the same idempotency key returns the original outcome without duplicate events or subscriptions.

## Error Contract

All errors use:

```json
{
  "error": {
    "code": "INVALID_HEALTH_PROFILE",
    "message": "The submitted health profile is invalid.",
    "details": {}
  }
}
```

Representative statuses:
- 400 malformed request
- 401 missing visitor identity
- 403 ownership violation
- 404 missing session/result
- 409 optimistic concurrency conflict
- 422 domain validation/incomplete assessment
- 500 unexpected server error

## Validation

Zod validates request shape/types/enums/finite numbers. Domain rules validate meaningful ranges.

Initial product limits:
- age: 18-100
- height: 120-230 cm
- weight: 35-300 kg
- target weight: 35-300 kg

Reject numeric strings, `NaN`, `Infinity`, wrong composite types, unknown variants, and unreasonable target values. These are demo/product safety constraints, not medical diagnostic thresholds.

## Health Algorithm

### BMI
`weightKg / heightMeters^2`

### BMR
Use Mifflin-St Jeor for male/female. For `OTHER`, use the midpoint of the two equations and document this as a product simplification.

### Activity multipliers
- sedentary 1.2
- light 1.375
- moderate 1.55
- active 1.725
- very active 1.9

### TDEE
`BMR * activityMultiplier`

### Recommended calories
- lose weight: `TDEE - 300`
- maintain/fitness: `TDEE`
- gain weight: `TDEE + 250`

Use a centralized minimum intake floor and test it explicitly.

### Target date and curve
Use bounded weekly change:
- loss: max 0.75 kg/week
- gain: max 0.5 kg/week
- maintain: current date

Return `weeklyChangeKg`, `targetDate`, and a weekly prediction curve.

The calculation function never silently defaults missing inputs.

## Recovery and Ordering

The frontend persists each completed step. Loading `/onboarding?sessionId=...` rehydrates answers and resumes from server-side `currentStep`. Completed sessions redirect to results.

Editing an earlier step is allowed at the current version, but `currentStep` becomes `max(existingCurrentStep, stepIndex + 1)`. Completion still requires all mandatory answers.

## Frontend Flow

Preserve the current BetterMe-inspired visual language and evolve the existing questionnaire:

```text
Age selection
 -> Profile
 -> Goal
 -> Body parameters
 -> Lifestyle
 -> Activity
 -> Motivation/trust transition
 -> Analysis state
 -> Personal result preview
 -> Locked projection/plan
 -> Subscription offer
 -> Simulated payment
 -> Full result
```

UX rules:
- one primary decision per screen
- visible progress
- mobile-first
- background save feedback
- refresh recovery
- clear validation
- transparent simulated subscription terms
- no fake urgency/countdowns

## Access Policy

The server checks ACTIVE subscription state and validity windows. Frontend state is never authoritative for membership.

## Payment Semantics

`POST /api/v1/pay` transaction:
1. validate session ownership and completion
2. lookup `PaymentEvent` by idempotency key
3. return prior success when found
4. create CREATED event
5. upsert ACTIVE subscription
6. mark event SUCCEEDED
7. commit

A test-only failure injection may validate rollback behavior.

## Testing

### Unit
- BMI/BMR/TDEE representative calculations
- min/max accepted age, height, weight
- missing/zero/negative/extreme values
- NaN/Infinity
- unreasonable target weight
- gain/loss/maintain paths
- stable curve endpoints
- request validation types/enums/shapes

### Integration
- create/save/recover session
- duplicate save does not duplicate rows
- earlier-step edit does not regress progress
- incomplete completion rejected
- two writers with same expected version: one success, one conflict
- preview contains no protected key
- paid result contains full fields
- expired subscription returns preview
- payment activates subscription
- payment retry is idempotent
- ownership is enforced
- transaction failure rolls back

### Component
Extend existing questionnaire tests for hydration, save/retry UI, progress, result lock/unlock.

### E2E
Playwright covers entry -> age -> questionnaire -> refresh recovery -> completion -> preview -> simulated payment -> unlocked full result.

## CI and Test DB

Use a PostgreSQL service container in GitHub Actions, run Prisma migrations, then:

```text
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Do not replace integration coverage with SQLite because transaction and concurrency semantics are part of acceptance.

## Deployment

Deploy the Next.js application on Vercel with managed PostgreSQL. Document all variables in `.env.example`. No real secrets are committed.

The public demo must expose the complete funnel and `/api/v1/pay`, plus README cURL instructions and a deterministic way to obtain a paid demo session.

## README Deliverables

Document architecture, setup, env vars, migrations, Mermaid ER diagram, API reference, recovery/concurrency semantics, algorithm limitations, subscription access, `/pay` cURL, demo flow, tests, coverage matrix, CI, deployment, known limitations, and AI usage retrospective.

The retrospective will explicitly reject a naive `sessionId + stepKey` upsert-only approach because it handles retries but not concurrent lost updates; the accepted design adds session versions, optimistic concurrency, 409 conflicts, and integration tests.

## Security and Privacy

- HTTP-only anonymous visitor cookie
- server-side ownership checks
- server-side subscription checks
- protected fields omitted from unpaid responses
- server-side health validation
- Prisma parameterized queries
- avoid unnecessary PII
- no medical diagnosis claims

## Acceptance Criteria

1. New visitor receives a persisted assessment session.
2. Required steps save incrementally.
3. Refresh/reopen resumes server state.
4. Duplicate, out-of-order, and concurrent submissions are deterministic.
5. Valid completion persists profile and result.
6. Invalid/extreme inputs are rejected and tested.
7. Unpaid responses do not contain protected fields.
8. `/api/v1/pay` activates subscription idempotently.
9. The same result endpoint changes from preview to full after payment.
10. Unit, integration, component, and E2E tests cover core and abnormal paths.
11. Lint, typecheck, tests, build, and CI pass.
12. README contains required API/schema/tests/demo/deployment/AI documentation.
13. A public deployment supports the full evaluator flow.
