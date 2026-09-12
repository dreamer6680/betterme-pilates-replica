export type FunnelSearchParams = Promise<Record<string, string | string[] | undefined>>;

export function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export async function readFunnelQuery(searchParams: FunnelSearchParams) {
  const params = await searchParams;
  const sessionId = firstParam(params.sessionId) || firstParam(params.order);
  const flow = firstParam(params.flow) || "2117";
  const age = firstParam(params.age);

  return { sessionId, flow, age };
}
