# Explicit Route Pages Design

## Goal

Rebuild the BetterMe-inspired funnel so each observable screen has its own Next.js App Router URL and its own `page.tsx`, with the actual visible copy/options/markup written directly in that page file for easy manual review.

## Hard constraints

- Do not generate page content from a JS/TS step array, JSON file, CMS-style config, or generic funnel renderer.
- One URL maps to one `page.tsx`.
- Visible page copy, option labels, major sections, images, and page-specific navigation are authored directly in the page file.
- Shared components are limited to low-level visual primitives and persistence/navigation helpers; they must not hide page content.
- Preserve Prisma + Docker PostgreSQL, visitor ownership checks, optimistic concurrency control, incremental persistence, preview/full result redaction, and mock payment.
- Preserve independent educational-replica labeling. Do not present observed upstream endorsements/medical claims as original claims.

## Route model

Reference-observed screens 16-46 become explicit semantic onboarding routes:

- `/onboarding/stairs`
- `/onboarding/limitations`
- `/onboarding/walking-frequency`
- `/onboarding/accessories-experience`
- `/onboarding/accessories-barrier`
- `/onboarding/accessories-insight`
- `/onboarding/accessories-press`
- `/onboarding/work-schedule`
- `/onboarding/daily-activity`
- `/onboarding/energy`
- `/onboarding/water`
- `/onboarding/sleep`
- `/onboarding/breakfast`
- `/onboarding/lunch`
- `/onboarding/dinner`
- `/onboarding/diet`
- `/onboarding/eating-habits`
- `/onboarding/experts`
- `/onboarding/weight-gain-events`
- `/onboarding/sex` (assignment-required adaptation, placed beside health data rather than first)
- `/onboarding/height`
- `/onboarding/weight`
- `/onboarding/target-weight`
- `/onboarding/age`
- `/onboarding/analysis`
- `/onboarding/wellness-profile`
- `/onboarding/event`
- `/onboarding/event-date`
- `/onboarding/goal-projection`
- `/onboarding/trust`
- `/onboarding/generation`
- `/onboarding/email`

Observed standalone paths stay exact:

- `/funnel-prompts`
- `/progress-graph/default`
- `/country-change`
- `/scratch-card`
- `/checkout/reason-to-believe`

`paymentModal` is modal state on `/checkout/reason-to-believe`, not a separate route.

## Page authoring style

Each page directly contains its title, copy, option labels, visual sections, and navigation target. Example:

```tsx
export default function StairsPage() {
  return (
    <FunnelPage section="Activity" backHref="/onboarding/...">
      <h1>Do you lose your breath when taking the stairs?</h1>
      <ChoiceButton value="cant-talk" nextHref="/onboarding/limitations">
        So out of breath I can&apos;t talk
      </ChoiceButton>
      ...
    </FunnelPage>
  );
}
```

A reviewer must be able to inspect the page without opening a separate flow config to understand what it renders or where it goes next.

## Shared code boundaries

Allowed shared components/helpers:

- header/back/progress shell
- choice button styling
- continue button styling
- numeric unit input primitives
- `useAssessmentSession()` ownership/recovery hook
- `saveAnswer()` / `saveHealthField()` API clients
- OCC conflict refresh/retry helper
- mock checkout modal mechanics

Not allowed:

- generic `<StepRenderer step={config}>`
- centralized visible-copy arrays for the 16-52 inventory
- centralized `nextStepMap` for ordinary linear navigation

Page-specific conditional branching may be written directly in the page handler.

## Persistence changes

`AssessmentSession` gains stable progress identity:

- `flowRevision String @default("home-pilates-explicit-pages-v1")`
- `currentStepKey String?`

Existing `currentStep` remains temporarily for compatibility but is no longer authoritative for explicit pages.

All incremental states are persisted with step keys, including informational acknowledgement where needed, date, email, name, display units, health consent, country, promotion state, and selected plan.

Parent branch edits reconcile obsolete dependent answers transactionally. Example: changing accessories experience from `never-tried` to another answer removes `accessoriesBarrier`.

## Health sequence

Move health collection near the end:

`weightGainEvents -> sex -> height -> weight -> targetWeight -> age -> analysis`

- height: FT/CM toggle; canonical cm; health consent required; persist unit + consent version/timestamp.
- weight: LBS/KG toggle; canonical kg; inline BMI feedback when height exists.
- target weight: LBS/KG; canonical kg.
- age: numeric years.

## Completion and conversion sequence

Server result generation no longer redirects immediately to `/results/:sessionId`.

Sequence:

`analysis -> wellnessProfile -> event -> eventDate? -> goalProjection -> trust -> generation -> email -> name -> progressGraph -> country -> scratch -> checkout`

Health calculation can be persisted before conversion pages finish, but protected result fields remain unavailable to unpaid users.

## Conditional branches

- `accessoriesExperience = never-tried` -> `/onboarding/accessories-barrier`; other answers -> `/onboarding/accessories-insight`.
- `event = no-events` skips `/onboarding/event-date` and goes to goal projection.
- event choices other than no-events go through event date; event date supports explicit skip.
- multi-select `None of the above` is mutually exclusive with all other selections.

## Checkout

`/checkout/reason-to-believe` is a full page with directly-authored sections:

- sticky header and offer anchor
- current/target comparison
- Pilates level meter
- three observed demo plan cards
- accessories offer
- benefits carousel/blocks
- demo social-proof sections
- FAQ
- stories
- repeated pricing
- money-back/legal/footer

The checkout modal is explicitly simulated. It must not transmit or persist real card number/CVV fields. The final action calls existing `/api/v1/pay` using an idempotency key and then fetches full result access.

## Testing

Create a reference-order test independent of any implementation page list. It asserts routes 16-52 exist and expected headings are rendered.

Browser tests cover:

- each real route resolves and can reload
- session ownership/recovery
- single-choice auto advance
- multi-choice disabled continue and none-of-above exclusivity
- accessory branch
- event skip/date branch
- unit conversion and health consent
- email/name persistence
- progression through standalone URLs
- scratch/checkout page resolution
- checkout modal open/close separate from payment
- mock payment idempotency and preview -> full transition
- no protected data in anonymous/unpaid API payloads

## Reference coverage

Screens 16-52 are implemented from the supplied observed inventory. Early screens 1-15 remain coverage-marked as existing/partially observed until a complete upstream inventory is supplied. Untraversed branches are labeled inferred or adapted rather than claimed as verified.
