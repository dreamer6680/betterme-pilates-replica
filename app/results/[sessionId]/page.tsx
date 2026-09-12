import HealthResult from "@/components/HealthResult";

type ResultsPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;
  return <HealthResult sessionId={sessionId} />;
}
