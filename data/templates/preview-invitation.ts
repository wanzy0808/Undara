import type { InvitationDesignerInvitation } from "@/components/InvitationStudio/designer-types";
import { getInvitationTemplate } from "@/lib/templates/catalog";

/**
 * Isolated gallery/master/QA fixture. Never read from or write to a customer's invitation.
 * The following photos are existing local public demo assets, not customer uploads.
 */
export const templateDemoPhoto = "/assets/demo/invitation/couple.webp";

export const templateDemoInvitation: InvitationDesignerInvitation = {
  id: "gallery-preview-only",
  slug: "gallery-preview-only",
  type: "WEDDING",
  title: "Pernikahan Una & Dara",
  eventCategory: "WEDDING",
  groomName: "Una",
  brideName: "Dara",
  venue: "Taman Senja",
  address: "Jakarta, Indonesia",
  mapUrl: null,
  timezone: "Asia/Jakarta",
  eventDate: "2027-06-12T10:00:00+07:00",
  ceremonyTime: "10:00",
  receptionTime: "12:00",
  description: "Dengan penuh sukacita, kami mengundang Anda untuk hadir dan merayakan hari istimewa bersama kami.",
  weddingHashtag: null,
  dressCode: null,
  eventNotes: null,
  musicUrl: null,
  templateKey: "",
  isPublished: false,
  accessPaid: false,
  giftBankName: null,
  giftAccountName: null,
  giftAccountNumber: null,
  assets: [
    { id: "gallery-demo-cover", type: "IMAGE", url: templateDemoPhoto, title: "Foto contoh" },
    { id: "gallery-demo-second", type: "IMAGE", url: "/assets/demo/invitation/person-one.webp", title: "Foto contoh mempelai pertama" },
    { id: "gallery-demo-third", type: "IMAGE", url: "/assets/demo/invitation/person-two.webp", title: "Foto contoh mempelai kedua" },
    { id: "gallery-demo-fourth", type: "IMAGE", url: "/assets/demo/invitation/couple-02.webp", title: "Foto contoh pasangan" },
    { id: "gallery-demo-fifth", type: "IMAGE", url: "/assets/demo/invitation/couple-03.webp", title: "Foto contoh pasangan" },
  ],
};

/** Birthday previews have one honoree; the persistence type is a legacy field. */
export const birthdayTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation,
  id: "birthday-gallery-preview-only",
  slug: "birthday-gallery-preview-only",
  title: "Ulang Tahun Dara",
  eventCategory: "BIRTHDAY",
  groomName: "Dara",
  brideName: "",
  venue: "Rumah Cerita",
  eventDate: "2027-06-12T16:00:00+07:00",
  ceremonyTime: "16:00",
  receptionTime: "END",
  description: null,
  assets: [
    { id: "birthday-demo-cover", type: "IMAGE", url: "/assets/demo/invitation/person-two.webp", title: "Potret contoh" },
    { id: "birthday-demo-memory", type: "IMAGE", url: "/assets/demo/invitation/person-one.webp", title: "Kenangan bersama teman" },
  ],
};

export const silverTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "silver-gallery-preview-only", slug: "silver-gallery-preview-only",
  eventCategory: "SILVER_WEDDING", title: "Hari Jadi Pernikahan Una & Dara",
  description: null, ceremonyTime: "16:00", receptionTime: "END",
};
export const goldenTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "golden-gallery-preview-only", slug: "golden-gallery-preview-only",
  eventCategory: "GOLDEN_WEDDING", title: "Perayaan Kebersamaan Una & Dara",
  description: null, ceremonyTime: "17:00", receptionTime: "END",
};

export const babyTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "baby-gallery-preview-only", slug: "baby-gallery-preview-only",
  eventCategory: "BABY_SHOWER", title: "Menyambut Si Kecil", groomName: "Dara", brideName: "",
  description: null, venue: "Rumah Cerita", ceremonyTime: "15:00", receptionTime: "END",
  assets: [],
};
export const gatheringTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "gathering-gallery-preview-only", slug: "gathering-gallery-preview-only",
  eventCategory: "OTHER", title: "Temu Cerita", groomName: "", brideName: "",
  description: null, venue: "Rumah Cerita", ceremonyTime: "16:00", receptionTime: "END",
  assets: [],
};

export const khitananTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "khitanan-gallery-preview-only", slug: "khitanan-gallery-preview-only",
  eventCategory: "KHITANAN", title: "Khitanan Una", brideName: "",
  description: null, venue: "Taman Keluarga", eventDate: "2027-07-18T10:00:00+07:00",
  ceremonyTime: "10:00", receptionTime: "END", assets: [],
};
export const sangjitTemplateDemoInvitation: InvitationDesignerInvitation = {
  ...templateDemoInvitation, id: "sangjit-gallery-preview-only", slug: "sangjit-gallery-preview-only",
  eventCategory: "SANGJIT", title: "Sangjit Una & Dara",
  description: null, venue: "Rumah Keluarga", eventDate: "2027-08-21T10:00:00+07:00",
  ceremonyTime: "10:00", receptionTime: "13:00", assets: [],
};

export function getTemplateDemoInvitation(templateKey: string): InvitationDesignerInvitation {
  const key = templateKey.split("::")[0];
  const category = getInvitationTemplate(key).eventCategories[0];
  if (category === "KHITANAN") return khitananTemplateDemoInvitation;
  if (category === "SANGJIT") return sangjitTemplateDemoInvitation;
  if (key === "little-cloud") return babyTemplateDemoInvitation;
  if (key === "gathering") return gatheringTemplateDemoInvitation;
  if (key === "silver-reverie") return silverTemplateDemoInvitation;
  if (key === "golden-keepsake") return goldenTemplateDemoInvitation;
  return key === "confetti-club"
    ? birthdayTemplateDemoInvitation
    : templateDemoInvitation;
}


/** Follow master theme selection/Undo without replacing customer/custom event data. */
export function resolveTemplateStudioDemo(current: InvitationDesignerInvitation, templateKey: string): InvitationDesignerInvitation {
  const fixture = getTemplateDemoInvitation(templateKey);
  const demos = [templateDemoInvitation, birthdayTemplateDemoInvitation, silverTemplateDemoInvitation, goldenTemplateDemoInvitation, babyTemplateDemoInvitation, gatheringTemplateDemoInvitation, khitananTemplateDemoInvitation, sangjitTemplateDemoInvitation];
  const demoIds = new Set(demos.flatMap((demo) => demo.assets.map((asset) => asset.id)));
  return {
    ...current, ...fixture,
    id: current.id, slug: current.slug, templateKey: current.templateKey, accessPaid: current.accessPaid,
    assets: [...fixture.assets, ...current.assets.filter((asset) => !demoIds.has(asset.id))],
  };
}
