import SecondaryGoalsStep from "@/components/funnel/SecondaryGoalsStep";
import { readFunnelQuery, type FunnelSearchParams } from "@/components/funnel/query";

type Props = { searchParams: FunnelSearchParams };

export default async function SecondaryGoalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { sessionId, flow, age } = await readFunnelQuery(Promise.resolve(params));
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }

  return <SecondaryGoalsStep sessionId={sessionId} flow={flow} age={age} queryString={query.toString()} />;
}
