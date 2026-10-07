import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAccountDigitalInvitation } from "@/lib/packages/server-access";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Belum login." }, { status: 401 });

  const invitationId = new URL(request.url).searchParams.get("invitationId")?.trim() || "";
  if (!invitationId) {
    return NextResponse.json({ error: "Acara wajib dipilih." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, ownerId: user.id },
    include: { payment: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
  }
  if (!(await hasAccountDigitalInvitation(user.id, invitation.payment, invitation.id))) {
    return NextResponse.json({ error: "Export tamu membutuhkan paket Digital Invitation." }, { status: 402 });
  }

  const guests = await prisma.guest.findMany({
    where: { invitationId: invitation.id },
    include: { table: true },
    orderBy: { name: "asc" },
  });
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    "Nama,Telepon,Status RSVP,Plus One,Meja",
    ...guests.map((guest) =>
      [guest.name, guest.phone ?? "", guest.rsvpStatus, String(guest.plusOnes), guest.table?.name ?? ""]
        .map(escape)
        .join(","),
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=guests-${invitation.id}.csv`,
      "Cache-Control": "private, no-store",
    },
  });
}
