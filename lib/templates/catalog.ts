import type { CroppablePhotoSlot, PhotoSlot } from "@/lib/templates/photo-slots";
import type { FontKey, PaletteKey } from "@/lib/templates/design";
import type { InvitationTemplateLayout } from "@/components/InvitationStudio/designer-types";
import { isEventCategory, type EventCategory } from "@/lib/events/catalog";

const weddingTemplateEventCategories: readonly EventCategory[] = ["WEDDING"];

export type InvitationTemplate = {
  key: string;
  name: string;
  description: string;
  descriptionEn?: string;
  previewImage: string;
  assetPath: string;
  category: string;
  /** Event compatibility is separate from the visual category (Floral, Modern, etc.). */
  eventCategories: readonly EventCategory[];
  previewType: "public" | "studio";
  photoSlots: PhotoSlot[];
  /** Slots whose image sizing actually responds to a custom crop aspect ratio. */
  photoCropAspectSlots?: CroppablePhotoSlot[];
  usesPhotos: boolean;
  preset: { layout: InvitationTemplateLayout; palette: PaletteKey; font: FontKey };
};

export const blankCanvasTemplate: InvitationTemplate = {
  key: "blank-canvas",
  category: "Studio",
  // A blank custom canvas has no catalog event category; it is only an authoring base.
  eventCategories: [],
  previewType: "studio",
  usesPhotos: false,
  photoSlots: [],
  preset: { layout: "editorial", palette: "pearl", font: "cinzelFauna" },
  name: "Canvas Kosong",
  description: "Canvas kosong untuk membangun desain dari nol di Studio.",
  descriptionEn: "A blank canvas for building a design from scratch in Studio.",
  previewImage: "/assets/landing/ornaments/legacy/flower.webp",
  assetPath: "",
};

export const invitationTemplates: InvitationTemplate[] = [
  {
    key: "romantic-rose",
    category: "Floral",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    photoCropAspectSlots: ["personOne", "personTwo"],
    preset: { layout: "editorial", palette: "blush", font: "cinzelFauna" },
    name: "Romantic Rose",
    description: "Rose garden klasik dengan blush pink, kelopak lembut, garis ornamental, dan sentuhan romantis yang anggun.",
    descriptionEn: "A classic rose-garden aesthetic with blush pink, soft petals, ornamental lines, and an elegant romantic mood.",
    previewImage: "/assets/demo/invitation/couple.webp",
    assetPath: "/templates/romantic-rose",
  },
  {
    key: "botanical-ivory",
    category: "Botanical",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "botanical", palette: "botanical", font: "rufinaAverage" },
    name: "Botanical Ivory",
    description:
      "Palet ivory hangat dengan tipografi editorial, simbol cincin dan pita, serta aksen botanical yang ringan dan refined.",
    descriptionEn:
      "A warm ivory palette with editorial typography, rings and ribbon motifs, and restrained botanical accents.",
    previewImage:
      "/templates/botanical-ivory/greenplant.webp",
    assetPath: "/templates/botanical-ivory",
  },
  {
    key: "eternal-blossom",
    category: "Floral",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    photoCropAspectSlots: ["personOne", "personTwo"],
    preset: { layout: "editorial", palette: "blossom", font: "playfairLora" },
    name: "Eternal Blossom",
    description: "Bunga blush, bingkai scallop, tekstur lembut, dan ritme visual romantis dengan gerak yang halus.",
    descriptionEn: "Blush blossoms, scalloped framing, soft textures, and a romantic visual rhythm with restrained motion.",
    previewImage:
      "/assets/demo/invitation/couple-03.webp",
    assetPath: "/templates/eternal-blossom",
  },
  {
    key: "modern-maroon",
    category: "Modern",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    preset: { layout: "maroon", palette: "maroon", font: "syneInter" },
    name: "Modern Maroon",
    description: "Komposisi editorial maroon yang asimetris dengan layering tegas, tipografi berani, dan ritme visual ala majalah.",
    descriptionEn: "An asymmetric maroon editorial with bold layering, strong typography, and a magazine-inspired visual rhythm.",
    previewImage:
      "/assets/demo/invitation/couple-02.webp",
    assetPath: "/templates/modern-maroon",
  },
  {
    key: "garden-light",
    category: "Botanical",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    photoCropAspectSlots: ["personOne", "personTwo"],
    preset: { layout: "garden", palette: "gardenGlow", font: "youngInstrument" },
    name: "Garden Light",
    description: "Nuansa pesta taman dari golden hour menuju senja, dengan wedding arch bercahaya, lentera, ayunan, fountain, dan atmosfer hangat.",
    descriptionEn: "A golden-hour-to-twilight garden mood with a glowing wedding arch, lanterns, swing, fountain, and a warm atmosphere.",
    previewImage:
      "/templates/garden-light/10_romantic_lit_wedding_arch.webp",
    assetPath: "/templates/garden-light",
  },
  {
    key: "midnight-romance",
    category: "Modern",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    photoCropAspectSlots: ["personOne", "personTwo"],
    preset: { layout: "midnight", palette: "midnightVelvet", font: "bodoniManrope" },
    name: "Midnight Romance",
    description: "Salon malam yang intim dengan navy velvet, burgundy, cahaya lilin, detail baroque, dan komposisi editorial dramatis.",
    descriptionEn: "An intimate midnight salon of navy velvet, burgundy, candlelight, baroque details, and dramatic editorial composition.",
    previewImage:
      "/templates/midnight-romance/04_navy_rose_wedding_arch.webp",
    assetPath: "/templates/midnight-romance",
  },
  {
    key: "classic-pearl",
    category: "Classic",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "classic", palette: "pearlAtelier", font: "cormorantManrope" },
    name: "Classic Pearl",
    description: "Atelier klasik dengan porcelain ivory, champagne gold, mutiara, detail bridal, dan komposisi heirloom yang mewah.",
    descriptionEn: "A classic atelier of porcelain ivory, champagne gold, pearls, bridal details, and luxurious heirloom composition.",
    previewImage:
      "/templates/classic-pearl/08_ivory_gold_wedding_arch.webp",
    assetPath: "/templates/classic-pearl",
  },
  {
    key: "golden-art-deco",
    category: "Art Deco",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "classic", palette: "decoNoir", font: "poiretMontserrat" },
    name: "Golden Art Deco",
    description: "Poster soirée 1920-an dengan noir lacquer, champagne gold, arsitektur Gatsby, garis geometris, dan komposisi editorial glamor.",
    descriptionEn: "A 1920s soirée poster of lacquered noir, champagne gold, Gatsby architecture, geometric lines, and glamorous editorial composition.",
    previewImage: "/templates/golden-art-deco/01_gatsby_archway.webp",
    assetPath: "/templates/golden-art-deco",
  },
  {
    key: "paper-cut-botanical",
    category: "Illustration",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "garden", palette: "paperMeadow", font: "yesevaJosefin" },
    name: "Paper Cut Botanical",
    description: "Teater kertas botani berlapis dengan ilustrasi pasangan, pita, tiket kenangan, tekstur cut-paper, dan komposisi editorial puitis.",
    descriptionEn: "A layered botanical paper theatre with illustrated couple art, ribbon, keepsake tickets, cut-paper texture, and poetic editorial composition.",
    previewImage: "/templates/paper-cut-botanical/01_story_couple.webp",
    assetPath: "/templates/paper-cut-botanical",
  },
  {
    key: "pencil-reverie",
    category: "Illustration",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "editorial", palette: "pencil", font: "youngInstrument" },
    name: "Pencil Reverie",
    description: "Sketchbook romansa editorial dengan lembar catatan, sketsa pasangan, benda kenangan vintage, motion halus, dan tekstur graphite yang intim.",
    descriptionEn: "An editorial romance sketchbook of paper notes, couple sketches, vintage keepsakes, restrained motion, and intimate graphite texture.",
    previewImage: "/templates/pencil-reverie/couplesitting.webp",
    assetPath: "/templates/pencil-reverie",
  },
  {
    key: "zen-atelier",
    category: "Zen",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "gallery"],
    preset: { layout: "botanical", palette: "zen", font: "playfairInter" },
    name: "Zen Atelier",
    description: "Atelier Jepang dengan washi, mizuhiki, red sun, lanskap tinta, komposisi asimetris, dan suasana zen yang tenang.",
    descriptionEn: "A Japanese atelier of washi, mizuhiki, red sun, ink landscapes, asymmetric composition, and a calm zen atmosphere.",
    previewImage: "/api/template-preview/zen-atelier",
    assetPath: "/templates/zen-atelier",
  },
  {
    key: "velvet-horizon",
    category: "Romantic",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    photoCropAspectSlots: ["personOne", "personTwo"],
    preset: { layout: "editorial", palette: "velvetHorizon", font: "cormorantManrope" },
    name: "Velvet Horizon",
    description: "Senja Mediterranean yang hangat dengan dusty rose velvet, lengkung arsitektur klasik, cahaya lilin, florals lembut, dan komposisi editorial romantis.",
    descriptionEn: "A warm Mediterranean sunset of dusty-rose velvet, classical arches, candlelight, soft florals, and romantic editorial composition.",
    previewImage: "/api/template-preview/velvet-horizon",
    assetPath: "/templates/velvet-horizon",
  },
  {
    key: "celestial-ink",
    category: "Celestial",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: false,
    photoSlots: [],
    preset: { layout: "midnight", palette: "celestialIndigo", font: "cinzelFauna" },
    name: "Celestial Ink",
    description: "Paviliun seremoni malam dengan indigo pekat, moon gate asimetris, folding screen, drapery, lentera, dan komposisi editorial atmosferik.",
    descriptionEn: "A moonlit ceremonial pavilion of deep indigo, an asymmetric moon gate, folding screens, drapery, lantern light, and atmospheric editorial composition.",
    previewImage: "/templates/celestial-ink/10_celestial_moon_gate.webp",
    assetPath: "/templates/celestial-ink",
  },
  {
    key: "serein",
    category: "Editorial",
    eventCategories: weddingTemplateEventCategories,
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "personOne", "personTwo", "gallery"],
    preset: { layout: "editorial", palette: "serein", font: "crimsonDmSans" },
    name: "Serein",
    description: "Stationery bersegel dengan tipografi editorial, palet monochrome, tekstur kertas ivory, dan nuansa surat cinta klasik.",
    descriptionEn: "Sealed stationery with editorial typography, a monochrome palette, ivory paper texture, and a classic love-letter mood.",
    previewImage: "/assets/demo/invitation/couple.webp",
    assetPath: "/templates/serein",
  },
  {
    key: "confetti-club",
    category: "Birthday",
    eventCategories: ["BIRTHDAY"],
    previewType: "public",
    usesPhotos: true,
    photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "confetti", font: "syneInter" },
    name: "Confetti Club",
    description: "Undangan ulang tahun ceria dengan amplop hadiah, ilustrasi kue, tipografi besar, dan album kenangan.",
    descriptionEn: "A cheerful birthday invitation with a gift envelope, cake illustration, bold typography, and a memory album.",
    previewImage: "/templates/confetti-club/preview.svg",
    assetPath: "/templates/confetti-club",
  },

  {
    key: "silver-reverie", name: "Silver Reverie",
    description: "Perayaan Silver Wedding dengan kertas perak, foto editorial, dan lembar kenangan.",
    descriptionEn: "Silver Wedding stationery with silver paper, editorial portraits and a memory album.",
    category: "Anniversary", eventCategories: ["SILVER_WEDDING"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "silverReverie", font: "cormorantManrope" },
    previewImage: "/templates/silver-reverie/preview.svg", assetPath: "/templates/silver-reverie",
  },
  {
    key: "golden-keepsake", name: "Golden Keepsake",
    description: "Folio Golden Wedding bernuansa emas hangat, lipatan kipas, dan album sepanjang waktu.",
    descriptionEn: "A warm Golden Wedding folio with golden paper fans and an album through time.",
    category: "Anniversary", eventCategories: ["GOLDEN_WEDDING"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "goldenKeepsake", font: "playfairInter" },
    previewImage: "/templates/golden-keepsake/preview.svg", assetPath: "/templates/golden-keepsake",
  },

  {
    key: "little-cloud", name: "Little Cloud",
    description: "Baby Shower lembut dengan bulan gantung, awan berlapis, dan cerita keluarga.",
    descriptionEn: "A gentle Baby Shower with a paper moon mobile, layered clouds and family stories.",
    category: "Family", eventCategories: ["BABY_SHOWER"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "littleCloud", font: "youngInstrument" },
    previewImage: "/templates/little-cloud/preview.svg", assetPath: "/templates/little-cloud",
  },
  {
    key: "gathering", name: "Gathering",
    description: "Poster perayaan modern untuk acara lainnya, dengan lipatan kertas dan roset geometris.",
    descriptionEn: "A modern event poster with folded paper, geometric rosettes and bold typography.",
    category: "Celebration", eventCategories: ["OTHER"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "gathering", font: "syneInter" },
    previewImage: "/templates/gathering/preview.svg", assetPath: "/templates/gathering",
  },
  {
    key: "taman-doa", name: "Taman Doa",
    description: "Syukuran khitanan dengan taman kertas hijau, lengkung hangat, layang-layang, dan doa keluarga.",
    descriptionEn: "A khitan celebration with a green paper garden, warm arches, a kite and family wishes.",
    category: "Family", eventCategories: ["KHITANAN"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "tamanDoa", font: "youngInstrument" },
    previewImage: "/templates/taman-doa/preview.svg", assetPath: "/templates/taman-doa",
  },
  {
    key: "red-thread", name: "Red Thread",
    description: "Undangan sangjit dengan folio merah, simpul emas, awan ornamental, dan cerita dua keluarga.",
    descriptionEn: "A sangjit invitation with a crimson folio, golden knots, cloud ornaments and two family stories.",
    category: "Celebration", eventCategories: ["SANGJIT"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "redThread", font: "bodoniManrope" },
    previewImage: "/templates/red-thread/preview.svg", assetPath: "/templates/red-thread",
  },
  {
    key: "serambi-pagi", name: "Serambi Pagi",
    description: "Syukuran khitanan di serambi batu yang terang, dengan dedaunan zaitun dan kertas katun.",
    descriptionEn: "A sunlit stone courtyard, olive branches and cotton stationery for a khitan celebration.",
    category: "Family", eventCategories: ["KHITANAN"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "serambiPagi", font: "cormorantManrope" },
    previewImage: "/templates/serambi-pagi/scene.webp", assetPath: "/templates/serambi-pagi",
  },
  {
    key: "rumah-senja", name: "Rumah Senja",
    description: "Hangatnya beranda jati, batik, dan melati dalam undangan khitanan bernuansa rumah keluarga.",
    descriptionEn: "Teak, batik and jasmine bring the warmth of a family veranda to a khitan invitation.",
    category: "Family", eventCategories: ["KHITANAN"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "rumahSenja", font: "rufinaAverage" },
    previewImage: "/templates/rumah-senja/scene.webp", assetPath: "/templates/rumah-senja",
  },
  {
    key: "langit-safari", name: "Langit Safari",
    description: "Mainan satwa kayu, linen, dan warna sage untuk khitanan yang ceria dan lembut.",
    descriptionEn: "Wooden animal toys, linen and soft sage make a cheerful, gentle khitan celebration.",
    category: "Family", eventCategories: ["KHITANAN"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "langitSafari", font: "youngInstrument" },
    previewImage: "/templates/langit-safari/scene.webp", assetPath: "/templates/langit-safari",
  },
  {
    key: "purnama-biru", name: "Purnama Biru",
    description: "Lengkung biru malam dan cahaya lentera kuningan untuk syukuran khitanan yang tenang.",
    descriptionEn: "Midnight arches and warm brass lanterns for a quiet, thoughtful khitan celebration.",
    category: "Family", eventCategories: ["KHITANAN"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "purnamaBiru", font: "crimsonDmSans" },
    previewImage: "/templates/purnama-biru/scene.webp", assetPath: "/templates/purnama-biru",
  },
  {
    key: "giok-abadi", name: "Giok Abadi",
    description: "Porselen celadon, magnolia, dan sutra hijau giok dalam pertemuan dua keluarga.",
    descriptionEn: "Celadon porcelain, magnolia and jade silk for a gathering of two families.",
    category: "Celebration", eventCategories: ["SANGJIT"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "giokAbadi", font: "bodoniManrope" },
    previewImage: "/templates/giok-abadi/scene.webp", assetPath: "/templates/giok-abadi",
  },
  {
    key: "peony-silk", name: "Peony Silk",
    description: "Peony blush, pita champagne, dan lipatan sutra yang lembut untuk undangan sangjit.",
    descriptionEn: "Blush peonies, champagne ribbons and soft silk folds for a sangjit invitation.",
    category: "Celebration", eventCategories: ["SANGJIT"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "peonySilk", font: "playfairLora" },
    previewImage: "/templates/peony-silk/scene.webp", assetPath: "/templates/peony-silk",
  },
  {
    key: "imperial-crimson", name: "Imperial Crimson",
    description: "Lacquer merah tua, baki teh, dan simpul sutra dengan detail emas dalam perayaan sangjit.",
    descriptionEn: "Deep red lacquer, a tea tray and silk knots with gold details for a sangjit celebration.",
    category: "Celebration", eventCategories: ["SANGJIT"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "imperialCrimson", font: "cormorantManrope" },
    previewImage: "/templates/imperial-crimson/scene.webp", assetPath: "/templates/imperial-crimson",
  },
  {
    key: "porcelain-bloom", name: "Porcelain Bloom",
    description: "Porselen biru putih, bunga plum, dan kertas gading dalam undangan sangjit bergaya editorial.",
    descriptionEn: "Blue-and-white porcelain, plum blossoms and ivory paper in an editorial sangjit invitation.",
    category: "Celebration", eventCategories: ["SANGJIT"], previewType: "public",
    usesPhotos: true, photoSlots: ["cover", "gallery"],
    preset: { layout: "editorial", palette: "porcelainBloom", font: "cardoHind" },
    previewImage: "/templates/porcelain-bloom/scene.webp", assetPath: "/templates/porcelain-bloom",
  },
];

export function templateSupportsEventCategory(
  template: { eventCategories?: readonly EventCategory[] },
  category: unknown,
) {
  return isEventCategory(category)
    && template.eventCategories?.length === 1
    && template.eventCategories[0] === category;
}

export function templatesForEvent<T extends { eventCategories?: readonly EventCategory[] }>(
  templates: T[],
  category?: string,
): T[] {
  return category === undefined ? templates : templates.filter((item) => templateSupportsEventCategory(item, category));
}

export function isInvitationTemplateCompatible(designKey: string, category: unknown) {
  const baseKey = designKey.split("::")[0];
  // Explicit Owner/custom assignment and continued editing of a blank canvas keep
  // their existing permission checks. It is never a default or shared catalog choice.
  if (baseKey === blankCanvasTemplate.key) return isEventCategory(category);
  const template = invitationTemplates.find((item) => item.key === baseKey);
  return Boolean(template && templateSupportsEventCategory(template, category));
}

export function defaultInvitationTemplateForEvent(category: unknown) {
  return invitationTemplates.find((item) => item.key === "botanical-ivory" && templateSupportsEventCategory(item, category))
    ?? invitationTemplates.find((item) => templateSupportsEventCategory(item, category))
    ?? null;
}

/** Older assigned designs can still be edited; this never permits a new incompatible theme. */
export function canContinueInvitationTemplate(designKey: string, savedKey: string, category: unknown) {
  const baseKey = designKey.split("::")[0];
  return (baseKey !== blankCanvasTemplate.key && isInvitationTemplateCompatible(designKey, category))
    || Boolean(savedKey && baseKey === savedKey.split("::")[0]);
}

export function supportsPhotoCropAspect(key: string, slot: PhotoSlot) {
  if (slot === "gallery") return false;
  const template = invitationTemplates.find((item) => item.key === key.split("::")[0]);
  return template?.photoCropAspectSlots?.includes(slot) ?? false;
}

export function getInvitationTemplate(key: string) {
  const baseKey = key.split("::")[0];
  if (baseKey === blankCanvasTemplate.key) return blankCanvasTemplate;
  return (
    invitationTemplates.find((template) => template.key === baseKey) ??
    invitationTemplates[0]
  );
}
