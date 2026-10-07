-- Existing schedules and guest access remain unchanged until explicitly configured.
ALTER TABLE "Invitation" ADD COLUMN "weddingSessions" JSONB;
ALTER TABLE "Guest" ADD COLUMN "invitedSessions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE TABLE "GuestSessionCheckIn" (
  "id" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "session" TEXT NOT NULL,
  "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedInById" TEXT NOT NULL,
  CONSTRAINT "GuestSessionCheckIn_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GuestSessionCheckIn_session_check" CHECK ("session" IN ('ceremony', 'reception'))
);
CREATE UNIQUE INDEX "GuestSessionCheckIn_guestId_session_key" ON "GuestSessionCheckIn"("guestId", "session");
ALTER TABLE "GuestSessionCheckIn" ADD CONSTRAINT "GuestSessionCheckIn_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
