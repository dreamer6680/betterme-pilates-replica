import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";

export const VISITOR_COOKIE_NAME =
  process.env.VISITOR_COOKIE_NAME ?? "betterme_visitor";

export async function getOrCreateVisitor(): Promise<{
  visitorId: string;
  publicId: string;
}> {
  const cookieStore = await cookies();
  const publicId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (publicId) {
    const existing = await prisma.visitor.findUnique({
      where: { publicId },
      select: { id: true, publicId: true },
    });

    if (existing) {
      return {
        visitorId: existing.id,
        publicId: existing.publicId,
      };
    }
  }

  const visitor = await prisma.visitor.create({
    data: {},
    select: { id: true, publicId: true },
  });

  cookieStore.set(VISITOR_COOKIE_NAME, visitor.publicId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return {
    visitorId: visitor.id,
    publicId: visitor.publicId,
  };
}
