import { NextResponse } from "next/server";
import { PILATES_CONFIG } from "@/lib/config";

export function GET(request: Request) {
  const url = new URL(request.url);
  const flow =
    url.searchParams.get("flow") ?? PILATES_CONFIG.flow;

  if (flow !== PILATES_CONFIG.flow) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIG_NOT_FOUND",
          message: `No local configuration exists for flow "${flow}".`,
        },
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(PILATES_CONFIG, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
