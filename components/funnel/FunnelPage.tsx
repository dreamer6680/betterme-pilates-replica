import type { ReactNode } from "react";
import Link from "next/link";

import styles from "./funnel.module.css";

type FunnelPageProps = {
  section: string;
  step: string;
  children: ReactNode;
  backHref?: string;
};

export default function FunnelPage({ section, step, children, backHref }: FunnelPageProps) {
  return (
    <main className={styles.page} data-step-key={step}>
      <header className={styles.header}>
        <strong className={styles.brand}>BetterMe</strong>
        <span className={styles.section}>{section}</span>
        {backHref ? (
          <Link className={styles.back} href={backHref} aria-label="Go back">
            ←
          </Link>
        ) : (
          <span className={styles.backPlaceholder} />
        )}
      </header>
      <section className={styles.card}>{children}</section>
      <p className={styles.replicaNote}>Independent educational replica · no medical advice</p>
    </main>
  );
}
