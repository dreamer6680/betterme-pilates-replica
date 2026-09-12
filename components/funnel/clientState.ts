export async function saveExplicitPageState(
  sessionId: string,
  payload: {
    stepKey: string;
    value: unknown;
    nextStepKey: string;
    clearStepKeys?: string[];
  },
) {
  const snapshotResponse = await fetch(`/api/v1/sessions/${sessionId}`, {
    cache: "no-store",
  });
  const snapshot = await snapshotResponse.json();
  if (!snapshotResponse.ok) {
    throw new Error(snapshot?.message ?? "Unable to restore this session.");
  }

  const response = await fetch(`/api/v1/sessions/${sessionId}/state`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, expectedVersion: snapshot.version }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.message ?? "Unable to save this page.");
  }

  return body;
}

export function appendFunnelQuery(
  href: string,
  sessionId: string,
  flow: string,
  age?: string,
) {
  const query = new URLSearchParams({ sessionId, flow });
  if (age) query.set("age", age);
  return `${href}?${query.toString()}`;
}
