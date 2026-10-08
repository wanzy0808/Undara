/**
 * Template-owned narrative slots. Event identity, parents, date, venue, RSVP,
 * payment and section headings are NOT editable through Studio's Isi panel.
 * Keep this registry aligned with text that the real public renderer actually uses.
 */
export const editableInvitationCopyFields = ["greeting", "closing", "ourStory", "zenQuote", "attendanceRequest", "prayerWish"] as const;
export type EditableInvitationCopyField = (typeof editableInvitationCopyFields)[number];
export type EditableInvitationCopy = Partial<Record<EditableInvitationCopyField, string>>;

export const editableCopyMaxLength: Record<EditableInvitationCopyField, number> = {
  greeting: 360,
  closing: 320,
  ourStory: 1600,
  zenQuote: 240,
  attendanceRequest: 360,
  prayerWish: 320,
};

export function availableEditableCopyFields(templateKey: string, isWedding = true): EditableInvitationCopyField[] {
  const common: EditableInvitationCopyField[] = ["greeting", "attendanceRequest", "prayerWish", "closing"];
  if (!isWedding) return common;
  return templateKey === "zen-atelier"
    ? [...common, "ourStory", "zenQuote"]
    : [...common, "ourStory"];
}

const familyStationeryCopyDefaults: Record<string, EditableInvitationCopy> = {
  "cherry-picnic": {
    greeting: "Ada kue, cerita, dan satu hari ulang tahun yang ingin kami rayakan bersama Anda.",
    attendanceRequest: "Mari luangkan waktu untuk menikmati perayaan kecil ini bersama orang-orang tersayang.",
    prayerWish: "Semoga tahun yang baru membawa kesehatan, hari yang hangat, dan banyak cerita baik.",
    closing: "Terima kasih sudah ikut merayakan. Kami menantikan tawa dan cerita Anda di pesta.",
  },
  "velvet-wish": {
    greeting: "Satu tahun lagi, satu kesempatan untuk merayakan hidup bersama orang-orang yang berarti.",
    attendanceRequest: "Kehadiran Anda akan melengkapi perayaan ulang tahun yang kami nantikan.",
    prayerWish: "Semoga tahun ini dipenuhi ketenangan, kesehatan, dan harapan yang menemukan jalannya.",
    closing: "Terima kasih untuk setiap harapan baik. Sampai bertemu di hari perayaan.",
  },
  "little-parade": {
    greeting: "Ada pesta kecil dengan banyak tawa! Kami mengundang Anda untuk merayakan ulang tahun si kecil bersama keluarga.",
    attendanceRequest: "Yuk, datang untuk berbagi kue, bermain, dan mengisi hari ini dengan senyum.",
    prayerWish: "Semoga si kecil tumbuh sehat, penuh rasa ingin tahu, dan selalu dikelilingi kasih sayang.",
    closing: "Terima kasih sudah ikut menambah bahagia. Sampai bertemu di pesta kecil kami!",
  },
  "disco-bloom": {
    greeting: "Saatnya merayakan satu tahun penuh cerita. Mari berbagi musik, tawa, dan hari ulang tahun bersama kami.",
    attendanceRequest: "Datang dan ikut merayakan. Pesta ini akan terasa lebih lengkap bersama Anda.",
    prayerWish: "Semoga tahun yang baru membawa keberanian, kesempatan baik, dan banyak alasan untuk tersenyum.",
    closing: "Terima kasih atas doa dan kebersamaannya. Sampai bertemu, kita rayakan bersama!",
  },
  "serambi-pagi": {
    greeting: "Di antara doa dan rasa syukur, kami mengundang Anda untuk merayakan khitanan putra kami.",
    attendanceRequest: "Mari hadir dan berbagi hari yang hangat bersama keluarga kami.",
    prayerWish: "Semoga langkah kecilnya selalu dipenuhi kesehatan, kebaikan, dan kasih sayang.",
    closing: "Terima kasih telah mengiringi hari ini dengan kehadiran dan doa yang baik.",
  },
  "rumah-senja": {
    greeting: "Dengan rasa syukur, keluarga kami membuka pintu untuk berbagi kebahagiaan pada syukuran khitanan putra kami.",
    attendanceRequest: "Luangkan waktu untuk berkumpul, berbagi cerita, dan mendoakan putra kami.",
    prayerWish: "Semoga ia tumbuh menjadi anak yang sehat, santun, dan membawa kebaikan bagi sesama.",
    closing: "Kehadiran Anda membuat rumah dan hati kami semakin hangat. Terima kasih atas doanya.",
  },
  "langit-safari": {
    greeting: "Ada langkah baru dalam cerita si kecil. Dengan bahagia, kami mengundang Anda ke syukuran khitanannya.",
    attendanceRequest: "Yuk, hadir untuk berbagi tawa, kebersamaan, dan doa yang baik bersama kami.",
    prayerWish: "Semoga rasa ingin tahunya tumbuh bersama hati yang baik dan tubuh yang sehat.",
    closing: "Terima kasih sudah ikut merayakan satu langkah kecil yang begitu berarti bagi keluarga kami.",
  },
  "purnama-biru": {
    greeting: "Kami mengundang Anda untuk berbagi rasa syukur dan doa pada khitanan putra kami.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian berharga dari hari yang kami nantikan.",
    prayerWish: "Semoga hidupnya selalu diterangi kebaikan, kesehatan, dan doa orang-orang tersayang.",
    closing: "Terima kasih untuk setiap doa yang mengiringi langkahnya. Kami menantikan kebersamaan dengan Anda.",
  },
  "giok-abadi": {
    greeting: "Dengan penuh rasa syukur, kami mengundang Anda untuk menyaksikan pertemuan kedua keluarga dalam acara sangjit kami.",
    attendanceRequest: "Mari berbagi kebahagiaan dan menjadi bagian dari hari yang berarti bagi kedua keluarga.",
    prayerWish: "Semoga ikatan ini tumbuh dalam keharmonisan, saling menghormati, dan kasih yang hangat.",
    closing: "Terima kasih telah menyertai pertemuan ini dengan kehadiran dan harapan baik Anda.",
  },
  "peony-silk": {
    greeting: "Dengan hangat, kami mengundang Anda untuk merayakan ikatan kedua keluarga pada acara sangjit kami.",
    attendanceRequest: "Kehadiran Anda akan melengkapi hari yang kami susun dengan kasih dan rasa syukur.",
    prayerWish: "Semoga kebersamaan ini selalu dipenuhi kelembutan, pengertian, dan kasih yang terus tumbuh.",
    closing: "Terima kasih telah berbagi kebahagiaan bersama kedua keluarga kami. Sampai bertemu.",
  },
  "imperial-crimson": {
    greeting: "Dua keluarga berkumpul untuk merayakan sebuah ikatan. Dengan hormat, kami mengundang Anda ke acara sangjit kami.",
    attendanceRequest: "Mari hadir dan berbagi hari penuh makna bersama kedua keluarga kami.",
    prayerWish: "Semoga ikatan yang dirayakan membawa kebahagiaan, keharmonisan, dan rasa saling menjaga.",
    closing: "Terima kasih atas kehadiran dan doa baik Anda untuk kedua keluarga kami.",
  },
  "porcelain-bloom": {
    greeting: "Kami mengundang Anda untuk menjadi bagian dari pertemuan kedua keluarga pada hari sangjit kami.",
    attendanceRequest: "Kehadiran Anda akan menambah hangat cerita yang kami rayakan bersama keluarga.",
    prayerWish: "Semoga setiap langkah bersama selalu membawa pengertian, ketenangan, dan kasih.",
    closing: "Terima kasih sudah menyertai hari ini dengan kehadiran dan harapan baik. Sampai bertemu bersama keluarga kami.",
  },
};

export function invitationCopyDefaults(templateKey: string, eventDescription?: string | null): EditableInvitationCopy {
  const familyCopy = familyStationeryCopyDefaults[templateKey];
  if (familyCopy) return { ...familyCopy, greeting: eventDescription?.trim() || familyCopy.greeting };
  if (templateKey === "taman-doa") return {
    greeting: eventDescription?.trim() || "Dengan penuh rasa syukur, kami mengundang Anda untuk hadir pada syukuran khitanan putra kami.",
    attendanceRequest: "Mari berbagi kebahagiaan dan doa bersama keluarga kami. Kehadiran Anda akan membuat hari ini semakin berarti.",
    prayerWish: "Semoga putra kami tumbuh sehat, berhati baik, dan selalu dikelilingi kasih serta doa yang baik.",
    closing: "Terima kasih atas kehadiran dan doa Anda. Semoga kebersamaan ini menjadi kenangan yang hangat bagi kita semua.",
  };
  if (templateKey === "red-thread") return {
    greeting: eventDescription?.trim() || "Dua keluarga bertemu untuk merangkai ikatan yang penuh makna. Dengan hangat, kami mengundang Anda ke acara sangjit kami.",
    attendanceRequest: "Kehadiran Anda akan melengkapi kebahagiaan kedua keluarga pada hari istimewa ini.",
    prayerWish: "Semoga ikatan ini membawa kasih, keharmonisan, dan kebersamaan yang terus bertumbuh.",
    closing: "Terima kasih telah menjadi bagian dari pertemuan kedua keluarga kami. Sampai bertemu di hari yang penuh kebahagiaan.",
  };
  if (templateKey === "little-cloud") return {
    greeting: eventDescription?.trim() || "Kami sedang menanti cerita kecil yang akan membawa banyak bahagia. Kami ingin berbagi rasa syukur ini bersama Anda.",
    attendanceRequest: "Datanglah untuk berbagi doa, cerita, dan kebersamaan sebelum kami menyambut si kecil.",
    prayerWish: "Semoga si kecil dan keluarga selalu dikelilingi kesehatan, kasih, dan hari-hari yang hangat.",
    closing: "Terima kasih telah ikut menantikan kebahagiaan kecil ini bersama kami. Kehadiran dan harapan baik Anda sangat berarti.",
  };
  if (templateKey === "gathering") return {
    greeting: eventDescription?.trim() || "Ada pertemuan yang ingin kami isi dengan cerita, tawa, dan kebersamaan. Anda diundang untuk menjadi bagiannya.",
    attendanceRequest: "Luangkan waktu untuk hadir dan menikmati momen ini bersama kami. Kami menantikan kehadiran Anda.",
    prayerWish: "Semoga pertemuan ini membawa kenangan baik dan kebersamaan yang terus terjaga.",
    closing: "Terima kasih telah membuka ruang untuk bertemu dan berbagi. Sampai jumpa di acara!",
  };
  if (templateKey === "silver-reverie") return {
    greeting: eventDescription?.trim() || "Kami ingin merayakan perjalanan yang telah kami jalani bersama, dengan orang-orang yang membuatnya begitu berarti.",
    attendanceRequest: "Mari hadir dan berbagi cerita pada perayaan hari jadi pernikahan kami. Kehadiran Anda akan melengkapi kebahagiaan ini.",
    prayerWish: "Semoga hari-hari berikutnya selalu membawa kesehatan, ketenangan, dan kasih yang terus tumbuh.",
    closing: "Terima kasih telah menemani perjalanan ini dengan doa dan kebersamaan. Sampai bertemu di hari perayaan.",
  };
  if (templateKey === "golden-keepsake") return {
    greeting: eventDescription?.trim() || "Ada banyak kenangan yang kami simpan, dan satu hari istimewa yang ingin kami rayakan bersama Anda.",
    attendanceRequest: "Dengan penuh syukur kami mengundang Anda untuk berkumpul dan merayakan hari jadi pernikahan kami.",
    prayerWish: "Semoga keluarga kita selalu dikelilingi kasih, kesehatan, dan kebersamaan yang hangat.",
    closing: "Waktu menjadi lebih berharga ketika dibagi dengan orang-orang tersayang. Terima kasih telah menjadi bagian dari cerita kami.",
  };
  if (templateKey === "confetti-club") return {
    greeting: eventDescription?.trim() || "Ada satu hari yang ingin kami rayakan bersama orang-orang tersayang. Kamu diundang!",
    attendanceRequest: "Yuk, datang dan ikut merayakan. Kehadiranmu akan membuat hari ini semakin hangat.",
    prayerWish: "Semoga tahun yang baru dipenuhi kesehatan, kebahagiaan, dan banyak hal baik.",
    closing: "Terima kasih untuk doa dan kebersamaannya. Sampai bertemu di pesta!",
  };
  if (templateKey === "paper-cut-botanical") return {
    greeting: eventDescription?.trim() || "Selembar demi selembar, kami merangkai undangan ini untuk berbagi satu hari yang begitu berarti bagi kami.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian hangat dari cerita yang sedang kami susun bersama.",
    prayerWish: "Semoga langkah yang kami mulai selalu punya ruang untuk tumbuh, menguat, dan saling menjaga.",
    closing: "Terima kasih telah membuka lembar ini, mendoakan, dan menjadi bagian dari hari yang ingin kami simpan lama.",
  };
  if (templateKey === "golden-art-deco") return {
    greeting: eventDescription?.trim() || "Dengan hangat kami mengundang Anda ke sebuah malam yang dirangkai dalam cahaya, irama, dan kebersamaan.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian paling berharga dari perayaan yang ingin kami kenang.",
    prayerWish: "Semoga langkah baru ini tetap berkilau oleh kasih, ketenangan, dan keberanian untuk terus memilih satu sama lain.",
    closing: "Terima kasih telah hadir dan menjadi bagian dari satu malam yang akan tinggal lebih lama daripada gemerlapnya.",
  };
  if (templateKey === "classic-pearl") return {
    greeting: eventDescription?.trim() || "Dengan penuh syukur, kami mengundang Anda untuk hadir pada sebuah hari yang ingin kami kenang dengan hangat dan penuh makna.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian berharga dari perayaan yang kami simpan dekat di hati.",
    prayerWish: "Semoga langkah yang kami mulai bersama selalu dipenuhi kasih, keteguhan, dan kebaikan yang bertahan lama.",
    closing: "Terima kasih atas doa, waktu, dan kehadiran yang menjadikan hari ini semakin berarti bagi kami. Sampai bertemu.",
  };
  if (templateKey === "midnight-romance") return {
    greeting: eventDescription?.trim() || "Saat malam turun dan cahaya menjadi lebih pelan, kami mengundang Anda untuk hadir di satu perayaan yang kami simpan dekat di hati.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian hangat dari malam yang ingin kami kenang selamanya.",
    prayerWish: "Semoga perjalanan baru ini selalu menemukan cahaya, bahkan pada malam yang paling sunyi.",
    closing: "Terima kasih telah hadir, mendoakan, dan tinggal sejenak bersama kami di malam yang berarti ini. Sampai bertemu.",
  };
  if (templateKey === "garden-light") return {
    greeting: eventDescription?.trim() || "Menjelang senja, di antara cahaya kecil dan udara taman, kami mengundang Anda untuk hadir di hari yang kami nantikan.",
    attendanceRequest: "Kehadiran Anda akan membuat taman ini terasa lebih hangat dan cerita hari itu menjadi lebih lengkap.",
    prayerWish: "Semoga langkah baru ini selalu menemukan cahaya, keteduhan, dan ruang untuk tumbuh bersama.",
    closing: "Terima kasih telah datang, mendoakan, dan berbagi cahaya pada hari yang begitu berarti bagi kami. Sampai bertemu di taman.",
  };
  if (templateKey === "botanical-ivory") return {
    greeting: eventDescription?.trim() || "Dengan hati yang hangat, kami mengundang Anda untuk merayakan hari ketika dua cerita memilih berjalan bersama.",
    attendanceRequest: "Kehadiran Anda akan menjadi bagian hangat dari hari yang kami rayakan bersama.",
    prayerWish: "Semoga langkah baru ini selalu dipenuhi kasih, ketenangan, dan doa yang baik.",
    closing: "Terima kasih telah hadir, mendoakan, dan menjadi bagian dari awal yang kami pilih bersama. Sampai bertemu.",
  };
  if (templateKey === "pencil-reverie") return {
    greeting: eventDescription?.trim() || "Di antara garis pensil, catatan kecil, dan benda-benda yang kami simpan, ada satu cerita yang akhirnya sampai pada hari ini.",
    attendanceRequest: "Kami ingin menambahkan kehadiran Anda pada halaman yang paling ingin kami kenang.",
    prayerWish: "Semoga halaman-halaman setelah hari ini selalu penuh kasih, tawa, dan keberanian untuk terus berjalan bersama.",
    closing: "Terima kasih sudah berhenti sejenak di halaman ini, mendoakan, dan menjadi bagian dari cerita yang kami bawa ke bab berikutnya.",
  };
  if (templateKey === "serein") return {
    greeting: eventDescription?.trim() || "Di antara hari-hari yang datang dan pergi, ada satu yang ingin kami rayakan bersama Anda.",
    attendanceRequest: "Kami mengundang Anda untuk berbagi waktu, cerita, dan kebahagiaan pada hari istimewa ini.",
    prayerWish: "Semoga langkah baru ini selalu dikelilingi kasih, kebaikan, dan doa yang tulus.",
    closing: "Terima kasih untuk setiap doa dan kehadiran yang menghangatkan hari kami. Sampai bertemu.",
  };
  return {
    greeting: eventDescription?.trim() ||
      (templateKey === "pencil-reverie"
        ? "Sebuah cerita kecil membawa kami menuju hari yang istimewa ini."
        : templateKey === "romantic-rose"
        ? "Dengan penuh sukacita, kami berbagi kabar bahagia ini bersama Anda."
        : templateKey === "zen-atelier"
          ? "Dengan hati yang tenang, kami berbagi satu langkah penting dalam perjalanan kami."
          : "Dengan penuh sukacita, kami berbagi kabar bahagia ini bersama Anda."),
    attendanceRequest: templateKey === "pencil-reverie"
      ? "Dengan senang hati, kami mengundang Anda untuk hadir dan merayakan hari istimewa ini bersama kami."
      : templateKey === "romantic-rose"
        ? "Kami berharap Anda berkenan hadir dan menjadi bagian dari perayaan kami."
        : templateKey === "zen-atelier"
          ? "Merupakan kebahagiaan bagi kami apabila Anda berkenan hadir pada hari istimewa ini."
          : "Kehadiran Anda akan menjadi bagian berarti dari perayaan ini.",
    prayerWish: templateKey === "pencil-reverie"
      ? "Semoga hari ini menjadi awal dari perjalanan yang penuh kasih dan kebaikan."
      : templateKey === "zen-atelier"
        ? "Doa dan harapan baik Anda kami terima dengan penuh syukur."
        : "Doa dan harapan baik Anda menjadi hadiah yang kami syukuri.",
    closing: templateKey === "pencil-reverie"
      ? "Terima kasih telah menjadi bagian dari cerita kami. Sampai bertemu!"
      : templateKey === "zen-atelier"
      ? "Atas doa, restu, dan kehadiran Anda dalam perjalanan istimewa ini."
      : templateKey === "romantic-rose"
        ? "Kehadiran dan doa baik Anda berarti bagi kami. Sampai bertemu di hari bahagia!"
        : "Kehadiran dan doa baik Anda sangat berarti. Sampai bertemu!",
    ...(templateKey === "zen-atelier" ? {
      zenQuote: "Cinta bukan tentang menemukan seseorang yang sempurna, tetapi tentang berjalan bersama dalam ketidaksempurnaan dengan hati yang tenang.",
    } : {}),
  };
}

export function sanitizeEditableCopy(value: unknown, templateKey: string): EditableInvitationCopy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: EditableInvitationCopy = {};
  for (const key of availableEditableCopyFields(templateKey)) {
    if (typeof source[key] !== "string") continue;
    const text = source[key].trim();
    if (text && text.length <= editableCopyMaxLength[key]) result[key] = text;
  }
  return result;
}

export function parseEditableCopy(designKey: string): EditableInvitationCopy {
  const token = designKey.split("::").find((part) => part.startsWith("copy="));
  if (!token) return {};
  try {
    return sanitizeEditableCopy(
      JSON.parse(decodeURIComponent(token.slice(5))),
      designKey.split("::")[0] || "",
    );
  } catch {
    return {};
  }
}

export function parseEnglishEditableCopy(designKey: string): EditableInvitationCopy {
  const token = designKey.split("::").find((part) => part.startsWith("copyEn="));
  if (!token) return {};
  try {
    return sanitizeEditableCopy(JSON.parse(decodeURIComponent(token.slice(7))), designKey.split("::")[0] || "");
  } catch {
    return {};
  }
}

export function withEnglishEditableCopy(designKey: string, value: EditableInvitationCopy): string {
  const base = designKey.split("::").filter((part) => !part.startsWith("copyEn=")).join("::");
  const overrides = sanitizeEditableCopy(value, base.split("::")[0] || "");
  return Object.keys(overrides).length ? `${base}::copyEn=${encodeURIComponent(JSON.stringify(overrides))}` : base;
}

export function withEditableCopy(designKey: string, value: EditableInvitationCopy): string {
  const base = designKey.split("::").filter((part) => !part.startsWith("copy=")).join("::");
  const overrides = sanitizeEditableCopy(value, base.split("::")[0] || "");
  return Object.keys(overrides).length
    ? `${base}::copy=${encodeURIComponent(JSON.stringify(overrides))}`
    : base;
}

export function resolveEditableCopy(
  designKey: string,
  templateKey: string,
  eventDescription?: string | null,
): EditableInvitationCopy {
  return { ...invitationCopyDefaults(templateKey, eventDescription), ...parseEditableCopy(designKey) };
}
