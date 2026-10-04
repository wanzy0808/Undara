import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import StudioPreviewFrame from "@/components/InvitationStudio/StudioPreviewFrame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview — Undara", robots: { index: false, follow: false } };

/** Authenticated shell only; event data arrives from the open Studio and is never fetched here. */
export default async function StudioPreviewPage() {
  if (!await getCurrentUser()) redirect("/login");
  return <StudioPreviewFrame />;
}
