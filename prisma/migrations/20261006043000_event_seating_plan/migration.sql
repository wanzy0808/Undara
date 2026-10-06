CREATE TABLE "SeatingPlan" (
    "invitationId" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SeatingPlan_pkey" PRIMARY KEY ("invitationId")
);

ALTER TABLE "SeatingPlan" ADD CONSTRAINT "SeatingPlan_invitationId_fkey"
FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
