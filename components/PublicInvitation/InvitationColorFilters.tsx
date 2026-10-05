import { invitationColorFilterId, invitationTintMatrix, safeVisualColor, type InvitationColorFilter } from "@/lib/templates/visual-colors";

/** Optional paint only: the original image, alpha, crop and motion remain the source. */
export default function InvitationColorFilters({ filters }: { filters: InvitationColorFilter[] }) {
  const unique = new Map<string, InvitationColorFilter>();
  for (const filter of filters) {
    const color = safeVisualColor(filter.color);
    const id = color && invitationColorFilterId(color, filter.mode);
    if (id && color) unique.set(id, { ...filter, color });
  }
  if (!unique.size) return null;
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute">
      <defs>
        {[...unique].map(([id, { color, mode }]) => (
          <filter key={id} id={id} colorInterpolationFilters="sRGB" x="-10%" y="-10%" width="120%" height="120%">
            {mode === "tint" ? <feColorMatrix in="SourceGraphic" type="matrix" values={invitationTintMatrix(color)} /> : <>
              <feFlood floodColor={color} result="ink" />
              <feComposite in="ink" in2="SourceAlpha" operator="in" />
            </>}
          </filter>
        ))}
      </defs>
    </svg>
  );
}
