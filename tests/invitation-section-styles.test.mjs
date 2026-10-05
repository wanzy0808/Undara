import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  invitationSectionBackgroundRule,
  invitationSectionStyleCss,
  parseInvitationSectionStyles,
  sanitizeInvitationSectionStyles,
  withInvitationSectionStyles,
} from "../lib/templates/section-styles.ts";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const selectionResolver = read("components/InvitationStudio/studio-canvas-selection.ts");
const selectionInspector = read("components/InvitationStudio/StudioSelectionInspector.tsx");

test("section style overrides round-trip safely in the invitation design key", () => {
  const base = "romantic-rose::rose::cinzelFauna";
  const styles = {
    rsvp: { paddingY: 72, opacity: 0.8, align: "left", background: "#fff0f3" },
    wishes: { align: "center" },
  };
  const key = withInvitationSectionStyles(base, styles);
  assert.deepEqual(parseInvitationSectionStyles(key), styles);
  assert.equal(withInvitationSectionStyles(key, {}), base);
  assert.deepEqual(sanitizeInvitationSectionStyles({
    rsvp: { paddingY: 999, opacity: 0, align: "wat", background: "red" },
    unknown: { opacity: 0.5 },
  }), { rsvp: { paddingY: 160, opacity: 0.2 } });
});

test("section CSS helper only emits explicit visual overrides", () => {
  assert.deepEqual(invitationSectionStyleCss(), {});
  assert.deepEqual(invitationSectionStyleCss({
    paddingY: 48,
    opacity: 0.7,
    align: "right",
    background: "#112233",
  }), {
    paddingTop: 48,
    paddingBottom: 48,
    opacity: 0.7,
    textAlign: "right",
    background: "#112233",
    "--inv-section-background": "#112233",
  });
});

test("Envelope and Cover backgrounds reach their nested scene root without recoloring another section", () => {
  const key = withInvitationSectionStyles("zen-atelier", {
    envelope: { background: "#112233" },
    cover: { background: "#aabbcc" },
    identity: { background: "#fff0f3" },
  });
  const styles = parseInvitationSectionStyles(key);
  assert.equal(invitationSectionStyleCss(styles.envelope)["--inv-section-background"], "#112233");
  assert.equal(invitationSectionStyleCss(styles.cover)["--inv-section-background"], "#aabbcc");
  assert.equal(invitationSectionStyleCss(styles.identity).background, "#fff0f3");
  assert.deepEqual(invitationSectionStyleCss(styles.greeting), {});
  assert.match(invitationSectionBackgroundRule, /data-invitation-section="envelope".*data-invitation-background-override="true".*data-invitation-section="envelope"/);
  assert.match(invitationSectionBackgroundRule, /data-invitation-section="cover".*data-invitation-background-override="true".*data-invitation-section="cover"/);
  assert.match(invitationSectionBackgroundRule, /background: var\(--inv-section-background\) !important/);
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  assert.match(universal, /<style>\{invitationSectionBackgroundRule\}<\/style>/);
  assert.match(universal, /data-invitation-background-override=\{sectionStyles\.envelope\?\.background/);
  assert.match(universal, /data-invitation-background-override=\{sectionStyle\?\.background/);
});

test("Studio section selection opens a right-side inspector and renderers consume saved styles", () => {
  const editor = read("components/InvitationStudio/InvitationDesigner.tsx");
  const inspector = read("components/InvitationStudio/SectionInspector.tsx");
  const state = read("components/InvitationStudio/designer-state.ts");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const romantic = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const css = read("components/InvitationStudio/studio.css");
  const selectionMarkers = read("components/InvitationStudio/useStudioCanvasSelectionMarkers.ts");

  assert.match(editor, /selectedSectionKey/);
  assert.match(editor, /resolveStudioCanvasSelection/);
  assert.match(selectionResolver, /target\.closest<HTMLElement>\("\[data-invitation-section\]"\)/);
  assert.match(editor, /<StudioSelectionInspector/);
  assert.match(selectionInspector, /<SectionInspector/);
  assert.match(editor, /updateSectionStyle/);
  const sectionSelection = editor.split("function selectSectionInstance(")[1]?.split("function moveSectionInstance(")[0];
  assert.match(sectionSelection, /clearCanvasSelection\(\)/);
  assert.match(sectionSelection, /activateCanvasEditing\(\)/);
  assert.ok(inspector.indexOf('"Background" : "Latar"') < inspector.indexOf('"Alignment" : "Perataan"'));
  assert.match(editor, /resetSectionStyle/);
  assert.match(editor, /useStudioCanvasSelectionMarkers\(/);
  assert.match(selectionMarkers, /"invitationSection", section, "studioSectionSelected"/);
  assert.match(inspector, /Perataan/);
  assert.match(inspector, /Ruang vertikal/);
  assert.match(inspector, /Opasitas/);
  assert.match(inspector, /<StudioColorField[\s\S]*?label=\{en \? "Background" : "Latar"\}/);
  assert.doesNotMatch(inspector, />\s*Default\s*</);
  assert.match(inspector, /undara-studio-section-reset/);
  assert.doesNotMatch(inspector, /functionalNotes|>Komponen<|>Components</);
  assert.match(state, /withInvitationSectionStyles/);
  assert.match(state, /parseInvitationSectionStyles/);
  assert.match(universal, /parseInvitationSectionStyles\(activeDesignKey\)/);
  assert.match(universal, /data-invitation-section="envelope"/);
  assert.match(universal, /data-invitation-section="cover"/);
  assert.match(romantic, /const activeDesignKey = designKey \|\| invitation\.templateKey/);
  assert.match(romantic, /parseInvitationSectionStyles\(activeDesignKey\)/);
  assert.match(universal, /<RsvpForm slug=\{invitation\.slug\} preview=\{preview\}/);
  assert.match(romantic, /<RsvpForm slug=\{invitation\.slug\} preview=\{preview\}/);
  assert.doesNotMatch(universal, /Form RSVP tersedia di undangan yang sudah dipublikasikan/);
  assert.doesNotMatch(romantic, /Form RSVP akan tersedia di undangan yang sudah dipublikasikan/);
  assert.match(css, /\.undara-studio-section-side \{[^}]*justify-self: end/);
  assert.match(css, /\[data-studio-section-selected="true"\]/);
});

test("every Studio section keeps an always-visible vertical action rail on its left edge", () => {
  const wrapper = read("components/PublicInvitation/EditableSectionInstance.tsx");
  const rail = read("components/InvitationStudio/SectionActionRail.tsx");
  const sectionInspector = read("components/InvitationStudio/SectionInspector.tsx");
  const rsvpInspector = read("components/InvitationStudio/RsvpElementInspector.tsx");
  const css = read("components/InvitationStudio/studio.css");

  assert.match(wrapper, /className="undara-section-instance relative"/);
  assert.doesNotMatch(wrapper, /dc-section-instance/);
  assert.match(wrapper, /const showActions = Boolean\(preview && actions\?\.onMove/);
  assert.match(wrapper, /\{showActions && \(/);
  assert.doesNotMatch(wrapper, /\{selected && actions\?\.onMove/);
  assert.match(rail, /aria-orientation="vertical"/);
  assert.match(rail, /Geser section ke atas/);
  assert.match(rail, /Geser section ke bawah/);
  assert.match(rail, /Sembunyikan section/);
  assert.match(rail, /Duplikat section/);
  assert.match(rail, /Hapus section/);
  assert.match(css, /\.undara-studio-section-actions \{[\s\S]*?left: -52px;[\s\S]*?flex-direction: column[\s\S]*?border: 0;[\s\S]*?background: transparent/);
  assert.match(css, /\.undara-studio-preview-surface \{[\s\S]*?overflow: visible/);
  assert.match(css, /\.undara-studio-preview-surface \[data-studio-preview-root="true"\] \{[^}]*overflow: visible !important/);
  assert.match(css, /\.undara-studio-preview-workspace \{[^}]*overflow: visible/);
  assert.match(css, /\.undara-studio-canvas-layout \{[^}]*grid-template-columns: minmax\(236px, 1fr\)[^}]*overflow: visible/);
  assert.match(css, /\.undara-section-instance-content \{ overflow: hidden; \}/);
  assert.match(css, /\.undara-section-instance-hidden \{[\s\S]*?max-height: 72px/);

  assert.match(sectionInspector, /undara-studio-align-icons/);
  assert.match(rsvpInspector, /undara-studio-align-icons/);
  assert.doesNotMatch(sectionInspector, /<select[\s\S]*?Perataan/);
  assert.match(css, /\.undara-studio-layer-select select,[\s\S]*?appearance: none/);
  assert.match(css, /background-position:[\s\S]*?calc\(100% - 15px\)/);
});

test("section toolbar visibility shares one state with the Isi panel", () => {
  const editor = read("components/InvitationStudio/InvitationDesigner.tsx");
  const panels = read("components/InvitationStudio/DesignerPanels.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const romantic = read("components/PublicInvitation/RomanticRoseTemplate.tsx");

  assert.match(panels, /const enabled = sections\[item\.key\] !== false/);
  assert.match(panels, /checked=\{enabled\}/);
  assert.match(panels, /onChange\(item\.key, event\.target\.checked\)/);
  assert.match(editor, /function toggleSectionInstance\(id: string\)[\s\S]*?setSection\(instance\.key, design\.sections\[instance\.key\] === false\)/);
  assert.match(editor, /function setSection\(section: InvitationSectionKey, enabled: boolean\)[\s\S]*?sectionLayout: next/);
  assert.match(editor, /!hasSameSection \? \{ sections: \{ \.\.\.design\.sections, \[source\.key\]: false \} \} : \{\}/);
  assert.match(universal, /const hidden = sections\[keyName\] === false;[\s\S]*?if \(hidden && \(!editorPreview \|\| key === "blank-canvas"\)\) return null/);
  assert.match(romantic, /const hidden = sections\[key\] === false;[\s\S]*?if \(hidden && !editorPreview\) return null/);
  assert.match(universal, /data-studio-preview-root=\{editorPreview \? "true" : undefined\}/);
  assert.match(universal, /\$\{editorPreview \? "overflow-visible" : "overflow-hidden"\}/);
  assert.match(romantic, /data-studio-preview-root=\{editorPreview \? "true" : undefined\}/);
  assert.match(romantic, /\$\{editorPreview \? "overflow-visible" : "overflow-hidden"\}/);
});

test("section inspector stays visual-only without duplicating function lists", () => {
  const inspector = read("components/InvitationStudio/SectionInspector.tsx");
  assert.doesNotMatch(inspector, /functionalNotes|Nama tamu|Kirim ucapan|Nomor rekening|Salin rekening/);
  assert.doesNotMatch(inspector, /fetch\(|\/api\/invite|onSubmit/);
  assert.match(inspector, /undara-studio-align-icons/);
  assert.match(inspector, /Ruang vertikal/);
});


test("Isi only exposes real Input and Button child components", () => {
  const panels = read("components/InvitationStudio/DesignerPanels.tsx");
  const editor = read("components/InvitationStudio/InvitationDesigner.tsx");
  const universal = read("components/PublicInvitation/UniversalInvitationTemplate.tsx");
  const romantic = read("components/PublicInvitation/RomanticRoseTemplate.tsx");
  const wishes = read("components/PublicInvitation/GuestWishes.tsx");
  const state = read("components/InvitationStudio/designer-state.ts");

  assert.match(panels, /rsvp: \["input", "button"\]/);
  assert.match(panels, /wishes: \["input", "button"\]/);
  assert.match(panels, /location: \["button"\]/);
  assert.match(panels, /gift: \["button"\]/);
  assert.doesNotMatch(panels, /envelope: \["button"\]/);
  assert.match(editor, /selectedSectionElement/);
  assert.match(selectionInspector, /<SectionElementInspector/);
  assert.match(selectionResolver, /target\.closest<HTMLElement>\("\[data-studio-section-element\]"\)/);
  assert.match(wishes, /data-studio-section-element="wishes:input"/);
  assert.match(wishes, /data-studio-section-element="wishes:button"/);
  assert.match(universal, /data-studio-section-element="location:button"/);
  assert.match(universal, /data-studio-section-element="gift:button"/);
  assert.match(romantic, /data-studio-section-element="location:button"/);
  assert.match(romantic, /data-studio-section-element="gift:button"/);
  assert.match(state, /withSectionElementStyles/);
  assert.match(state, /parseSectionElementStyles/);
});
