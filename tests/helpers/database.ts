import { prisma } from "@/lib/db/prisma";

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.paymentEvent.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.assessmentResult.deleteMany(),
    prisma.healthProfile.deleteMany(),
    prisma.assessmentAnswer.deleteMany(),
    prisma.assessmentSession.deleteMany(),
    prisma.visitor.deleteMany(),
  ]);
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
