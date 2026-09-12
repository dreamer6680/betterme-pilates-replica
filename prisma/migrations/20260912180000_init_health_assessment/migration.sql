CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'COMPLETED');
CREATE TYPE "ProfileSex" AS ENUM ('FEMALE', 'MALE', 'OTHER');
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');
CREATE TYPE "HealthGoal" AS ENUM ('LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT', 'FITNESS');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'QUARTERLY');
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'SUCCEEDED', 'FAILED');

CREATE TABLE "Visitor" (
  "id" UUID NOT NULL,
  "publicId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentSession" (
  "id" UUID NOT NULL,
  "visitorId" UUID NOT NULL,
  "flow" TEXT NOT NULL,
  "ageRange" TEXT,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentAnswer" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "stepKey" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthProfile" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "sex" "ProfileSex" NOT NULL,
  "age" INTEGER NOT NULL,
  "heightCm" DECIMAL(6,2) NOT NULL,
  "weightKg" DECIMAL(6,2) NOT NULL,
  "targetWeightKg" DECIMAL(6,2) NOT NULL,
  "activityLevel" "ActivityLevel" NOT NULL,
  "goal" "HealthGoal" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssessmentResult" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "bmi" DECIMAL(6,2) NOT NULL,
  "bmiCategory" TEXT NOT NULL,
  "bmr" DECIMAL(8,2) NOT NULL,
  "tdee" DECIMAL(8,2) NOT NULL,
  "recommendedCalories" INTEGER NOT NULL,
  "weeklyChangeKg" DECIMAL(5,2) NOT NULL,
  "targetDate" TIMESTAMP(3) NOT NULL,
  "predictionCurve" JSONB NOT NULL,
  "algorithmVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" UUID NOT NULL,
  "visitorId" UUID NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'MONTHLY',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentEvent" (
  "id" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "visitorId" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Visitor_publicId_key" ON "Visitor"("publicId");
CREATE INDEX "AssessmentSession_visitorId_idx" ON "AssessmentSession"("visitorId");
CREATE INDEX "AssessmentSession_visitorId_status_idx" ON "AssessmentSession"("visitorId", "status");
CREATE UNIQUE INDEX "AssessmentAnswer_sessionId_stepKey_key" ON "AssessmentAnswer"("sessionId", "stepKey");
CREATE UNIQUE INDEX "HealthProfile_sessionId_key" ON "HealthProfile"("sessionId");
CREATE UNIQUE INDEX "AssessmentResult_sessionId_key" ON "AssessmentResult"("sessionId");
CREATE INDEX "Subscription_visitorId_status_idx" ON "Subscription"("visitorId", "status");
CREATE UNIQUE INDEX "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");
CREATE UNIQUE INDEX "PaymentEvent_idempotencyKey_key" ON "PaymentEvent"("idempotencyKey");
CREATE INDEX "PaymentEvent_visitorId_idx" ON "PaymentEvent"("visitorId");
CREATE INDEX "PaymentEvent_sessionId_idx" ON "PaymentEvent"("sessionId");

ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentAnswer" ADD CONSTRAINT "AssessmentAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
