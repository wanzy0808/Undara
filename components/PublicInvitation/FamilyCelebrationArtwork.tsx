import type { InvitationSectionKey } from "@/lib/templates/sections";

/** Original cut-paper geometry. Every meaningful layer has a separate Studio paint target. */
export function PrayerGarden({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:garden-art`} className={`td-garden ${className}`}>
    <svg viewBox="0 0 420 300" fill="none">
      <g data-studio-native-object={`object:${section}:garden-hills-art`} className="ot-soft-art">
        <path d="M0 236C50 172 91 213 143 173C205 128 231 200 280 177C334 151 376 191 420 168V299H0Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-canopy-art`} className="ot-accent-art" fill="currentColor" opacity=".38">
        <path d="M0 276C17 224 49 238 57 256C82 195 113 238 126 261C153 231 173 242 180 264C227 205 257 228 277 256C292 216 322 234 333 259C366 204 401 220 420 247V299H0Z" />
        <path d="M187 257C180 226 187 192 193 177C199 196 205 230 198 260ZM220 258C213 214 220 168 228 148C239 177 242 232 234 260Z" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-path-art`} className="td-paper-art">
        <path d="M201 213C156 236 173 259 217 276L260 298H135C122 265 135 233 201 213Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-arch-art`} className="ot-soft-art">
        <path fillRule="evenodd" d="M118 277V142C118 105 157 74 205 27C253 74 292 105 292 142V277H118ZM146 277V145C146 120 173 95 205 62C237 95 264 120 264 145V277H146Z" fill="currentColor" />
        <path d="M131 276V144C131 112 165 84 205 43C245 84 279 112 279 144V276" stroke="var(--inv-bg)" strokeWidth="2" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-inner-arch-art`} className="ot-accent-art">
        <path fillRule="evenodd" d="M131 277V144C131 112 165 84 205 43C245 84 279 112 279 144V277H131ZM146 277V145C146 120 173 95 205 62C237 95 264 120 264 145V277H146Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-tree-left-art`} className="ot-accent-art" fill="currentColor">
        <path d="M67 269C67 194 63 124 58 68M63 200L29 146M65 175L96 119M62 140L36 107" stroke="currentColor" strokeWidth="2" />
        <path d="M58 89C36 80 40 63 54 53C68 65 68 79 58 89ZM54 112C30 109 22 94 26 81C43 83 54 95 54 112ZM75 144C72 123 82 108 100 106C101 125 91 139 75 144ZM44 165C21 163 14 149 15 135C33 137 44 151 44 165ZM68 207C64 182 74 162 94 157C102 179 88 199 68 207ZM49 213C26 211 19 196 20 181C37 183 48 198 49 213Z" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-tree-right-art`} className="ot-accent-art" fill="currentColor">
        <path d="M353 280C350 242 352 205 367 173M353 254L329 231M358 222L384 211" stroke="currentColor" strokeWidth="2" />
        <path d="M369 193C359 171 370 154 386 150C392 169 383 185 369 193ZM357 224C338 218 333 203 338 190C354 194 361 209 357 224ZM371 239C370 220 386 209 402 212C397 231 385 239 371 239ZM345 260C328 257 319 243 323 229C339 233 347 244 345 260Z" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-planter-art`} className="td-paper-art">
        <path d="M31 268H90L82 296H40Z" fill="currentColor" /><ellipse cx="61" cy="268" rx="30" ry="5" fill="var(--inv-soft)" />
      </g>
      <g data-studio-native-object={`object:${section}:garden-steps-art`} className="ot-soft-art">
        <path d="M113 276H300V282H113ZM101 284H312V290H101ZM89 292H324V299H89Z" fill="currentColor" />
      </g>
    </svg>
  </div>;
}

export function PaperKite({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:paper-kite-art`} className={`td-kite ${className}`}>
    <svg viewBox="0 0 120 180" fill="none">
      <g data-studio-native-object={`object:${section}:kite-tail-art`} className="ot-accent-art">
        <path d="M58 79C32 124 99 103 72 153C65 168 88 170 108 176" stroke="currentColor" />
        <path d="M48 104L62 116L46 119ZM77 135L66 139L77 151Z" fill="currentColor" />
      </g>
      <g data-studio-native-object={`object:${section}:kite-green-art`} className="ot-accent-art"><path d="M50 5L91 31L57 81L21 46Z" fill="currentColor" /></g>
      <g data-studio-native-object={`object:${section}:kite-paper-art`} className="ot-soft-art"><path d="M50 5L57 38L91 31ZM21 46L57 38L57 81Z" fill="currentColor" /></g>
      <g data-studio-native-object={`object:${section}:kite-frame-art`} className="td-paper-art"><path d="M50 5L57 81M21 46L91 31" stroke="currentColor" /></g>
    </svg>
  </div>;
}

/** Full ornamental cloud line, kept inside its viewport instead of clipping a bitmap. */
export function CloudScroll({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:cloud-scroll-art`} className={`rt-cloud-scroll ${className}`}>
    <svg viewBox="0 0 380 100" fill="none">
      <g data-studio-native-object={`object:${section}:cloud-line-art`} className="ot-accent-art" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M12 77C-3 61 20 41 34 52C32 16 80 4 97 34C119 14 156 27 150 55C178 25 204 36 218 53C248 66 258 13 290 30C285 9 331 2 344 31C367 22 382 43 369 59C356 74 332 63 342 50C348 43 362 48 356 54M13 78C45 77 76 96 102 81C130 65 128 50 114 54C101 59 108 72 118 67M151 65C211 86 245 71 274 63C302 55 317 63 316 76C315 88 297 92 291 83" />
      </g>
    </svg>
  </div>;
}

export function CeremonialKnot({ section = "cover", className = "" }: { section?: InvitationSectionKey; className?: string }) {
  return <div aria-hidden="true" data-studio-native-object={`object:${section}:ceremonial-knot-art`} className={`rt-knot ${className}`}>
    <svg viewBox="0 0 300 340" fill="none">
      <g data-studio-native-object={`object:${section}:knot-tail-left-art`} className="ot-accent-art">
        <path d="M148 122C123 184 65 184 40 245C28 275 32 296 10 325C60 304 59 255 91 227C122 200 160 184 165 130" stroke="currentColor" strokeWidth="9" />
      </g>
      <g data-studio-native-object={`object:${section}:knot-tail-right-art`} className="ot-soft-art">
        <path d="M155 124C191 185 165 226 185 272C198 302 230 304 237 328C230 286 207 275 204 247C198 210 209 162 169 122" stroke="currentColor" strokeWidth="12" />
      </g>
      <g data-studio-native-object={`object:${section}:knot-loop-left-art`} className="ot-accent-art">
        <path d="M152 115C131 46 96 25 57 49C8 83 30 131 73 127C105 124 133 113 151 101" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g data-studio-native-object={`object:${section}:knot-loop-right-art`} className="ot-accent-art">
        <path d="M157 108C210 63 246 58 267 88C292 126 254 150 223 136C193 123 172 112 156 96" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
      </g>
      <g data-studio-native-object={`object:${section}:knot-center-art`} className="ot-soft-art">
        <rect x="131" y="90" width="48" height="42" rx="9" transform="rotate(-20 155 111)" fill="currentColor" />
        <path d="M138 93L149 130M147 90L158 128M156 87L166 125" stroke="var(--inv-accent)" strokeWidth="2" />
      </g>
    </svg>
  </div>;
}

export function FamilyCelebrationSectionArt({ theme, section }: { theme: string; section: InvitationSectionKey }) {
  if (theme === "taman-doa" && ["greeting", "closing"].includes(section)) return <PaperKite section={section} className="td-section-kite" />;
  if (theme === "taman-doa" && section === "gallery") return <PrayerGarden section={section} className="td-section-garden" />;
  if (theme === "red-thread" && ["greeting", "location"].includes(section)) return <CloudScroll section={section} className="rt-section-cloud" />;
  if (theme === "red-thread" && section === "closing") return <CeremonialKnot section={section} className="rt-section-knot" />;
  return null;
}
