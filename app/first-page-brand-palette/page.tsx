import PilatesLanding from "@/components/PilatesLanding";
import { PILATES_CONFIG } from "@/lib/config";

type PageProps = {
  searchParams: Promise<{
    flow?: string | string[];
  }>;
};

export default async function FirstPageBrandPalette({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const requestedFlow =
    typeof params.flow === "string"
      ? params.flow
      : PILATES_CONFIG.flow;

  return (
    <PilatesLanding
      requestedFlow={requestedFlow}
      fallbackConfig={PILATES_CONFIG}
    />
  );
}
