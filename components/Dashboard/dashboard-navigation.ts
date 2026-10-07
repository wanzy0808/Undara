import {
  CalendarDays,
  ContactRound,
  Mail,
  MessageSquareHeart,
  QrCode,
  Send,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { DashboardTab } from "@/components/Dashboard/dashboard-types";

export type DashboardNavItem = {
  id: DashboardTab;
  label: string;
  icon: LucideIcon;
};

export const invitationTabs = new Set<DashboardTab>([
  "events",
  "invitation",
  "waBlast",
]);

export const invitationNav: DashboardNavItem[] = [
  { id: "events", label: "Rangkaian Acara", icon: CalendarDays },
  { id: "invitation", label: "Undangan", icon: Mail },
  { id: "waBlast", label: "WA Blast", icon: Send },
];

export const guestManagementTabs = new Set<DashboardTab>([
  "personalInvitation",
  "placement",
]);

export const guestManagementNav: DashboardNavItem[] = [
  { id: "personalInvitation", label: "Undangan Personal", icon: ContactRound },
  { id: "placement", label: "Pengaturan Meja", icon: Users },
];

export const secondaryNav: DashboardNavItem[] = [
  { id: "rsvp", label: "RSVP", icon: MessageSquareHeart },
  { id: "usher", label: "Usher App", icon: QrCode },
];

export const dashboardTabMeta: Record<
  DashboardTab,
  { eyebrow: string; title: string }
> = {
  overview: { eyebrow: "Dashboard", title: "Beranda" },
  profile: { eyebrow: "Akun", title: "Profil Saya" },
  events: { eyebrow: "Persiapan", title: "Rangkaian Acara" },
  invitation: { eyebrow: "Publikasi", title: "Undangan" },
  personalInvitation: { eyebrow: "Tamu", title: "Undangan Personal" },
  waBlast: { eyebrow: "Distribusi", title: "WA Blast" },
  rsvp: { eyebrow: "Kehadiran", title: "RSVP" },
  placement: { eyebrow: "Tamu", title: "Pengaturan Meja" },
  usher: { eyebrow: "Hari-H", title: "Usher App" },
};


export function dashboardTabFromSearch(search: string): DashboardTab {
  const requested = new URLSearchParams(search).get("tab");
  return requested && Object.prototype.hasOwnProperty.call(dashboardTabMeta, requested)
    ? requested as DashboardTab
    : "overview";
}

export function dashboardHrefForTab(tab: DashboardTab, currentSearch = "") {
  const params = new URLSearchParams(currentSearch);
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);
  const query = params.toString();
  return `/dashboard${query ? `?${query}` : ""}`;
}
