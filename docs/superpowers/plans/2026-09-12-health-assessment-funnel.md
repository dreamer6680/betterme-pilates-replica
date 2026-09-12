# Health Assessment Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing BetterMe-inspired Pilates questionnaire into a persisted, resumable health-assessment funnel with versioned health calculations, server-side subscription gating, idempotent mock payment, comprehensive tests, CI, and deployment documentation.

**Architecture:** Keep the existing Next.js 16 application as a monolith, but move backend behavior into focused framework-independent modules under `lib/`. Prisma/PostgreSQL owns persistence, Zod owns runtime request validation, route handlers translate HTTP to services, and result serializers enforce preview/full access on the server. Existing visual components and questionnaire definitions remain the base frontend and are extended with body-data steps and result/paywall screens.

**Tech Stack:** Next.js 16.3.4, React 19.2, TypeScript 5.9, Prisma, PostgreSQL, Zod, Vitest, React Testing Library, Playwright, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-12-health-assessment-backend-design.md`

## Global Constraints

- Keep Next.js `16.3.4`, React `19.2.0`, and TypeScript `^5.9.2` unless a dependency requires a compatible patch-only change.
- Read the repository `AGENTS.md` and relevant Next.js 16 docs under `node_modules/next/dist/docs/` before changing framework APIs.
- Preserve the existing BetterMe-inspired landing page and existing questionnaire behavior where it remains compatible.
- Persist assessment state in PostgreSQL; do not substitute SQLite for integration/concurrency tests.
- New public APIs live under `/api/v1`.
- All request validation happens server-side even when the UI also validates.
- Unpaid clients must never receive protected result fields.
- `/api/v1/pay` is a deterministic simulator, not a real payment integration.
- Health outputs are product/demo estimates, not medical diagnosis.
- Use TDD for domain and persistence behavior.
- Keep `npm test` as the one-command non-browser test entry point; add a separate `npm run test:e2e` for Playwright.

---

## File Structure

### New files

```text
prisma/schema.prisma
.env.example
lib/db/prisma.ts
lib/http/errors.ts
lib/auth/visitor.ts
lib/assessment/types.ts
lib/assessment/constants.ts
lib/assessment/validation.ts
lib/assessment/engine.ts
lib/assessment/session-service.ts
lib/assessment/completion-service.ts
lib/assessment/result-access.ts
lib/payments/payment-service.ts
app/api/v1/sessions/route.ts
app/api/v1/sessions/[sessionId]/route.ts
app/api/v1/sessions/[sessionId]/answers/route.ts
app/api/v1/sessions/[sessionId]/complete/route.ts
app/api/v1/results/[sessionId]/route.ts
app/api/v1/pay/route.ts
app/results/[sessionId]/page.tsx
components/HealthResult.tsx
components/health-result.module.css
tests/assessment-engine.test.ts
tests/assessment-validation.test.ts
tests/session-service.integration.test.ts
tests/completion-service.integration.test.ts
tests/result-access.integration.test.ts
tests/payment-service.integration.test.ts
tests/helpers/database.ts
playwright.config.ts
e2e/full-funnel.spec.ts
.github/workflows/ci.yml
```

### Existing files to modify

```text
package.json
package-lock.json
lib/onboarding.ts
components/OnboardingQuestionnaire.tsx
components/onboarding.module.css
components/PilatesLanding.tsx
app/onboarding/page.tsx
app/api/selections/route.ts
README.md
```

### Responsibility boundaries

- `lib/assessment/engine.ts`: pure deterministic calculations only.
- `lib/assessment/validation.ts`: Zod transport/domain schemas and answer-to-profile projection rules.
- `lib/assessment/session-service.ts`: create/resume/save session behavior and optimistic concurrency.
- `lib/assessment/completion-service.ts`: completion transaction and result snapshot creation.
- `lib/assessment/result-access.ts`: preview/full authorization and serializers.
- `lib/payments/payment-service.ts`: idempotent simulated payment transaction.
- `lib/auth/visitor.ts`: anonymous HTTP-only visitor identity helpers.
- Route handlers contain no calculation or persistence business rules.

---

### Task 1: Add PostgreSQL/Prisma foundation and test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`
- Create: `prisma/schema.prisma`
- Create: `lib/db/prisma.ts`
- Create: `tests/helpers/database.ts`

**Interfaces:**
- Produces: `prisma` singleton from `@/lib/db/prisma`.
- Produces: test helpers `resetDatabase(): Promise<void>` and `disconnectDatabase(): Promise<void>`.
- Produces Prisma models/enums used by all later tasks.

- [ ] **Step 1: Add required dependencies**

Run:

```bash
npm install @prisma/client zod
npm install -D prisma dotenv @playwright/test
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Create the Prisma schema**

Create `prisma/schema.prisma` with PostgreSQL datasource and these enums/models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AssessmentStatus {
  DRAFT
  COMPLETED
}

enum ProfileSex {
  FEMALE
  MALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY
  LIGHT
  MODERATE
  ACTIVE
  VERY_ACTIVE
}

enum HealthGoal {
  LOSE_WEIGHT
  MAINTAIN
  GAIN_WEIGHT
  FITNESS
}

enum SubscriptionStatus {
  INACTIVE
  ACTIVE
  EXPIRED
}

enum SubscriptionPlan {
  MONTHLY
  QUARTERLY
}

enum PaymentStatus {
  CREATED
  SUCCEEDED
  FAILED
}

model Visitor {
  id            String              @id @default(uuid()) @db.Uuid
  publicId      String              @unique @default(uuid()) @db.Uuid
  sessions      AssessmentSession[]
  subscriptions Subscription[]
  paymentEvents PaymentEvent[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
}

model AssessmentSession {
  id          String             @id @default(uuid()) @db.Uuid
  visitorId   String             @db.Uuid
  visitor     Visitor            @relation(fields: [visitorId], references: [id], onDelete: Cascade)
  flow        String
  ageRange    String?
  currentStep Int                @default(0)
  status      AssessmentStatus   @default(DRAFT)
  version     Int                @default(0)
  completedAt DateTime?
  answers     AssessmentAnswer[]
  profile     HealthProfile?
  result      AssessmentResult?
  payments    PaymentEvent[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([visitorId])
  @@index([visitorId, status])
}

model AssessmentAnswer {
  id        String            @id @default(uuid()) @db.Uuid
  sessionId String            @db.Uuid
  session   AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  stepKey   String
  value     Json
  revision  Int               @default(1)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@unique([sessionId, stepKey])
}

model HealthProfile {
  id             String            @id @default(uuid()) @db.Uuid
  sessionId      String            @unique @db.Uuid
  session        AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sex            ProfileSex
  age            Int
  heightCm       Decimal           @db.Decimal(6, 2)
  weightKg       Decimal           @db.Decimal(6, 2)
  targetWeightKg Decimal           @db.Decimal(6, 2)
  activityLevel  ActivityLevel
  goal           HealthGoal
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}

model AssessmentResult {
  id                  String            @id @default(uuid()) @db.Uuid
  sessionId           String            @unique @db.Uuid
  session             AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  bmi                 Decimal           @db.Decimal(6, 2)
  bmiCategory         String
  bmr                 Decimal           @db.Decimal(8, 2)
  tdee                Decimal           @db.Decimal(8, 2)
  recommendedCalories Int
  weeklyChangeKg      Decimal           @db.Decimal(5, 2)
  targetDate          DateTime
  predictionCurve     Json
  algorithmVersion    String
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}

model Subscription {
  id        String             @id @default(uuid()) @db.Uuid
  visitorId String             @db.Uuid
  visitor   Visitor            @relation(fields: [visitorId], references: [id], onDelete: Cascade)
  status    SubscriptionStatus @default(INACTIVE)
  plan      SubscriptionPlan   @default(MONTHLY)
  startsAt  DateTime?
  expiresAt DateTime?
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  @@index([visitorId, status])
}

model PaymentEvent {
  id             String            @id @default(uuid()) @db.Uuid
  eventId        String            @unique @default(uuid()) @db.Uuid
  visitorId      String            @db.Uuid
  visitor        Visitor           @relation(fields: [visitorId], references: [id], onDelete: Cascade)
  sessionId      String            @db.Uuid
  session        AssessmentSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  idempotencyKey String            @unique
  type           String
  status         PaymentStatus
  payload        Json
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([visitorId])
  @@index([sessionId])
}
```

- [ ] **Step 3: Add environment documentation**

Create `.env.example`:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/betterme
VISITOR_COOKIE_NAME=betterme_visitor
NODE_ENV=development
```

- [ ] **Step 4: Add the Prisma singleton**

Create `lib/db/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Add integration cleanup helpers**

Create `tests/helpers/database.ts`:

```ts
import { prisma } from "@/lib/db/prisma";

export async function resetDatabase() {
  await prisma.$transaction([
    prisma.paymentEvent.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.assessmentResult.deleteMany(),
    prisma.healthProfile.deleteMany(),
    prisma.assessmentAnswer.deleteMany(),
    prisma.assessmentSession.deleteMany(),
    prisma.visitor.deleteMany(),
  ]);
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
```

- [ ] **Step 6: Generate and migrate**

Run:

```bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name init_health_assessment
```

Expected: Prisma client generation succeeds and PostgreSQL receives the initial schema.

- [ ] **Step 7: Verify existing checks still compile**

Run:

```bash
npm run typecheck
npm test
```

Expected: existing tests remain green before backend behavior changes.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json prisma .env.example lib/db tests/helpers
git commit -m "feat: add postgres assessment data model"
```

---

### Task 2: Implement validated health calculation engine

**Files:**
- Create: `lib/assessment/types.ts`
- Create: `lib/assessment/constants.ts`
- Create: `lib/assessment/validation.ts`
- Create: `lib/assessment/engine.ts`
- Create: `tests/assessment-validation.test.ts`
- Create: `tests/assessment-engine.test.ts`

**Interfaces:**
- Produces: `HealthProfileInput`.
- Produces: `AssessmentComputation`.
- Produces: `healthProfileSchema`.
- Produces: `calculateAssessment(input: HealthProfileInput, now?: Date): AssessmentComputation`.

- [ ] **Step 1: Define stable domain types**

Create `lib/assessment/types.ts`:

```ts
export type ProfileSex = "FEMALE" | "MALE" | "OTHER";
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";
export type HealthGoal = "LOSE_WEIGHT" | "MAINTAIN" | "GAIN_WEIGHT" | "FITNESS";

export type HealthProfileInput = {
  sex: ProfileSex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
};

export type PredictionPoint = {
  week: number;
  date: string;
  weightKg: number;
};

export type AssessmentComputation = {
  bmi: number;
  bmiCategory: "underweight" | "normal" | "overweight" | "obesity";
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  weeklyChangeKg: number;
  targetDate: Date;
  predictionCurve: PredictionPoint[];
  algorithmVersion: "1.0.0";
};
```

- [ ] **Step 2: Write failing validation tests**

Create table-driven tests in `tests/assessment-validation.test.ts` for:

```ts
const invalidProfiles = [
  { field: "age", value: 17 },
  { field: "age", value: 101 },
  { field: "heightCm", value: 0 },
  { field: "heightCm", value: 119 },
  { field: "heightCm", value: 231 },
  { field: "weightKg", value: -1 },
  { field: "weightKg", value: 34 },
  { field: "weightKg", value: 301 },
  { field: "targetWeightKg", value: 34 },
  { field: "targetWeightKg", value: 301 },
  { field: "heightCm", value: "170" },
  { field: "weightKg", value: Number.NaN },
  { field: "weightKg", value: Number.POSITIVE_INFINITY },
];
```

Verify each returns `success === false` from `healthProfileSchema.safeParse()`.

- [ ] **Step 3: Implement constants and Zod schema**

Create `lib/assessment/constants.ts`:

```ts
export const ALGORITHM_VERSION = "1.0.0" as const;
export const MIN_RECOMMENDED_CALORIES = 1200;
export const ACTIVITY_MULTIPLIER = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
} as const;
```

Create `lib/assessment/validation.ts` with strict finite-number Zod schemas:

```ts
import { z } from "zod";

const finiteNumber = z.number().finite();

export const healthProfileSchema = z
  .object({
    sex: z.enum(["FEMALE", "MALE", "OTHER"]),
    age: finiteNumber.int().min(18).max(100),
    heightCm: finiteNumber.min(120).max(230),
    weightKg: finiteNumber.min(35).max(300),
    targetWeightKg: finiteNumber.min(35).max(300),
    activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
    goal: z.enum(["LOSE_WEIGHT", "MAINTAIN", "GAIN_WEIGHT", "FITNESS"]),
  })
  .strict()
  .superRefine((value, ctx) => {
    const targetBmi = value.targetWeightKg / Math.pow(value.heightCm / 100, 2);
    if (targetBmi < 16 || targetBmi > 45) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetWeightKg"],
        message: "Target weight is outside the supported planning range.",
      });
    }
    if (value.goal === "LOSE_WEIGHT" && value.targetWeightKg >= value.weightKg) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["targetWeightKg"], message: "Weight-loss target must be below current weight." });
    }
    if (value.goal === "GAIN_WEIGHT" && value.targetWeightKg <= value.weightKg) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["targetWeightKg"], message: "Weight-gain target must be above current weight." });
    }
  });
```

- [ ] **Step 4: Run validation tests**

Run:

```bash
npm test -- tests/assessment-validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing engine tests**

Cover exact representative values using a fixed `now` date. Example:

```ts
it("calculates a stable female weight-loss assessment", () => {
  const result = calculateAssessment(
    {
      sex: "FEMALE",
      age: 30,
      heightCm: 165,
      weightKg: 70,
      targetWeightKg: 62,
      activityLevel: "LIGHT",
      goal: "LOSE_WEIGHT",
    },
    new Date("2026-09-12T00:00:00.000Z"),
  );

  expect(result.bmi).toBeCloseTo(25.71, 2);
  expect(result.bmiCategory).toBe("overweight");
  expect(result.algorithmVersion).toBe("1.0.0");
  expect(result.recommendedCalories).toBeGreaterThanOrEqual(1200);
  expect(result.predictionCurve.at(0)?.weightKg).toBe(70);
  expect(result.predictionCurve.at(-1)?.weightKg).toBe(62);
});
```

Also test male, OTHER midpoint, maintain, gain, minimum calorie floor, and curve endpoint stability.

- [ ] **Step 6: Implement the pure engine**

In `lib/assessment/engine.ts`:

```ts
export function calculateAssessment(input: HealthProfileInput, now = new Date()): AssessmentComputation {
  const parsed = healthProfileSchema.parse(input);
  const heightM = parsed.heightCm / 100;
  const bmi = parsed.weightKg / (heightM * heightM);

  const base = 10 * parsed.weightKg + 6.25 * parsed.heightCm - 5 * parsed.age;
  const maleBmr = base + 5;
  const femaleBmr = base - 161;
  const bmr = parsed.sex === "MALE" ? maleBmr : parsed.sex === "FEMALE" ? femaleBmr : (maleBmr + femaleBmr) / 2;
  const tdee = bmr * ACTIVITY_MULTIPLIER[parsed.activityLevel];

  const adjustment = parsed.goal === "LOSE_WEIGHT" ? -300 : parsed.goal === "GAIN_WEIGHT" ? 250 : 0;
  const recommendedCalories = Math.max(MIN_RECOMMENDED_CALORIES, Math.round(tdee + adjustment));

  const requestedDelta = parsed.targetWeightKg - parsed.weightKg;
  const weeklyMagnitude = requestedDelta < 0 ? 0.75 : requestedDelta > 0 ? 0.5 : 0;
  const weeklyChangeKg = requestedDelta === 0 ? 0 : Math.sign(requestedDelta) * weeklyMagnitude;
  const weeks = weeklyMagnitude === 0 ? 0 : Math.ceil(Math.abs(requestedDelta) / weeklyMagnitude);

  // Build points from week 0 through final week, clamping the final point to targetWeightKg.
  // targetDate is the date of the final point.
  // Round displayed numeric outputs to two decimals through a local round2 helper.
}
```

Implement `bmiCategory` using `<18.5`, `<25`, `<30`, otherwise obesity. Implement weekly points with immutable ISO dates and exact target clamping on the final point.

- [ ] **Step 7: Run engine + validation tests**

```bash
npm test -- tests/assessment-validation.test.ts tests/assessment-engine.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/assessment tests/assessment-*.test.ts
git commit -m "feat: add versioned health assessment engine"
```

---

### Task 3: Implement visitor identity and persisted session creation/recovery

**Files:**
- Create: `lib/http/errors.ts`
- Create: `lib/auth/visitor.ts`
- Create: `lib/assessment/session-service.ts`
- Create: `app/api/v1/sessions/route.ts`
- Create: `app/api/v1/sessions/[sessionId]/route.ts`
- Create: `tests/session-service.integration.test.ts`
- Modify: `app/api/selections/route.ts`
- Modify: `components/PilatesLanding.tsx`

**Interfaces:**
- Produces: `getOrCreateVisitor()` for route handlers.
- Produces: `createAssessmentSession(visitorId, input)`.
- Produces: `getAssessmentSession(visitorId, sessionId)`.
- Later tasks consume `AssessmentSessionSnapshot` containing `id`, `flow`, `ageRange`, `currentStep`, `version`, `status`, and normalized answers.

- [ ] **Step 1: Write failing session persistence tests**

Test against PostgreSQL:

```ts
it("creates and resumes an owned assessment session", async () => {
  const visitor = await prisma.visitor.create({ data: {} });
  const created = await createAssessmentSession(visitor.id, { flow: "2117", ageRange: "18-29" });
  const resumed = await getAssessmentSession(visitor.id, created.id);

  expect(resumed.id).toBe(created.id);
  expect(resumed.currentStep).toBe(0);
  expect(resumed.version).toBe(0);
  expect(resumed.answers).toEqual({});
});
```

Also verify another visitor cannot read the session.

- [ ] **Step 2: Implement typed application errors**

Create `lib/http/errors.ts`:

```ts
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json({ error: { code: error.code, message: error.message, details: error.details } }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." } }, { status: 500 });
}
```

- [ ] **Step 3: Implement visitor cookie helper**

Use Next.js 16 request cookie APIs according to repository-local docs. Behavior:

```ts
export const VISITOR_COOKIE_NAME = process.env.VISITOR_COOKIE_NAME ?? "betterme_visitor";

export async function getOrCreateVisitor(): Promise<{ visitorId: string; publicId: string }> {
  // Read HTTP-only cookie.
  // Lookup Visitor.publicId.
  // If missing/unknown, create Visitor and set secure sameSite=lax cookie.
  // Return database id + public id.
}
```

Use `secure: process.env.NODE_ENV === "production"`, `httpOnly: true`, `sameSite: "lax"`, `path: "/"`.

- [ ] **Step 4: Implement session service**

Use strict Zod create-session input:

```ts
const createSessionSchema = z.object({
  flow: z.literal("2117"),
  ageRange: z.enum(["18-29", "30-39", "40-49", "50+"]),
}).strict();
```

`createAssessmentSession` creates a DRAFT row. `getAssessmentSession` queries with both `id` and `visitorId`, includes answers, and throws `AppError(404, "SESSION_NOT_FOUND", ...)` when not found.

- [ ] **Step 5: Run integration tests**

```bash
npm test -- tests/session-service.integration.test.ts
```

Expected: create/resume/ownership tests PASS.

- [ ] **Step 6: Implement API routes**

`POST /api/v1/sessions`:
- get/create visitor
- parse JSON
- create session
- return 201 with `/onboarding?sessionId=<id>`

`GET /api/v1/sessions/[sessionId]`:
- get/create visitor
- load owned session
- return snapshot

Route handlers wrap service calls with `errorResponse`.

- [ ] **Step 7: Change landing selection to persisted session creation**

Update `components/PilatesLanding.tsx` so age selection uses `POST /api/v1/sessions` and navigates to returned `nextUrl`.

Keep `/api/selections` temporarily as a backward-compatible local endpoint only if existing tests require it; otherwise migrate its tests and remove its UI use.

- [ ] **Step 8: Run focused component/tests**

```bash
npm test -- tests/age-card.test.tsx tests/selection.test.ts tests/session-service.integration.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/http lib/auth lib/assessment/session-service.ts app/api/v1 components/PilatesLanding.tsx app/api/selections tests/session-service.integration.test.ts
git commit -m "feat: persist assessment sessions"
```

---

### Task 4: Add incremental answer saves with optimistic concurrency

**Files:**
- Modify: `lib/assessment/session-service.ts`
- Modify: `lib/onboarding.ts`
- Create: `app/api/v1/sessions/[sessionId]/answers/route.ts`
- Modify: `tests/session-service.integration.test.ts`
- Modify: `components/OnboardingQuestionnaire.tsx`
- Modify: `app/onboarding/page.tsx`

**Interfaces:**
- Produces: `saveAssessmentAnswer(visitorId, sessionId, input): Promise<AssessmentSessionSnapshot>`.
- Input: `{ stepKey: string; answer: unknown; stepIndex: number; expectedVersion: number }`.
- Conflict contract: `AppError(409, "SESSION_VERSION_CONFLICT", ..., { currentVersion })`.

- [ ] **Step 1: Add failing duplicate/out-of-order/concurrency tests**

Add tests:

```ts
it("updates the same step without creating duplicates", async () => { /* save same step twice with successive versions; assert one row */ });

it("editing an older step does not regress currentStep", async () => { /* advance to step 7, edit step 2, expect currentStep still 7+ */ });

it("allows exactly one concurrent writer for the same expected version", async () => {
  const [a, b] = await Promise.allSettled([
    saveAssessmentAnswer(visitor.id, session.id, firstPayload),
    saveAssessmentAnswer(visitor.id, session.id, secondPayload),
  ]);
  expect([a, b].filter((x) => x.status === "fulfilled")).toHaveLength(1);
  expect([a, b].filter((x) => x.status === "rejected")).toHaveLength(1);
});
```

- [ ] **Step 2: Define answer validation mapping**

Extend `lib/onboarding.ts` with explicit data-bearing steps needed by the assignment before generation/results:

```ts
export type DataInputStep = BaseStep & {
  kind: "number";
  field: "age" | "heightCm" | "weightKg" | "targetWeightKg";
  unit: "years" | "cm" | "kg";
  min: number;
  max: number;
  primaryLabel: string;
};
```

Add steps for exact age, height, current weight, and target weight. Add a sex/gender choice if not already captured. Keep the existing age-range landing choice as segmentation, not as the exact age used by the algorithm.

Add a helper:

```ts
export function validateAnswerForStep(stepKey: string, answer: unknown): AnswerValue | number {
  // Choice steps: require configured option(s).
  // Number steps: require finite number within the configured min/max.
  // Non-answer info/generation/results steps are rejected.
}
```

- [ ] **Step 3: Implement optimistic transaction**

`saveAssessmentAnswer` must:

1. parse request with Zod
2. verify session ownership/status
3. validate answer against step definition
4. execute a Prisma transaction
5. update session with `where: { id, visitorId, version: expectedVersion, status: DRAFT }`
6. detect stale version when updated-row count is zero
7. upsert `AssessmentAnswer` on `(sessionId, stepKey)` and increment `revision`
8. set `currentStep = Math.max(existingCurrentStep, stepIndex + 1)`
9. increment version once

If Prisma cannot express the version guard and answer upsert safely in one interactive transaction using `updateMany`, use an interactive `$transaction(async tx => ...)` with `updateMany` first and then answer upsert. Do not read version and then write without a guarded update.

- [ ] **Step 4: Run concurrency integration tests**

```bash
npm test -- tests/session-service.integration.test.ts
```

Expected: duplicate/out-of-order/concurrency tests PASS repeatedly.

- [ ] **Step 5: Add the PATCH route**

Implement `app/api/v1/sessions/[sessionId]/answers/route.ts` to parse JSON, get visitor, invoke `saveAssessmentAnswer`, and return `saved`, `currentStep`, and `version`.

- [ ] **Step 6: Hydrate and persist questionnaire UI**

Refactor `OnboardingQuestionnaire` props around server state:

```ts
type Props = {
  sessionId: string;
  initialStepIndex: number;
  initialAnswers: AnswerMap;
  initialVersion: number;
};
```

On each answer:
- save to `/api/v1/sessions/${sessionId}/answers`
- send current `version`
- update local version from response
- only advance after successful save
- on 409, reload session snapshot and reconcile UI
- display retryable save error without dropping the chosen answer

`app/onboarding/page.tsx` reads `sessionId`, loads the owned session server-side or through a server-safe service, and supplies initial state.

- [ ] **Step 7: Extend component tests**

Update questionnaire tests to cover:
- hydration from saved answer/current step
- save success advances
- save failure displays error and remains on step
- 409 reload/recovery path
- numeric field validation

- [ ] **Step 8: Run questionnaire verification**

```bash
npm test -- tests/onboarding.test.ts tests/onboarding-questionnaire.test.tsx tests/session-service.integration.test.ts
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add lib/onboarding.ts lib/assessment/session-service.ts app/api/v1/sessions components/OnboardingQuestionnaire.tsx app/onboarding tests
git commit -m "feat: persist questionnaire progress safely"
```

---

### Task 5: Complete assessments and persist health results

**Files:**
- Modify: `lib/assessment/validation.ts`
- Create: `lib/assessment/completion-service.ts`
- Create: `app/api/v1/sessions/[sessionId]/complete/route.ts`
- Create: `tests/completion-service.integration.test.ts`
- Modify: `components/OnboardingQuestionnaire.tsx`

**Interfaces:**
- Produces: `projectAnswersToHealthProfile(answers, ageRange): HealthProfileInput`.
- Produces: `completeAssessment(visitorId, sessionId, now?): Promise<{ sessionId: string; resultId: string }>`.

- [ ] **Step 1: Write failing projection/completion tests**

Test:
- valid full answer set creates exactly one `HealthProfile` and `AssessmentResult`
- incomplete required answers -> 422 `ASSESSMENT_INCOMPLETE`
- invalid profile -> 422 `INVALID_HEALTH_PROFILE`
- repeated completion returns existing result and does not duplicate rows
- another visitor cannot complete the session

- [ ] **Step 2: Implement answer-to-profile projection**

Map questionnaire semantics explicitly:

```ts
const goalMap = {
  "lose-weight": "LOSE_WEIGHT",
  "get-toned": "FITNESS",
  "improve-posture": "FITNESS",
  "feel-stronger": "FITNESS",
} as const;

const frequencyMap = {
  never: "SEDENTARY",
  "several-month": "LIGHT",
  "several-week": "MODERATE",
  "almost-daily": "ACTIVE",
} as const;
```

Use the exact numeric steps for `age`, `heightCm`, `weightKg`, `targetWeightKg`, and the configured sex/gender step. Throw `ASSESSMENT_INCOMPLETE` for any required missing answer; then validate the resulting object using `healthProfileSchema`.

- [ ] **Step 3: Implement completion transaction**

`completeAssessment`:

```ts
return prisma.$transaction(async (tx) => {
  const session = await tx.assessmentSession.findFirst({
    where: { id: sessionId, visitorId },
    include: { answers: true, profile: true, result: true },
  });

  if (!session) throw new AppError(404, "SESSION_NOT_FOUND", "Assessment session was not found.");
  if (session.result) return { sessionId, resultId: session.result.id };

  const profileInput = projectAnswersToHealthProfile(/* ... */);
  const computed = calculateAssessment(profileInput, now);

  const profile = await tx.healthProfile.create({ data: /* exact profile fields */ });
  const result = await tx.assessmentResult.create({ data: /* computed snapshot */ });
  await tx.assessmentSession.update({ data: { status: "COMPLETED", completedAt: now }, where: { id: sessionId } });

  return { sessionId, resultId: result.id };
});
```

Serialize `predictionCurve` to Prisma JSON-compatible objects.

- [ ] **Step 4: Run completion tests**

```bash
npm test -- tests/completion-service.integration.test.ts tests/assessment-engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add completion API route**

`POST /api/v1/sessions/[sessionId]/complete` gets current visitor, completes assessment, returns:

```json
{
  "sessionId": "...",
  "status": "COMPLETED",
  "resultUrl": "/results/..."
}
```

- [ ] **Step 6: Wire generation step to completion**

At the end of questionnaire generation, call the completion endpoint. On success navigate to `resultUrl`. Do not calculate BMI/calories in the browser.

- [ ] **Step 7: Run focused verification**

```bash
npm test -- tests/completion-service.integration.test.ts tests/onboarding-questionnaire.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/assessment app/api/v1/sessions components/OnboardingQuestionnaire.tsx tests/completion-service.integration.test.ts
git commit -m "feat: persist completed health assessments"
```

---

### Task 6: Enforce preview/full result access and simulated payment

**Files:**
- Create: `lib/assessment/result-access.ts`
- Create: `lib/payments/payment-service.ts`
- Create: `app/api/v1/results/[sessionId]/route.ts`
- Create: `app/api/v1/pay/route.ts`
- Create: `tests/result-access.integration.test.ts`
- Create: `tests/payment-service.integration.test.ts`

**Interfaces:**
- Produces: `getResultForVisitor(visitorId, sessionId, now?)` returning discriminated `PreviewResultResponse | FullResultResponse`.
- Produces: `simulatePayment(visitorId, input, idempotencyKey, now?)`.

- [ ] **Step 1: Write failing access tests**

Explicitly assert absence of protected keys:

```ts
expect(preview.access).toBe("preview");
expect(preview.result).not.toHaveProperty("predictionCurve");
expect(preview.result).not.toHaveProperty("recommendedCalories");
expect(preview.result).not.toHaveProperty("bmr");
expect(preview.result).not.toHaveProperty("tdee");
```

Then create ACTIVE subscription and assert full keys exist. Create expired subscription and assert preview again.

- [ ] **Step 2: Implement distinct DTO serializers**

In `result-access.ts` define:

```ts
export type PreviewResultResponse = {
  access: "preview";
  result: { bmi: number; bmiCategory: string; targetDate: string };
  locked: ["predictionCurve", "recommendedCalories", "weeklyPlan"];
};

export type FullResultResponse = {
  access: "full";
  result: {
    bmi: number;
    bmiCategory: string;
    bmr: number;
    tdee: number;
    recommendedCalories: number;
    weeklyChangeKg: number;
    targetDate: string;
    predictionCurve: PredictionPoint[];
  };
};
```

Load owned completed session/result and subscription state. Build preview using only preview fields. Build full response only after access succeeds.

- [ ] **Step 3: Run access tests**

```bash
npm test -- tests/result-access.integration.test.ts
```

Expected: PASS.

- [ ] **Step 4: Write failing payment tests**

Cover:
- completed owned session activates subscription
- missing/blank idempotency key rejected
- repeating same key creates exactly one `PaymentEvent`
- another visitor cannot pay for the session
- incomplete session cannot be paid
- test-injected transaction failure leaves no ACTIVE subscription

- [ ] **Step 5: Implement payment service**

Input schema:

```ts
z.object({
  sessionId: z.string().uuid(),
  plan: z.enum(["monthly", "quarterly"]),
}).strict();
```

Inside one Prisma transaction:
- verify owned completed session
- lookup event by idempotency key
- if SUCCEEDED, return stable prior success
- create `CREATED` event
- expire/replace or update existing active subscription deterministically
- create/upsert ACTIVE subscription with `startsAt = now` and plan-derived `expiresAt`
- mark event `SUCCEEDED`

Use 30 days for monthly and 90 days for quarterly in the simulator and document that this is mock billing behavior.

- [ ] **Step 6: Run payment tests**

```bash
npm test -- tests/payment-service.integration.test.ts tests/result-access.integration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Add result and pay routes**

`GET /api/v1/results/[sessionId]` -> `getResultForVisitor`.

`POST /api/v1/pay`:
- require non-empty `Idempotency-Key`
- get visitor identity
- parse JSON
- invoke `simulatePayment`
- return `paymentStatus`, `subscriptionStatus`, `sessionId`

- [ ] **Step 8: Commit**

```bash
git add lib/assessment/result-access.ts lib/payments app/api/v1/results app/api/v1/pay tests/result-access.integration.test.ts tests/payment-service.integration.test.ts
git commit -m "feat: gate results behind mock subscription"
```

---

### Task 7: Build result preview, paywall, and unlocked result UI

**Files:**
- Create: `app/results/[sessionId]/page.tsx`
- Create: `components/HealthResult.tsx`
- Create: `components/health-result.module.css`
- Modify: `components/onboarding.module.css`
- Modify: `tests/onboarding-questionnaire.test.tsx`
- Add: `tests/health-result.test.tsx`

**Interfaces:**
- `HealthResult` consumes the API response discriminated by `access`.
- Payment action posts to `/api/v1/pay`, then refetches `/api/v1/results/:sessionId`.

- [ ] **Step 1: Write failing result component tests**

Preview assertions:
- BMI and target date visible
- prediction graph rendered as locked placeholder, not real points
- CTA `Unlock my plan` visible
- no calorie/BMR/TDEE value text appears

Full assertions:
- recommended calories visible
- target curve points represented in accessible markup
- unlock CTA absent

- [ ] **Step 2: Implement server result page**

`app/results/[sessionId]/page.tsx` loads the owned result through the same access service used by the API and renders `HealthResult` with initial data.

Use `notFound()` for missing owned sessions/results only after following Next.js 16 repository-local guidance.

- [ ] **Step 3: Implement `HealthResult`**

Client behavior:

```ts
async function unlock() {
  const idempotencyKey = crypto.randomUUID();
  const payment = await fetch("/api/v1/pay", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ sessionId, plan: selectedPlan }),
  });
  if (!payment.ok) throw new Error("payment failed");
  const refreshed = await fetch(`/api/v1/results/${sessionId}`);
  setData(await refreshed.json());
}
```

Store the generated idempotency key for the duration of a retry attempt so retrying after an uncertain response reuses the same key rather than creating a new payment event.

- [ ] **Step 4: Add trustworthy visual hierarchy**

Create a BetterMe-inspired result layout using original implementation/CSS:
- plan-ready header
- BMI summary
- current vs target weight card
- target date
- preview projection panel with lock overlay for unpaid users
- subscription plan selector
- explicit `Simulated payment — no real charge` copy
- unlocked projection/calorie summary for paid users

Do not copy proprietary source code or gated assets.

- [ ] **Step 5: Run component verification**

```bash
npm test -- tests/health-result.test.tsx tests/onboarding-questionnaire.test.tsx
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/results components tests/health-result.test.tsx
git commit -m "feat: add subscription-gated result experience"
```

---

### Task 8: Add full browser E2E and CI

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/full-funnel.spec.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- E2E exercises the real app and PostgreSQL-backed APIs.
- CI provisions PostgreSQL and runs migration + all verification commands.

- [ ] **Step 1: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 2: Write the full-funnel E2E**

The browser test must:

```ts
test("recovers progress and unlocks the full assessment after mock payment", async ({ page }) => {
  await page.goto("/first-page-brand-palette?flow=2117");
  await page.getByRole("button", { name: /18.?29/ }).click();
  await expect(page).toHaveURL(/\/onboarding\?sessionId=/);

  // Complete enough initial questions to move beyond the first data-bearing step.
  // Capture the current question title.
  await page.reload();
  // Assert recovery returns to the same/next persisted step rather than step zero.

  // Complete required sex, age, height, weight, target weight, activity, goal fields and remaining required UI steps.
  await expect(page).toHaveURL(/\/results\//);
  await expect(page.getByText(/unlock my plan/i)).toBeVisible();
  await expect(page.getByText(/recommended calories/i)).not.toBeVisible();

  await page.getByRole("button", { name: /unlock my plan/i }).click();
  await expect(page.getByText(/recommended calories/i)).toBeVisible();
});
```

Use semantic selectors matching final UI labels; do not use arbitrary timeouts.

- [ ] **Step 3: Run E2E locally against PostgreSQL**

```bash
npx playwright install chromium
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 4: Create GitHub Actions workflow**

`.github/workflows/ci.yml` should define a PostgreSQL 16 service with health checks and env:

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/betterme_test
  VISITOR_COOKIE_NAME: betterme_visitor
```

Steps:

```text
checkout
setup-node 20
npm ci
npx prisma generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

- [ ] **Step 5: Run the complete local verification serially**

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: all PASS. Run build serially rather than concurrently with other Next.js commands.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e .github/workflows/ci.yml package.json package-lock.json
git commit -m "test: add full funnel e2e and ci"
```

---

### Task 9: Rewrite README and deployment/demo documentation

**Files:**
- Modify: `README.md`
- Optional create: `docs/architecture.md` only if README readability requires moving detailed internals out while retaining evaluator-facing essentials in README.

**Interfaces:**
- README is the evaluator entry point and must document exactly how to run and verify the system.

- [ ] **Step 1: Replace stale local-only architecture claims**

Remove statements saying there is no database/auth/subscription/questionnaire. Document the actual PostgreSQL-backed implementation.

- [ ] **Step 2: Add Mermaid ER diagram**

Include:

```mermaid
erDiagram
  Visitor ||--o{ AssessmentSession : owns
  Visitor ||--o{ Subscription : has
  Visitor ||--o{ PaymentEvent : creates
  AssessmentSession ||--o{ AssessmentAnswer : contains
  AssessmentSession ||--|| HealthProfile : normalizes
  AssessmentSession ||--|| AssessmentResult : produces
  AssessmentSession ||--o{ PaymentEvent : unlocks
```

- [ ] **Step 3: Document local setup and migrations**

README commands:

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Explain PostgreSQL requirement and `DATABASE_URL`.

- [ ] **Step 4: Document API contracts and cURL**

Include session create/save/resume/complete/result examples and exact `/pay` example:

```bash
curl -X POST http://localhost:3000/api/v1/pay \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: evaluator-payment-001' \
  -d '{"sessionId":"<SESSION_ID>","plan":"monthly"}'
```

- [ ] **Step 5: Document testing matrix**

Map assignment requirements to tests:

```text
health algorithm -> tests/assessment-engine.test.ts
invalid/extreme inputs -> tests/assessment-validation.test.ts
save/recovery/order/concurrency -> tests/session-service.integration.test.ts
masked/full access -> tests/result-access.integration.test.ts
pay transition/idempotency -> tests/payment-service.integration.test.ts
complete browser flow -> e2e/full-funnel.spec.ts
```

- [ ] **Step 6: Document demo and deployment**

Add fields:

```text
Public demo: <deployed Vercel URL once available>
Paid demo session: obtain by completing the funnel and calling /api/v1/pay, or use documented seed command if added.
```

Do not invent a deployed URL or paid session ID before they exist. Until deployment is actually complete, mark them clearly as deployment prerequisites in the implementation branch rather than claiming success.

- [ ] **Step 7: Add AI usage retrospective**

Include the concrete rejected suggestion:

```text
Rejected AI suggestion: a simple `(sessionId, stepKey)` upsert-only persistence strategy.
Reason: it makes request retries idempotent but cannot detect two clients updating from the same stale session state, allowing lost updates.
Adopted approach: session `version` + guarded update + `409 SESSION_VERSION_CONFLICT`, backed by concurrent integration tests.
```

Also summarize where AI accelerated implementation and where tests/verification overrode suggestions.

- [ ] **Step 8: Final self-review against assignment**

Check README contains:
- startup
- DB/migrations
- architecture
- API
- `/pay` cURL
- ER diagram
- algorithm explanation/limitations
- persistence/recovery/concurrency
- subscription access behavior
- test matrix
- CI
- deployment/demo guidance
- AI retrospective
- known gaps

- [ ] **Step 9: Run final verification again**

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add README.md docs
git commit -m "docs: document complete assessment system"
```

---

## Self-Review

### Spec coverage

- PostgreSQL persistence: Tasks 1, 3, 4, 5.
- Incremental saves/recovery: Tasks 3-4.
- Duplicate/out-of-order/concurrent writes: Task 4.
- BMI/calories/target date: Task 2.
- Persisted result snapshot: Task 5.
- Subscription-gated server response: Task 6.
- Mock `/pay` transition/idempotency: Task 6.
- Frontend result/paywall: Task 7.
- Unit/integration/component/E2E coverage: Tasks 2-8.
- CI: Task 8.
- README/API/ER/AI retrospective: Task 9.
- Public deployment: documented in Task 9; actual Vercel deployment must be performed after repository verification and environment provisioning.

### Placeholder scan

No implementation step relies on `TBD`, `TODO`, "similar to", or unspecified error handling. Deployment URL/session ID are explicitly not invented before deployment exists.

### Type consistency

- `HealthProfileInput` and `AssessmentComputation` originate in Task 2 and are consumed by Task 5.
- `AssessmentSessionSnapshot` originates in Task 3 and is extended/returned by Task 4.
- `PredictionPoint` originates in Task 2 and is consumed by Task 6 result DTOs.
- Session version conflicts consistently use `SESSION_VERSION_CONFLICT` and HTTP 409.
- New APIs consistently use `/api/v1`.
