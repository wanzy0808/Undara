export type UsherGuest = {
  id: string;
  name: string;
  phone: string | null;
  rsvpStatus: string;
  plusOnes: number;
  checkedIn: boolean;
  invitedSessions?: string[];
  rsvpEvents?: string[];
  sessionCheckIns?: { session: string; checkedInAt: string }[];
  updatedAt?: string;
};

export type UsherTab =
  | "checkin"
  | "guests"
  | "attendance"
  | "rsvp"
  | "greeting"
  | "gift"
  | "giving";

export type IssuedGuestQr = {
  guest: UsherGuest;
  token: string;
} | null;
