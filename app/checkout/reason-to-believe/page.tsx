"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { saveExplicitPageState } from "@/components/funnel/clientState";
import styles from "./checkout.module.css";

type Offer = "trial" | "four-week-discount" | "four-week-popular" | "twelve-week";

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") || params.get("order") || "";
  const [selected, setSelected] = useState<Offer>("four-week-popular");
  const [modalOpen, setModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function openCheckout(offer: Offer) {
    setSelected(offer);
    setError("");
    try {
      await saveExplicitPageState(sessionId, {
        stepKey: "selectedPlan",
        value: offer,
        nextStepKey: "paymentModal",
      });
    } catch {
      // The modal remains inspectable if persistence is temporarily unavailable.
    }
    setModalOpen(true);
  }

  async function simulatePayment() {
    if (!sessionId || paying) return;
    setPaying(true);
    setError("");

    try {
      const complete = await fetch(`/api/v1/sessions/${sessionId}/complete`, { method: "POST" });
      if (!complete.ok && complete.status !== 409) {
        const payload = await complete.json().catch(() => ({}));
        throw new Error(payload?.message ?? "Your assessment is not ready for checkout yet.");
      }

      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/v1/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          sessionId,
          plan: selected === "twelve-week" ? "quarterly" : "monthly",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message ?? "Simulated payment failed.");
      router.push(`/results/${sessionId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Simulated payment failed.");
      setPaying(false);
    }
  }

  function selectedSummary() {
    if (selected === "twelve-week") return "12-Week Plan · HK$588";
    if (selected === "four-week-popular") return "4-Week Plan · HK$280";
    if (selected === "four-week-discount") return "4-week PLAN · HK$98";
    return "1-Week Trial";
  }

  return (
    <main className={styles.page} data-step-key="checkout">
      <header className={styles.header}>
        <span className={styles.brand}>BetterMe</span>
        <span>30% demo discount reserved</span>
        <button className={styles.headerButton} type="button" onClick={() => document.getElementById("offers")?.scrollIntoView({ behavior: "smooth" })}>GET MY PLAN</button>
      </header>

      <div className={styles.main}>
        <section className={styles.hero}>
          <p>Home Pilates</p>
          <h1>Your Home Pilates Workout Plan is ready!</h1>
          <p>Independent educational replica · simulated checkout only · no real charge.</p>
        </section>

        <section className={styles.two}>
          <article className={styles.card}><span className={styles.badge}>NOW</span><h2>Your starting point</h2><p>Current profile snapshot based on the answers you entered.</p><strong>Beginner-friendly Pilates level</strong></article>
          <article className={styles.card}><span className={styles.badge}>GOAL</span><h2>Your target direction</h2><p>A consistent four-week movement routine with gradual progression.</p><strong>Mobility + strength + habit building</strong></article>
        </section>

        <section className={styles.section} id="offers">
          <h2>Choose your plan</h2>
          <div className={styles.grid}>
            <article className={`${styles.card} ${selected === "trial" ? styles.cardSelected : ""}`} onClick={() => setSelected("trial")}>
              <span className={styles.badge}>TRIAL</span><h3>1-Week Trial</h3><p>Demo offer card</p><strong>Reference-inspired trial option</strong>
              <button className={styles.primary} type="button" onClick={() => void openCheckout("trial")}>GET MY PLAN</button>
            </article>
            <article className={`${styles.card} ${selected === "four-week-discount" ? styles.cardSelected : ""}`} onClick={() => setSelected("four-week-discount")}>
              <span className={styles.badge}>30% OFF</span><h3>4-week PLAN</h3><p><strong>HK$98</strong></p><p>HK$14/day</p>
              <button className={styles.primary} type="button" onClick={() => void openCheckout("four-week-discount")}>GET MY PLAN</button>
            </article>
            <article className={`${styles.card} ${selected === "four-week-popular" ? styles.cardSelected : ""}`} onClick={() => setSelected("four-week-popular")}>
              <span className={styles.badge}>MOST POPULAR</span><h3>4-Week Plan</h3><p><strong>HK$280</strong></p><p>HK$10/day</p>
              <button className={styles.primary} type="button" onClick={() => void openCheckout("four-week-popular")}>GET MY PLAN</button>
            </article>
            <article className={`${styles.card} ${selected === "twelve-week" ? styles.cardSelected : ""}`} onClick={() => setSelected("twelve-week")}>
              <span className={styles.badge}>12 WEEKS</span><h3>12-Week Plan</h3><p><strong>HK$588</strong></p><p>HK$7/day</p>
              <button className={styles.primary} type="button" onClick={() => void openCheckout("twelve-week")}>GET MY PLAN</button>
            </article>
          </div>
          <p>The supplied observation calls these “three plan choices” while listing four distinct offer/price rows. This replica exposes every observed row rather than silently dropping one. Prices are display-only; the mock endpoint never charges money.</p>
        </section>

        <section className={styles.section}>
          <h2>Optional Pilates accessories</h2>
          <div className={styles.card}><span className={styles.badge}>25% KIT DISCOUNT</span><p>Accessory kit offer shown separately from the workout plan. Accessories are not included in plan pricing.</p></div>
        </section>

        <section className={styles.section}>
          <h2>What&apos;s included</h2>
          <div className={styles.grid}>
            <article className={styles.card}><h3>Short workouts</h3><p>Home-friendly sessions designed for busy schedules.</p></article>
            <article className={styles.card}><h3>Beginner routines</h3><p>Controlled movement with gradual progression.</p></article>
            <article className={styles.card}><h3>Stretch &amp; mobility</h3><p>Recovery-focused movement alongside Pilates work.</p></article>
            <article className={styles.card}><h3>Meal-plan preview</h3><p>Educational demo content, not medical nutrition advice.</p></article>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Why people keep moving</h2>
          <div className={styles.grid}>
            <article className={styles.card}><strong>Demo ambassador story</strong><p>Paid-collaboration style block reproduced as layout only, not a real endorsement.</p></article>
            <article className={styles.card}><strong>Demo customer story</strong><p>“The short sessions helped me make movement part of my routine.”</p></article>
            <article className={styles.card}><strong>Demo app recognition</strong><p>Reference-inspired rating and award layout without borrowed claims.</p></article>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Frequently asked questions</h2>
          <div className={styles.faq}>
            <details><summary>How long are the workouts?</summary><p>The demo plan focuses on short home sessions.</p></details>
            <details><summary>Do I need equipment?</summary><p>No. Accessories are optional and sold separately in the reference layout.</p></details>
            <details><summary>Is this suitable for beginners?</summary><p>The replica presents beginner-friendly routines; consult a professional for individual medical needs.</p></details>
            <details><summary>Can I cancel the mock plan?</summary><p>No real billing occurs. The local subscription is only a test access state.</p></details>
            <details><summary>What happens after checkout?</summary><p>The simulated payment unlocks the protected result DTO.</p></details>
            <details><summary>Are results guaranteed?</summary><p>No. Marketing graphs are illustrative and results vary.</p></details>
            <details><summary>Is payment information stored?</summary><p>No real financial details are collected or transmitted.</p></details>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Ready to start?</h2>
          <div className={styles.grid}>
            <article className={styles.card}><h3>1-Week Trial</h3><button className={styles.primary} type="button" onClick={() => void openCheckout("trial")}>GET MY PLAN</button></article>
            <article className={styles.card}><h3>4-week PLAN · HK$98</h3><button className={styles.primary} type="button" onClick={() => void openCheckout("four-week-discount")}>GET MY PLAN</button></article>
            <article className={styles.card}><h3>4-Week Plan · HK$280</h3><button className={styles.primary} type="button" onClick={() => void openCheckout("four-week-popular")}>GET MY PLAN</button></article>
            <article className={styles.card}><h3>12-Week Plan · HK$588</h3><button className={styles.primary} type="button" onClick={() => void openCheckout("twelve-week")}>GET MY PLAN</button></article>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Independent educational replica. No association with or endorsement by BetterMe is claimed.</p>
          <p>Simulated payment only. No card data is collected. Health and progress content is educational and not medical advice.</p>
        </footer>
      </div>

      {modalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className={styles.modalHeader}>
              <h2 id="checkout-title">Complete your checkout</h2>
              <button className={styles.close} type="button" aria-label="Close checkout" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className={styles.card}>
              <strong>Order summary</strong>
              <p>{selectedSummary()}</p>
              <p>Promo: demo_sep26</p>
            </div>
            <p>VISA · Mastercard · AmEx</p>
            <div className={styles.fakeField}>Card number field intentionally disabled — simulated payment only</div>
            <div className={styles.two} style={{ marginTop: 12 }}>
              <div className={styles.fakeField}>Expiry — not collected</div>
              <div className={styles.fakeField}>CVV — not collected</div>
            </div>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button className={styles.primary} style={{ width: "100%", marginTop: 20 }} type="button" disabled={paying} onClick={simulatePayment}>{paying ? "Activating…" : "GET MY PLAN — SIMULATED"}</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={null}><CheckoutContent /></Suspense>;
}
