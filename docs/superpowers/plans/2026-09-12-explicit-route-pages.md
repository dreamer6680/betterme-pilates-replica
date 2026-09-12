# Explicit Route Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abbreviated config-driven questionnaire with explicit, reviewable Next.js route pages for the observed funnel screens while preserving the existing PostgreSQL-backed persistence, authorization, OCC, result access, and mock-payment behavior.

**Architecture:** Each observable screen gets a dedicated App Router `page.tsx` with its actual copy/options/navigation authored inline. Shared code is limited to low-level UI primitives and server/client persistence helpers. Session progress becomes stable by `currentStepKey` plus a flow revision so inserted pages do not reinterpret legacy integer positions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, PostgreSQL 16 Docker, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-12-explicit-route-pages-design.md`

## Global Constraints

- Visible page content must be directly inspectable in each `page.tsx`.
- No centralized step-content array, JSON-driven renderer, or generic funnel renderer.
- Preserve Docker PostgreSQL, Prisma transactions, visitor ownership, OCC, redacted preview payloads, and `/api/v1/pay`.
- Reference-observed screens 16-52 are the fidelity target; untraversed branches remain labeled inferred/adapted.
- No real payment details are transmitted or stored.

---

### Task 1: Stable session progress keys

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260912150000_explicit_page_progress/migration.sql`
- Modify: `lib/assessment/session-service.ts`
- Test: `tests/session-service.integration.test.ts`

**Interfaces:**
- Produces `AssessmentSession.currentStepKey: string | null` and `flowRevision: string`.
- Produces service support for saving a page step key without regressing progress.

- [ ] Add failing integration tests proving a saved `currentStepKey` survives reload, repeated save does not regress, and a stale `expectedVersion` still conflicts.
- [ ] Run `npm test -- tests/session-service.integration.test.ts` and verify RED.
- [ ] Add schema fields + migration and minimal transactional service updates.
- [ ] Run the same test and verify GREEN.
- [ ] Commit.

### Task 2: Generic persistence API for explicit page states

**Files:**
- Create: `app/api/v1/sessions/[sessionId]/state/route.ts`
- Modify: `lib/assessment/session-service.ts`
- Create: `lib/assessment/page-state.ts`
- Test: `tests/page-state.integration.test.ts`

**Interfaces:**
- `savePageState(visitorId, sessionId, { stepKey, value, expectedVersion, nextStepKey, clearStepKeys? })`
- Supports strings, string arrays, booleans, dates represented as ISO strings, and small JSON objects.

- [ ] Write failing tests for state save, reload, branch cleanup, wrong owner, and OCC conflict.
- [ ] Run test and verify RED.
- [ ] Implement Zod validation and transaction-backed save/cleanup.
- [ ] Run test and verify GREEN.
- [ ] Commit.

### Task 3: Explicit page shell and client persistence primitives

**Files:**
- Create: `components/funnel/FunnelPage.tsx`
- Create: `components/funnel/FunnelHeader.tsx`
- Create: `components/funnel/ChoiceButton.tsx`
- Create: `components/funnel/ContinueButton.tsx`
- Create: `components/funnel/useAssessmentSession.ts`
- Create: `components/funnel/funnel.module.css`
- Test: `tests/funnel-primitives.test.tsx`

**Interfaces:**
- Components style shared chrome only; visible page-specific copy remains at route call sites.
- Hook exposes session snapshot, version, loading/error, saveState, saveHealthField, refresh.

- [ ] Write failing UI/hook tests.
- [ ] Run and verify RED.
- [ ] Implement minimal primitives without content configuration.
- [ ] Run and verify GREEN.
- [ ] Commit.

### Task 4: Activity and accessories routes 16-22

**Files:**
- Create page files under `app/onboarding/stairs`, `limitations`, `walking-frequency`, `accessories-experience`, `accessories-barrier`, `accessories-insight`, `accessories-press`.
- Test: `tests/reference-routes.test.tsx`
- E2E: `e2e/reference-funnel.spec.ts`

**Interfaces:**
- Each file contains the supplied heading/options inline.
- Accessories branch is handled directly in `accessories-experience/page.tsx`.

- [ ] Add RED route/headline/order assertions for 16-22.
- [ ] Verify RED.
- [ ] Implement seven page files.
- [ ] Verify unit route tests and focused Playwright segment GREEN.
- [ ] Commit.

### Task 5: Lifestyle and nutrition routes 23-34

**Files:**
- Create page files for work schedule, daily activity, energy, water, sleep, breakfast, lunch, dinner, diet, eating habits, experts, weight gain events.
- Test: extend `tests/reference-routes.test.tsx`.
- E2E: extend `e2e/reference-funnel.spec.ts`.

- [ ] Add RED assertions for headings/options/order and multi-select exclusivity.
- [ ] Verify RED.
- [ ] Implement 12 explicit route files with direct content.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 6: Health data routes 35-38 plus assignment-required sex

**Files:**
- Create: `app/onboarding/sex/page.tsx`
- Create: `app/onboarding/height/page.tsx`
- Create: `app/onboarding/weight/page.tsx`
- Create: `app/onboarding/target-weight/page.tsx`
- Create: `app/onboarding/age/page.tsx`
- Modify: `lib/assessment/validation.ts`
- Test: `tests/health-page-flow.test.tsx`
- E2E: extend `e2e/reference-funnel.spec.ts`

**Interfaces:**
- Canonical DB values remain cm/kg.
- Persist display units, consent version/timestamp, and health fields.

- [ ] Add RED tests for FT/CM, LBS/KG, consent gating, BMI feedback, and age validation.
- [ ] Verify RED.
- [ ] Implement explicit pages and validation helpers.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 7: Analysis, wellness, event, projection, trust, generation, email routes 39-46

**Files:**
- Create explicit pages for analysis, wellness profile, event, event date, goal projection, trust, generation, email.
- Modify: `lib/assessment/completion-service.ts` only as needed to decouple calculation completion from UI redirect.
- Test: `tests/conversion-sequence.test.tsx`
- E2E: extend reference funnel.

- [ ] Add RED tests proving `generation` no longer redirects directly to results and no-event skips event-date.
- [ ] Verify RED.
- [ ] Implement eight pages and conditional navigation.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 8: Standalone observed URLs 47-50

**Files:**
- Replace/create: `app/funnel-prompts/page.tsx`
- Replace/create: `app/progress-graph/default/page.tsx`
- Replace/create: `app/country-change/page.tsx`
- Replace/create: `app/scratch-card/page.tsx`
- Test: `tests/standalone-funnel-routes.test.tsx`
- E2E: extend reference funnel.

- [ ] Add RED tests for exact paths, headings, disabled empty name, persisted country/promo state.
- [ ] Verify RED.
- [ ] Implement four explicit pages with inline content.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 9: Full checkout route and simulated payment modal 51-52

**Files:**
- Create/replace: `app/checkout/reason-to-believe/page.tsx`
- Create: `components/checkout/SimulatedPaymentModal.tsx`
- Create: `app/checkout/reason-to-believe/checkout.module.css`
- Test: `tests/checkout-page.test.tsx`
- E2E: extend reference funnel.

**Interfaces:**
- Page contains inline plan/pricing/FAQ/social-proof/demo sections.
- Modal never accepts/transmits real card values.
- Final action uses existing `/api/v1/pay` with idempotency key.

- [ ] Add RED tests for offer cards, modal open/close, no real card fields, selected plan persistence, and payment transition.
- [ ] Verify RED.
- [ ] Implement checkout page and modal.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 10: Remove abbreviated config-driven funnel from active flow

**Files:**
- Modify: `app/onboarding/page.tsx`
- Modify/delete active usage of `components/OnboardingQuestionnaire.tsx`
- Modify/delete active usage of `components/HealthProfileGate.tsx`
- Modify: `lib/onboarding.ts` so it is not the page-content source; remove if no longer referenced.
- Test: `tests/reference-routes.test.tsx`

- [ ] Add RED assertion that legacy `/onboarding` resumes/redirects to explicit `currentStepKey` route and does not render the old questionnaire.
- [ ] Verify RED.
- [ ] Implement compatibility redirect/resume behavior and remove active config renderer.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 11: Reference-driven full E2E and security regression

**Files:**
- Replace: `e2e/full-funnel.spec.ts`
- Extend: `e2e/reference-funnel.spec.ts`
- Test existing result/payment integration tests.

- [ ] Add reference sequence constant locally in the E2E test, independent from app implementation.
- [ ] Exercise interruption/reload, branch paths, explicit standalone URLs, checkout modal, mock pay, preview/full field checks.
- [ ] Run focused E2E and verify GREEN.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
- [ ] Commit.

### Task 12: Documentation and coverage matrix

**Files:**
- Modify: `README.md`
- Create: `docs/reference-coverage.md`

- [ ] Document route-per-page architecture and Docker startup.
- [ ] Record 16-52 as supplied/observed; distinguish inferred/adapted branches.
- [ ] Explicitly state simulated payment and educational replica status.
- [ ] Run final CI on the final branch commit and record the run link/ID.
- [ ] Commit.
