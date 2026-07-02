-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('insidental', 'rutin');

-- CreateEnum
CREATE TYPE "AidType" AS ENUM ('insidental', 'rutin_bulanan');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('submitted', 'approved_for_verification', 'assigned', 'surveyed', 'approved', 'rejected', 'disbursement_pending', 'completed', 'needs_revision');

-- CreateEnum
CREATE TYPE "VerificationPriority" AS ENUM ('urgent', 'normal', 'monitor');

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('hunian', 'penyaluran', 'dokumen');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "phone" TEXT,
    "region" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProgramType" NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultNominal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalIndex" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "familyMonthlyNeed" INTEGER NOT NULL,
    "perCapitaNeed" INTEGER NOT NULL,
    "foodIndex" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mustahik" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL DEFAULT '',
    "birthDate" TEXT NOT NULL DEFAULT '',
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "housingStatus" TEXT NOT NULL,
    "rentCost" INTEGER,
    "job" TEXT NOT NULL,
    "incomeAmount" INTEGER NOT NULL,
    "incomePeriod" TEXT NOT NULL,
    "dependents" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "prayerStatus" TEXT NOT NULL,
    "smokingStatus" TEXT NOT NULL,
    "priorHelp" TEXT NOT NULL DEFAULT '',
    "publishConsent" BOOLEAN NOT NULL DEFAULT false,
    "sktmStatus" TEXT NOT NULL,
    "infoSource" TEXT NOT NULL DEFAULT '',
    "isRutin" BOOLEAN NOT NULL DEFAULT false,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mustahik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelapor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "Pelapor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AidCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "aidType" "AidType" NOT NULL DEFAULT 'insidental',
    "programId" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'submitted',
    "priority" "VerificationPriority" NOT NULL DEFAULT 'normal',
    "problem" TEXT NOT NULL,
    "nextAction" TEXT NOT NULL DEFAULT '',
    "mustahikId" TEXT NOT NULL,
    "pelaporId" TEXT,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedVerifierId" TEXT,
    "decisionNominal" INTEGER,
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AidCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldVerification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "verifierId" TEXT,
    "coverage" TEXT NOT NULL DEFAULT '',
    "verifiedAt" TIMESTAMP(3),
    "rentCost" INTEGER,
    "rentPeriod" TEXT NOT NULL DEFAULT 'tidak_sewa',
    "actualJob" TEXT NOT NULL DEFAULT '',
    "actualIncome" INTEGER NOT NULL DEFAULT 0,
    "dependentsDetail" TEXT NOT NULL DEFAULT '',
    "background" TEXT NOT NULL DEFAULT '',
    "currentCondition" TEXT NOT NULL DEFAULT '',
    "requestedNeed" TEXT NOT NULL DEFAULT '',
    "effortsTaken" TEXT NOT NULL DEFAULT '',
    "housingObservation" TEXT NOT NULL DEFAULT '',
    "lengthOfStay" TEXT NOT NULL DEFAULT '',
    "socialRecord" TEXT NOT NULL DEFAULT '',
    "recommendation" TEXT NOT NULL DEFAULT '',
    "neighborContact" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "hadKifayahValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasePhoto" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "PhotoKind" NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CasePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disbursement" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "disbursedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buktiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RutinBeneficiary" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "mustahikId" TEXT NOT NULL,
    "nominal" INTEGER NOT NULL,
    "since" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RutinBeneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RutinDisbursement" (
    "id" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "disbursedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RutinDisbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "lastDonationAt" TIMESTAMP(3),
    "totalDonation" INTEGER NOT NULL DEFAULT 0,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "programPreference" TEXT NOT NULL DEFAULT 'Umum',
    "status" TEXT NOT NULL DEFAULT 'Aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Solidaritas Insan Peduli',
    "legalName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Program_name_key" ON "Program"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalIndex_city_key" ON "RegionalIndex"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Mustahik_nik_key" ON "Mustahik"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "AidCase_caseNumber_key" ON "AidCase"("caseNumber");

-- CreateIndex
CREATE INDEX "AidCase_status_idx" ON "AidCase"("status");

-- CreateIndex
CREATE INDEX "AidCase_programId_idx" ON "AidCase"("programId");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldVerification_caseId_key" ON "FieldVerification"("caseId");

-- CreateIndex
CREATE INDEX "CasePhoto_caseId_idx" ON "CasePhoto"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Disbursement_caseId_key" ON "Disbursement"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "RutinBeneficiary_programId_mustahikId_key" ON "RutinBeneficiary"("programId", "mustahikId");

-- CreateIndex
CREATE INDEX "RutinDisbursement_period_idx" ON "RutinDisbursement"("period");

-- CreateIndex
CREATE UNIQUE INDEX "RutinDisbursement_beneficiaryId_period_key" ON "RutinDisbursement"("beneficiaryId", "period");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mustahik" ADD CONSTRAINT "Mustahik_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "RegionalIndex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AidCase" ADD CONSTRAINT "AidCase_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AidCase" ADD CONSTRAINT "AidCase_mustahikId_fkey" FOREIGN KEY ("mustahikId") REFERENCES "Mustahik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AidCase" ADD CONSTRAINT "AidCase_pelaporId_fkey" FOREIGN KEY ("pelaporId") REFERENCES "Pelapor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AidCase" ADD CONSTRAINT "AidCase_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AidCase" ADD CONSTRAINT "AidCase_assignedVerifierId_fkey" FOREIGN KEY ("assignedVerifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AidCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVerification" ADD CONSTRAINT "FieldVerification_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AidCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldVerification" ADD CONSTRAINT "FieldVerification_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasePhoto" ADD CONSTRAINT "CasePhoto_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AidCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AidCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutinBeneficiary" ADD CONSTRAINT "RutinBeneficiary_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutinBeneficiary" ADD CONSTRAINT "RutinBeneficiary_mustahikId_fkey" FOREIGN KEY ("mustahikId") REFERENCES "Mustahik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RutinDisbursement" ADD CONSTRAINT "RutinDisbursement_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "RutinBeneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
