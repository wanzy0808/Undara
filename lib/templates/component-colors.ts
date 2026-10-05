import type { InvitationRsvpConfig, RsvpElementStyle } from "@/lib/templates/rsvp-config";
import type { StudioSectionElementStyles } from "@/lib/templates/section-element-styles";
import { safeVisualColor } from "@/lib/templates/visual-colors";

/** Functional components retain one model; selected paint wins over theme CSS, including !important. */
export function invitationComponentColorCss(scope: string, rsvp: InvitationRsvpConfig, elements: StudioSectionElementStyles) {
  if (!/^dc-native-[a-z0-9]+$/.test(scope)) return "";
  const rules: string[] = [];
  function add(selector: string, style: RsvpElementStyle | undefined, inputs = false) {
    if (!style) return;
    const background = safeVisualColor(style.background);
    const color = safeVisualColor(style.color);
    const border = safeVisualColor(style.borderColor);
    const paint = [background ? `background:${background}!important` : "",
      color ? `color:${color}!important` : "", border ? `border-color:${border}!important` : ""].filter(Boolean).join(";");
    if (!paint) return;
    const target = `.${scope} ${selector}`;
    rules.push(`${target}{${paint};}`);
    if (inputs) {
      rules.push(`${target} :is(input:not([type="radio"]):not([type="checkbox"]),select,textarea){${paint};}`);
      if (color) rules.push(`${target} :is(label,legend,label span){color:${color}!important;}`);
    }
  }
  for (const kind of ["title", "inputs", "button"]) {
    add(`[data-invitation-section="rsvp"] [data-studio-rsvp-element="${kind}"]`, rsvp.elementStyles[kind], kind === "inputs");
  }
  for (const key of ["location:button", "gift:button", "wishes:input", "wishes:button"]) {
    const section = key.split(":")[0];
    add(`[data-invitation-section="${section}"] [data-studio-section-element="${key}"]`, elements[key], key === "wishes:input");
  }
  return rules.join("\n");
}
