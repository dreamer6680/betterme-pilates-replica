# Explicit Route Fidelity Audit

Audit date: 2026-09-13  
Scope: read-only inspection of `app`, route imports/navigation, test inventory, and `docs/superpowers/plans/2026-09-12-explicit-route-pages.md`. No production source was changed and no tests were run.

## 1. Non-API App Router page URLs

There are **45** non-API `app/**/page.tsx` files:

```text
/
/first-page-brand-palette
/onboarding
/onboarding/intro
/onboarding/physical-build
/onboarding/goal
/onboarding/exercise-frequency
/onboarding/stairs
/onboarding/limitations
/onboarding/walking-frequency
/onboarding/accessories-experience
/onboarding/accessories-barrier
/onboarding/accessories-insight
/onboarding/accessories-press
/onboarding/work-schedule
/onboarding/daily-activity
/onboarding/energy
/onboarding/water
/onboarding/sleep
/onboarding/breakfast
/onboarding/lunch
/onboarding/dinner
/onboarding/diet
/onboarding/eating-habits
/onboarding/experts
/onboarding/weight-gain-events
/onboarding/sex
/onboarding/height
/onboarding/weight
/onboarding/target-weight
/onboarding/age
/onboarding/analysis
/onboarding/wellness-profile
/onboarding/event
/onboarding/event-date
/onboarding/goal-projection
/onboarding/trust
/onboarding/generation
/onboarding/email
/funnel-prompts
/progress-graph/default
/country-change
/scratch-card
/checkout/reason-to-believe
/results/[sessionId]
```

## 2. Shared funnel shell and styles

### Reuse `FunnelPage` and `funnel.module.css` directly (40)

All of the following directly import both `@/components/funnel/FunnelPage` and `@/components/funnel/funnel.module.css`:

```text
/onboarding/intro
/onboarding/physical-build
/onboarding/goal
/onboarding/exercise-frequency
/onboarding/stairs
/onboarding/limitations
/onboarding/walking-frequency
/onboarding/accessories-experience
/onboarding/accessories-barrier
/onboarding/accessories-insight
/onboarding/accessories-press
/onboarding/work-schedule
/onboarding/daily-activity
/onboarding/energy
/onboarding/water
/onboarding/sleep
/onboarding/breakfast
/onboarding/lunch
/onboarding/dinner
/onboarding/diet
/onboarding/eating-habits
/onboarding/experts
/onboarding/weight-gain-events
/onboarding/sex
/onboarding/height
/onboarding/weight
/onboarding/target-weight
/onboarding/age
/onboarding/analysis
/onboarding/wellness-profile
/onboarding/event
/onboarding/event-date
/onboarding/goal-projection
/onboarding/trust
/onboarding/generation
/onboarding/email
/funnel-prompts
/progress-graph/default
/country-change
/scratch-card
```

### Pages with no direct funnel-shell import (5)

| URL | Direct style/import finding |
| --- | --- |
| `/` | Redirect-only page; no direct CSS. |
| `/first-page-brand-palette` | Delegates rendering to `components/PilatesLanding`; no direct CSS import. |
| `/onboarding` | Compatibility/resume redirect/error UI; directly imports `components/onboarding.module.css`. |
| `/checkout/reason-to-believe` | The only page-local stylesheet: `./checkout.module.css`; checkout UI/modal is implemented inline in this page. |
| `/results/[sessionId]` | Delegates rendering to `components/HealthResult`; no direct CSS import. |

`app/checkout/reason-to-believe/checkout.module.css` is the only `*.module.css` below `app`. No funnel route has a page-local stylesheet.

## 3. Route-chain independence

**Pass, with scope noted.** Every one of the 45 listed URLs has its own `page.tsx`; no non-API route is implemented by a catch-all or reused page file. The direct internal URL literals found in `app`/`components` (checkout, all explicit onboarding steps, standalone pages, and scratch-card) all resolve to a matching page file.

`/onboarding` has a fixed `currentStepKey` whitelist and redirects to the dedicated route. Its default is `/onboarding/intro`. `/results/[sessionId]` is a dedicated dynamic page. The static scan cannot prove routes constructed at runtime, but no unresolved direct internal route literal was found.

Legacy components still exist (`components/HealthProfileGate.tsx`, `components/OnboardingQuestionnaire.tsx`), but no file under `app` imports either, so they are not active in the current App Router chain.

## 4. Plan comparison: delivered, partial, and missing

### Delivered or substantially delivered

- Stable explicit progress exists: schema fields `flowRevision`/`currentStepKey`, service `savePageState`, state API route, and migration are present. The migration timestamp differs from the plan (`20260912193000_explicit_page_progress`, not `20260912150000...`).
- All route files named in Tasks 4–9 exist, including the standalone routes and checkout stylesheet.
- `tests/page-state.integration.test.ts`, `tests/reference-routes.test.ts`, and `e2e/full-funnel.spec.ts` provide partial combined coverage. The E2E test exercises reload, a branch, checkout modal, simulated payment, and preview/full result access.
- `/onboarding` uses `currentStepKey` to resume an explicit route and does not render the legacy questionnaire.
- README documents explicit route pages, Docker startup, educational-replica status, and simulated payment.

### Missing or materially divergent planned deliverables

| Plan task | Missing/divergent deliverable |
| --- | --- |
| 1 | The named migration path differs. `tests/session-service.integration.test.ts` still tests integer `currentStep`; it lacks the planned direct assertions that `currentStepKey` survives reload and repeated saves do not regress it. Some of that behavior is instead covered in `page-state.integration.test.ts`. |
| 2 | `lib/assessment/page-state.ts` is absent; Zod validation and `savePageState` live in `session-service.ts`. |
| 3 | Missing `FunnelHeader.tsx`, `ChoiceButton.tsx`, `ContinueButton.tsx`, `useAssessmentSession.ts`, and `tests/funnel-primitives.test.tsx`. `FunnelPage.tsx`, `funnel.module.css`, and a differently named `SaveChoiceButton.tsx` exist. |
| 4–5 | Dedicated pages exist, but `reference-routes.test.ts` is source-text/headline focused; it does not assert the planned option sets or route order, and the separate `reference-funnel.spec.ts` is absent. |
| 6 | All five pages and validation support exist, but `tests/health-page-flow.test.tsx` is absent. Existing `health-answer.integration.test.ts`/`age-card.test.tsx` only partially substitute for the planned FT/CM, LBS/KG, consent-gating, BMI-feedback, and age-flow coverage. |
| 7 | All listed pages exist, but `tests/conversion-sequence.test.tsx` is absent. The full E2E covers a no-event path, but there is no dedicated conversion-sequence test. |
| 8 | All standalone pages exist, but `tests/standalone-funnel-routes.test.tsx` is absent. |
| 9 | `components/checkout/SimulatedPaymentModal.tsx` and `tests/checkout-page.test.tsx` are absent; the modal is inline in the checkout page. |
| 10 | Legacy page rendering is inactive, but `lib/onboarding.ts` remains actively imported by session-service and the old `/api/onboarding/progress` endpoint. That does not by itself prove page content is centralized, but it remains a cleanup/architecture-review item. |
| 11 | `e2e/reference-funnel.spec.ts` is absent. The planned full validation command suite was not evidenced by a recorded run in the inspected files. |
| 12 | `docs/reference-coverage.md` is absent. README contains a coverage map, but the requested separate observed-vs-inferred/adapted coverage document and final CI run link/ID are absent. |

## 5. Test-gap priority

1. Add the missing independent reference E2E sequence and route-order/options assertions; current source test covers headings but not all specified interaction fidelity.
2. Add explicit health UI tests for both unit systems, consent, BMI feedback, and age validation.
3. Extract or deliberately revise the Task 3/9 component contract: planned primitives and simulated-payment component are absent because functionality is consolidated into differently shaped files.
4. Add focused checkout and standalone-route test files (or formally update the plan to accept combined coverage).
5. Add `docs/reference-coverage.md` and an auditable final CI run identifier/link.
