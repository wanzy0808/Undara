/**
 * Existing bundled audio is shared by all render-ready invitation themes.
 * An event's chosen musicUrl or uploaded AUDIO asset always takes precedence.
 * No template code/audio assets for other themes are pulled in by this registry.
 */
const bundledTracks = {
  eternalLove: { title: "Eternal Love", artist: "Twisterium", file: "assets/audio/twisterium-eternal-love.mp3" },
  whitePetals: { title: "White Petals", artist: "Keys of Moon", file: "assets/audio/keys-of-moon-white-petals.mp3" },
  lovingYou: { title: "Loving You", artist: "Avanti", file: "assets/audio/avanti-loving-you.mp3" },
  lastPromise: { title: "Last Promise", artist: "Nettson", file: "assets/audio/nettson-last-promise.mp3" },
  lucid: { title: "Lucid", artist: "Jens East", file: "assets/audio/jens-east-lucid.mp3" },
  lullaby: { title: "Lullaby", artist: "Purrple Cat", file: "assets/audio/purrple-cat-lullaby.mp3" },
  untilWeMeetAgain: { title: "Until We Meet Again", artist: "Arthur Vyncke", file: "assets/audio/arthur-vyncke-until-we-meet-again.mp3" },
  withYouInTheMorning: { title: "With You In The Morning", artist: "Carl Storm", file: "assets/audio/carl-storm-with-you-in-the-morning.mp3" },
  theySay: { title: "They Say...", artist: "DayFox", file: "assets/audio/dayfox-they-say.mp3" },
  fragile: { title: "Fragile", artist: "A Himitsu", file: "assets/audio/a-himitsu-fragile.mp3" },
  jikan: { title: "Jikan Wa Mikata Da", artist: "", file: "assets/audio/jikan-wa-mikata-da.mp3" },
  forgiveness: { title: "Forgiveness", artist: "Epic Spectrum", file: "assets/audio/epic-spectrum-forgiveness.mp3" },
  iShouldLetYouGo: { title: "I Should Let You Go", artist: "A Himitsu", file: "assets/audio/a-himitsu-i-should-let-you-go.mp3" },
  letYouGo: { title: "Let You Go", artist: "Kener", file: "assets/audio/kener-let-you-go.mp3" },
};

const trackUrl = (file: string) => `/${file.split("/").map(encodeURIComponent).join("/")}`;

/** Shared files are listed once, even when several templates use the same song. */
export const invitationMusicLibrary = Object.entries(bundledTracks).map(([id, track]) => ({
  ...track, id, url: trackUrl(track.file),
}));

export const invitationDefaultTracks: Record<string, { title: string; file: string }> = {
  "serambi-pagi": bundledTracks.whitePetals,
  "rumah-senja": bundledTracks.withYouInTheMorning,
  "langit-safari": bundledTracks.lullaby,
  "purnama-biru": bundledTracks.lucid,
  "giok-abadi": bundledTracks.untilWeMeetAgain,
  "peony-silk": bundledTracks.lovingYou,
  "imperial-crimson": bundledTracks.eternalLove,
  "porcelain-bloom": bundledTracks.whitePetals,
  "romantic-rose": bundledTracks.eternalLove,
  "botanical-ivory": bundledTracks.whitePetals,
  "eternal-blossom": bundledTracks.lovingYou,
  "modern-maroon": bundledTracks.lastPromise,
  "garden-light": bundledTracks.lucid,
  "midnight-romance": bundledTracks.lullaby,
  "classic-pearl": bundledTracks.untilWeMeetAgain,
  "golden-art-deco": bundledTracks.withYouInTheMorning,
  "paper-cut-botanical": bundledTracks.theySay,
  "celestial-ink": bundledTracks.fragile,
  "pencil-reverie": bundledTracks.fragile,
  "zen-atelier": bundledTracks.jikan,
  "velvet-horizon": bundledTracks.eternalLove,
  "serein": bundledTracks.untilWeMeetAgain,
  "confetti-club": bundledTracks.theySay,
  "taman-doa": bundledTracks.lucid,
  "red-thread": bundledTracks.eternalLove,
  "little-cloud": bundledTracks.lullaby,
  "gathering": bundledTracks.theySay,
  "silver-reverie": bundledTracks.untilWeMeetAgain,
  "golden-keepsake": bundledTracks.eternalLove,
};

export function getInvitationDefaultMusic(templateKey: string) {
  const template = templateKey.split("::")[0];
  const track = invitationDefaultTracks[template] ?? invitationDefaultTracks["romantic-rose"];
  return { title: track.title, url: trackUrl(track.file) };
}

export function resolveInvitationMusic(
  templateKey: string,
  musicUrl?: string | null,
  assets?: readonly { type: string; url: string }[],
) {
  return musicUrl?.trim() ||
    assets?.find((asset) => asset.type === "AUDIO" && asset.url.trim())?.url ||
    getInvitationDefaultMusic(templateKey).url;
}
