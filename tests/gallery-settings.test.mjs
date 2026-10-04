import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const photoSlots = read("lib/templates/photo-slots.ts");
const panel = read("components/InvitationStudio/PhotoPanel.tsx");
const photoControls = read("components/InvitationStudio/PhotoEditingControls.tsx");
const photoInspector = read("components/InvitationStudio/PhotoSlotInspector.tsx");
const designer = read("components/InvitationStudio/InvitationDesigner.tsx");
const gallery = read("components/PublicInvitation/ConfigurablePhotoGallery.tsx");
const galleryCss = read("components/PublicInvitation/configurable-photo-gallery.css");
const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
const rose = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
const finalPreview = read("components/InvitationStudio/StudioFinalPreviewDialog.tsx");

test("gallery settings persist inside the existing photo assignment token", () => {
  assert.match(photoSlots, /export type GalleryPresentation = "template" \| "carousel" \| "stack" \| "filmstrip" \| "masonry"/);
  assert.match(photoSlots, /export type GalleryTransition = "slide-left" \| "slide-right" \| "fade" \| "zoom" \| "rise"/);
  assert.match(photoSlots, /gallerySettings\?: GallerySettings/);
  assert.match(photoSlots, /presentation: "template"/);
  assert.match(photoSlots, /autoplay: false/);
  assert.match(photoSlots, /interval: 4/);
  assert.match(photoSlots, /transitionDuration: 0\.6/);
  assert.match(photoSlots, /sanitizeGallerySettings\(value\.gallerySettings\)/);
  assert.match(photoSlots, /gallerySettings: sanitizeGallerySettings\(assignments\.gallerySettings\)/);
  assert.match(photoSlots, /export function resolveGallerySettings/);
});

test("Studio Gallery inspector can reorder photos and configure playback without duplicating the left picker", () => {
  assert.doesNotMatch(panel, /onReorderGallery|onGallerySettings|galleryMotion|Crop & posisi/);
  assert.match(photoInspector, /<GalleryPhotoControls/);
  assert.match(photoControls, /Urutan foto/);
  assert.match(photoControls, /draggable/);
  assert.match(photoControls, /onReorderGallery\(sourceId, photo\.id\)/);
  assert.match(photoControls, /event\.stopPropagation\(\)/);
  assert.match(photoControls, /Gaya galeri/);
  assert.match(photoControls, /value=\{gallerySettings\.presentation\}/);
  assert.match(photoControls, /role="switch"/);
  assert.match(photoControls, /gallerySettings\.autoplay/);
  assert.match(photoControls, /Jeda slide/);
  assert.match(photoControls, /Transisi slide/);
  assert.match(photoControls, /Durasi transisi/);
  assert.match(photoInspector, /Animasi saat muncul/);
  assert.match(photoInspector, /sectionAnimationPresets/);
  assert.match(photoInspector, /Jeda antar foto/);
});

test("Studio wiring saves gallery order, behavior and entrance motion in design history", () => {
  assert.match(designer, /function reorderGalleryPhoto\(sourceId: string, targetId: string\)/);
  assert.match(designer, /gallery: current/);
  assert.match(designer, /function updateGallerySettings\(patch: Partial<GallerySettings>\)/);
  assert.match(designer, /gallerySettings: \{ \.\.\.defaultGallerySettings\(\), \.\.\.\(design\.photos\.gallerySettings \?\? \{\}\), \.\.\.patch \}/);
  assert.match(designer, /onReorderGallery=\{reorderGalleryPhoto\}/);
  assert.match(designer, /onGallerySettings=\{updateGallerySettings\}/);
  assert.match(designer, /onUpdatePhotoMotion=\{updatePhotoMotion\}/);
  assert.match(finalPreview, /photos: design\.photos/);
  assert.match(read("components/InvitationStudio/StudioPreviewFrame.tsx"), /photoAssignments=\{design\.photos\}/);
});

test("configurable public gallery supports carousel stack filmstrip masonry autoplay and accessible pause", () => {
  assert.match(gallery, /settings\.presentation === "carousel" \|\| settings\.presentation === "stack"/);
  assert.match(gallery, /window\.setInterval/);
  assert.match(gallery, /settings\.interval \* 1000/);
  assert.match(gallery, /manualPaused \|\| interactionPaused/);
  assert.match(gallery, /prefers-reduced-motion: reduce/);
  assert.match(gallery, /data-gallery-presentation="masonry"/);
  assert.match(gallery, /data-gallery-presentation="filmstrip"/);
  assert.match(gallery, /data-gallery-transition=\{settings\.transition\}/);
  assert.match(gallery, /data-invitation-photo-slot="gallery"/);
  assert.match(gallery, /aria-roledescription="carousel"/);
  assert.match(gallery, /Pause gallery autoplay/);
  assert.match(galleryCss, /data-gallery-transition="slide-left"/);
  assert.match(galleryCss, /data-gallery-presentation="stack"/);
  assert.match(galleryCss, /scroll-snap-type: x mandatory/);
  assert.match(galleryCss, /@media \(prefers-reduced-motion:reduce\)/);
});

test("custom gallery presentation is shared by Universal and Romantic Rose while template mode remains untouched by default", () => {
  assert.match(universal, /const gallerySettings = resolveGallerySettings\(media\.assignment\)/);
  assert.match(universal, /gallerySettings\.presentation !== "template" \? <ConfigurablePhotoGallery/);
  assert.match(rose, /const gallerySettings = resolveGallerySettings\(assignment\)/);
  assert.match(rose, /gallerySettings\.presentation !== "template"/);
  assert.match(rose, /<ConfigurablePhotoGallery/);
  assert.match(photoSlots, /presentation: "template"/);
});
