import type { PhotoMotionMap, PhotoSlot } from "@/lib/templates/photo-slots";
import type { InvitationSectionStyles } from "@/lib/templates/section-styles";
import type { InvitationSectionAnimation } from "@/lib/templates/section-animations";

export type TemplateNativeMotion = { animation: InvitationSectionAnimation; animationDuration?: number; animationDelay?: number };

/** Theme presentation only; these defaults never overwrite a saved customer design. */
const romanticRosePhotos: PhotoMotionMap = {
  cover: { animation: "fade", animationDuration: .72, animationDelay: .04 },
  personOne: { animation: "glide-left", animationDuration: .82 },
  personTwo: { animation: "glide-right", animationDuration: .82, animationDelay: .08 },
  gallery: { animation: "tilt-in", animationDuration: .72, animationStagger: .06, parallax: 2 },
};

const sereinPhotos: PhotoMotionMap = {
  cover: { animation: "reveal-left", animationDuration: .9, animationDelay: .16 },
  personOne: { animation: "glide-left", animationDuration: .85 },
  personTwo: { animation: "glide-right", animationDuration: .85 },
  gallery: { animation: "rise", animationDuration: .75, animationStagger: .07 },
};

const blossomPhotos: PhotoMotionMap = {
  cover: { animation: "reveal-up", animationDuration: .85, animationDelay: .1 },
  personOne: { animation: "glide-left", animationDuration: .8 },
  personTwo: { animation: "glide-right", animationDuration: .8, animationDelay: .07 },
  gallery: { animation: "tilt-in", animationDuration: .75, animationStagger: .07 },
};

const modernMaroonPhotos: PhotoMotionMap = {
  cover: { animation: "reveal-left", animationDuration: .9, animationDelay: .08 },
  personOne: { animation: "glide-left", animationDuration: .82 },
  personTwo: { animation: "glide-right", animationDuration: .82, animationDelay: .08 },
  gallery: { animation: "tilt-in", animationDuration: .72, animationStagger: .055, parallax: 4.5 },
};

const gardenLightPhotos: PhotoMotionMap = {
  cover: { animation: "reveal-up", animationDuration: .88, animationDelay: .08 },
  personOne: { animation: "glide-left", animationDuration: .82 },
  personTwo: { animation: "glide-right", animationDuration: .82, animationDelay: .07 },
  gallery: { animation: "tilt-in", animationDuration: .74, animationStagger: .06 },
};

const midnightRomancePhotos: PhotoMotionMap = {
  cover: { animation: "reveal-up", animationDuration: .92, animationDelay: .08 },
  personOne: { animation: "glide-left", animationDuration: .86 },
  personTwo: { animation: "glide-right", animationDuration: .86, animationDelay: .08 },
  gallery: { animation: "tilt-in", animationDuration: .76, animationStagger: .065, parallax: 3 },
};

const zenAtelierPhotos: PhotoMotionMap = {
  // The cover photo sits inside an already animated kakemono scroll group.
  // Keep one transform owner there to avoid nested entrance repaints/flicker.
  gallery: { animation: "tilt-in", animationDuration: .7, animationStagger: .055, parallax: 2 },
};

const velvetHorizonPhotos: PhotoMotionMap = {
  personOne: { animation: "glide-left", animationDuration: .76 },
  personTwo: { animation: "glide-right", animationDuration: .76, animationDelay: .06 },
  gallery: { animation: "rise", animationDuration: .66, animationStagger: .045 },
};

const confettiClubPhotos: PhotoMotionMap = {
  cover: { animation: "rise", animationDuration: .55 },
  gallery: { animation: "rise", animationDuration: .55, animationStagger: .04 },
};

const photoDefaults: Record<string, PhotoMotionMap> = {
  "cherry-picnic": { cover: { animation: "fade", animationDuration: .55 }, gallery: { animation: "tilt-in", animationDuration: .6, animationStagger: .04 } },
  "velvet-wish": { cover: { animation: "fade", animationDuration: .6 }, gallery: { animation: "glide-left", animationDuration: .6, animationStagger: .045 } },
  "little-parade": { cover: { animation: "rise", animationDuration: .5 }, gallery: { animation: "rise", animationDuration: .55, animationStagger: .045 } },
  "disco-bloom": { cover: { animation: "fade", animationDuration: .5 }, gallery: { animation: "glide-right", animationDuration: .6, animationStagger: .04 } },
  "serambi-pagi": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "rise", animationDuration: .6, animationStagger: .045 } },
  "rumah-senja": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "glide-left", animationDuration: .6, animationStagger: .045 } },
  "langit-safari": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "rise", animationDuration: .6, animationStagger: .045 } },
  "purnama-biru": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "rise", animationDuration: .6, animationStagger: .045 } },
  "giok-abadi": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "rise", animationDuration: .6, animationStagger: .045 } },
  "peony-silk": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "glide-right", animationDuration: .6, animationStagger: .045 } },
  "imperial-crimson": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "rise", animationDuration: .6, animationStagger: .045 } },
  "porcelain-bloom": { cover: { animation: "rise", animationDuration: .55 }, gallery: { animation: "glide-left", animationDuration: .6, animationStagger: .045 } },
  "taman-doa": { gallery: { animation: "fade", animationDuration: .5, animationStagger: .04 } },
  "red-thread": { gallery: { animation: "fade", animationDuration: .5, animationStagger: .04 } },
  "little-cloud": { gallery: { animation: "fade", animationDuration: .5, animationStagger: .04 } },
  "gathering": { cover: { animation: "rise", animationDuration: .5 }, gallery: { animation: "rise", animationDuration: .5, animationStagger: .04 } },
  "silver-reverie": { cover: { animation: "fade", animationDuration: .5 }, gallery: { animation: "rise", animationDuration: .55, animationStagger: .04 } },
  "golden-keepsake": { cover: { animation: "fade", animationDuration: .5 }, gallery: { animation: "fade", animationDuration: .55, animationStagger: .04 } },
  "confetti-club": confettiClubPhotos,
  "romantic-rose": romanticRosePhotos,
  serein: sereinPhotos,
  "eternal-blossom": blossomPhotos,
  "modern-maroon": modernMaroonPhotos,
  "garden-light": gardenLightPhotos,
  "midnight-romance": midnightRomancePhotos,
  "zen-atelier": zenAtelierPhotos,
  "velvet-horizon": velvetHorizonPhotos,
};

export function templateHasDefaultPhotoMotion(template: string) {
  return Object.hasOwn(photoDefaults, template);
}

const blossomNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "rise", animationDuration: .7 },
  "object:envelope:date": { animation: "fade", animationDelay: .07 },
  "object:envelope:flower": { animation: "glide-left", animationDuration: .85 },
  "object:envelope:flower-right": { animation: "glide-right", animationDuration: .85, animationDelay: .07 },
  "object:cover:flower-left": { animation: "glide-left", animationDuration: .9 },
  "object:cover:flower-right": { animation: "glide-right", animationDuration: .9, animationDelay: .07 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .07 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDelay: .07 },
  "object:cover:event-name": { animation: "rise", animationDuration: .8 },
  "object:cover:date": { animation: "rise", animationDelay: .14 },
  "heading:greeting": { animation: "rise" },
  "object:greeting:flower-art": { animation: "soft-scale", animationDuration: .8 },
  "heading:identity": { animation: "rise" },
  "object:identity:personOne-name": { animation: "slide-left" },
  "object:identity:personTwo-name": { animation: "slide-right", animationDelay: .07 },
  "heading:event": { animation: "slide-left" },
  "heading:dateTime": { animation: "rise" },
  "heading:gallery": { animation: "slide-left" },
  "heading:countdown": { animation: "fade" },
  "heading:location": { animation: "rise" },
  "heading:rsvp": { animation: "rise" },
  "heading:wishes": { animation: "rise" },
  "heading:gift": { animation: "rise" },
  "heading:closing": { animation: "rise" },
  "object:closing:flower-art": { animation: "soft-scale", animationDuration: .85 },
  "object:closing:names": { animation: "rise", animationDelay: .07 },
};

const modernMaroonNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:background-art": { animation: "fade", animationDuration: .8 },
  "object:envelope:fabric-art": { animation: "glide-right", animationDuration: .9, animationDelay: .08 },
  "object:envelope:card-stage": { animation: "rise", animationDuration: .86, animationDelay: .1 },
  "object:envelope:monogram": { animation: "soft-scale", animationDuration: .72 },
  "object:cover:background-art": { animation: "fade", animationDuration: .8 },
  "object:cover:gold-art": { animation: "reveal-left", animationDuration: .9, animationDelay: .04 },
  "object:cover:flower-art": { animation: "glide-left", animationDuration: .9, animationDelay: .08 },
  "object:cover:monogram": { animation: "soft-scale", animationDuration: .75 },
  "object:cover:media-group": { animation: "reveal-left", animationDuration: .92, animationDelay: .06 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .82, animationDelay: .12 },
  "heading:greeting": { animation: "slide-left", animationDuration: .72 },
  "object:greeting:copy-group": { animation: "glide-right", animationDuration: .82, animationDelay: .08 },
  "object:greeting:flourish": { animation: "reveal-left", animationDuration: .8, animationDelay: .12 },
  "heading:identity": { animation: "rise", animationDuration: .7 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .86 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .86, animationDelay: .09 },
  "heading:event": { animation: "slide-left", animationDuration: .72 },
  "object:event:details-group": { animation: "rise", animationDuration: .8, animationDelay: .08 },
  "heading:dateTime": { animation: "fade", animationDuration: .7 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .88, animationDelay: .07 },
  "heading:gallery": { animation: "slide-left", animationDuration: .7 },
  "object:gallery:flourish": { animation: "reveal-left", animationDuration: .8 },
  "heading:countdown": { animation: "fade", animationDuration: .65 },
  "object:countdown:grid": { animation: "rise", animationDuration: .72, animationDelay: .06 },
  "heading:location": { animation: "slide-left", animationDuration: .72 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .82, animationDelay: .08 },
  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "heading:wishes": { animation: "slide-left", animationDuration: .72 },
  "heading:gift": { animation: "fade", animationDuration: .7 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .08 },
  "heading:closing": { animation: "rise", animationDuration: .74 },
  "object:closing:copy-group": { animation: "glide-right", animationDuration: .86, animationDelay: .07 },
  "object:closing:flourish": { animation: "reveal-left", animationDuration: .8, animationDelay: .11 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .78, animationDelay: .13 },
};

const sereinNative: Record<string, TemplateNativeMotion> = {
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .08 },
  "object:cover:ampersand-symbol": { animation: "rise", animationDuration: .65, animationDelay: .12 },
  "object:cover:event-name": { animation: "rise", animationDuration: .8 },
  "heading:greeting": { animation: "rise" },
  "heading:identity": { animation: "rise" },
  "heading:event": { animation: "slide-left" },
  "heading:dateTime": { animation: "rise" },
  "heading:gallery": { animation: "slide-left" },
  "heading:closing": { animation: "rise" },
  "object:closing:names": { animation: "rise", animationDelay: .08 },
};

const pencilReverieNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:intro": { animation: "fade", animationDuration: .62 },
  "object:envelope:illustration-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .04 },
  "object:envelope:ribbon-art": { animation: "glide-left", animationDuration: .72, animationDelay: .08 },
  "object:envelope:ticket-art": { animation: "glide-right", animationDuration: .72, animationDelay: .12 },
  "object:envelope:heart": { animation: "soft-scale", animationDuration: .62, animationDelay: .16 },

  "object:cover:paper-sheet": { animation: "reveal-left", animationDuration: .82 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .76, animationDelay: .05 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .74, animationDelay: .08 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .6, animationDelay: .12 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .74, animationDelay: .15 },
  "object:cover:event-name": { animation: "rise", animationDuration: .76, animationDelay: .08 },
  "object:cover:date": { animation: "fade", animationDuration: .62, animationDelay: .18 },
  "object:cover:ribbon-art": { animation: "glide-left", animationDuration: .75, animationDelay: .04 },
  "object:cover:polaroid-art": { animation: "tilt-in", animationDuration: .72, animationDelay: .08 },
  "object:cover:lamp-art": { animation: "reveal-up", animationDuration: .82, animationDelay: .1 },
  "object:cover:couple-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .13 },
  "object:cover:ticket-art": { animation: "tilt-in", animationDuration: .72, animationDelay: .16 },
  "object:cover:camera-art": { animation: "glide-left", animationDuration: .76, animationDelay: .18 },

  "heading:greeting": { animation: "slide-left", animationDuration: .68 },
  "object:greeting:copy-group": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:greeting:theme-art": { animation: "soft-scale", animationDuration: .8, animationDelay: .08 },

  "heading:identity": { animation: "rise", animationDuration: .68 },
  "object:identity:portrait-art": { animation: "tilt-in", animationDuration: .78, animationDelay: .06 },
  "object:identity:names": { animation: "slide-right", animationDuration: .74, animationDelay: .1 },
  "object:identity:signature": { animation: "fade", animationDuration: .65, animationDelay: .14 },
  "object:identity:parents-group": { animation: "rise", animationDuration: .74, animationDelay: .16 },
  "object:identity:theme-art": { animation: "glide-right", animationDuration: .78, animationDelay: .1 },

  "heading:event": { animation: "slide-right", animationDuration: .68 },
  "object:event:details-group": { animation: "rise", animationDuration: .76, animationDelay: .06 },
  "object:event:theme-art": { animation: "reveal-left", animationDuration: .82, animationDelay: .1 },

  "heading:dateTime": { animation: "slide-left", animationDuration: .68 },
  "object:dateTime:panel": { animation: "tilt-in", animationDuration: .78, animationDelay: .06 },
  "object:dateTime:theme-art": { animation: "glide-right", animationDuration: .78, animationDelay: .1 },

  "heading:gallery": { animation: "rise", animationDuration: .68 },
  "object:gallery:memory-board": { animation: "rise", animationDuration: .74, animationDelay: .04 },

  "heading:countdown": { animation: "fade", animationDuration: .64 },
  "object:countdown:clock-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .04 },
  "object:countdown:grid": { animation: "rise", animationDuration: .72, animationDelay: .08 },
  "object:countdown:theme-art": { animation: "tilt-in", animationDuration: .76, animationDelay: .12 },

  "heading:location": { animation: "slide-right", animationDuration: .68 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .78, animationDelay: .06 },
  "object:location:theme-art": { animation: "reveal-left", animationDuration: .82, animationDelay: .1 },

  "heading:rsvp": { animation: "rise", animationDuration: .68 },
  "object:rsvp:intro": { animation: "rise", animationDuration: .7, animationDelay: .04 },
  "object:rsvp:theme-art": { animation: "soft-scale", animationDuration: .76, animationDelay: .08 },

  "heading:wishes": { animation: "slide-left", animationDuration: .68 },
  "object:wishes:theme-art": { animation: "tilt-in", animationDuration: .76, animationDelay: .08 },

  "heading:gift": { animation: "rise", animationDuration: .68 },
  "object:gift:panel": { animation: "tilt-in", animationDuration: .78, animationDelay: .05 },
  "object:gift:theme-art": { animation: "glide-left", animationDuration: .78, animationDelay: .1 },

  "heading:closing": { animation: "slide-right", animationDuration: .68 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .76, animationDelay: .06 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .74, animationDelay: .12 },
  "object:closing:theme-art": { animation: "glide-right", animationDuration: .8, animationDelay: .1 },
};

const paperCutBotanicalNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:paper-back": { animation: "paper-cut", animationDuration: .76 },
  "object:envelope:paper-middle": { animation: "paper-cut", animationDuration: .78, animationDelay: .05 },
  "object:envelope:ribbon-art": { animation: "glide-left", animationDuration: .72, animationDelay: .08 },
  "object:envelope:ticket-art": { animation: "tilt-in", animationDuration: .72, animationDelay: .12 },
  "object:envelope:seal-art": { animation: "soft-scale", animationDuration: .66, animationDelay: .16 },
  "object:cover:paper-back": { animation: "paper-cut", animationDuration: .78 },
  "object:cover:paper-middle": { animation: "paper-cut", animationDuration: .82, animationDelay: .05 },
  "object:cover:ribbon-art": { animation: "glide-left", animationDuration: .72, animationDelay: .08 },
  "object:cover:couple-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .12 },
  "object:cover:ticket-art": { animation: "tilt-in", animationDuration: .74, animationDelay: .16 },
  "object:cover:seal-art": { animation: "soft-scale", animationDuration: .68, animationDelay: .2 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .76, animationDelay: .1 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .72, animationDelay: .14 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .72, animationDelay: .2 },
  "object:cover:event-name": { animation: "rise", animationDuration: .74, animationDelay: .14 },
  "object:cover:date": { animation: "fade", animationDuration: .62, animationDelay: .22 },
  "heading:greeting": { animation: "slide-left", animationDuration: .68 },
  "object:greeting:paper-art": { animation: "glide-right", animationDuration: .78, animationDelay: .08 },
  "heading:identity": { animation: "rise", animationDuration: .68 },
  "object:identity:couple-art": { animation: "paper-cut", animationDuration: .82, animationDelay: .06 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .76, animationDelay: .1 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .76, animationDelay: .16 },
  "heading:event": { animation: "slide-left", animationDuration: .68 },
  "object:event:details-group": { animation: "rise", animationDuration: .74, animationDelay: .08 },
  "object:event:paper-art": { animation: "tilt-in", animationDuration: .76, animationDelay: .12 },
  "heading:dateTime": { animation: "slide-right", animationDuration: .68 },
  "object:dateTime:panel": { animation: "paper-cut", animationDuration: .78, animationDelay: .06 },
  "object:dateTime:paper-art": { animation: "glide-left", animationDuration: .78, animationDelay: .1 },
  "heading:gallery": { animation: "slide-left", animationDuration: .68 },
  "object:gallery:keepsake-group": { animation: "tilt-in", animationDuration: .74, animationDelay: .04 },
  "object:gallery:note-group": { animation: "tilt-in", animationDuration: .74, animationDelay: .1 },
  "object:gallery:journey-group": { animation: "paper-cut", animationDuration: .8, animationDelay: .16 },
  "heading:countdown": { animation: "fade", animationDuration: .64 },
  "object:countdown:grid": { animation: "rise", animationDuration: .72, animationDelay: .06 },
  "object:countdown:paper-art": { animation: "soft-scale", animationDuration: .78, animationDelay: .1 },
  "heading:location": { animation: "slide-right", animationDuration: .68 },
  "object:location:details-group": { animation: "paper-cut", animationDuration: .78, animationDelay: .06 },
  "object:location:paper-art": { animation: "glide-left", animationDuration: .8, animationDelay: .1 },
  "heading:rsvp": { animation: "rise", animationDuration: .68 },
  "object:rsvp:paper-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .08 },
  "heading:wishes": { animation: "slide-left", animationDuration: .68 },
  "object:wishes:paper-art": { animation: "tilt-in", animationDuration: .76, animationDelay: .08 },
  "heading:gift": { animation: "rise", animationDuration: .68 },
  "object:gift:panel": { animation: "paper-cut", animationDuration: .78, animationDelay: .06 },
  "object:gift:paper-art": { animation: "glide-right", animationDuration: .78, animationDelay: .1 },
  "heading:closing": { animation: "rise", animationDuration: .7 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .76, animationDelay: .06 },
  "object:closing:paper-art": { animation: "glide-left", animationDuration: .8, animationDelay: .1 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .74, animationDelay: .12 },
};

const goldenArtDecoNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "rise", animationDuration: .72 },
  "object:envelope:rail-left": { animation: "reveal-up", animationDuration: .78 },
  "object:envelope:rail-right": { animation: "reveal-up", animationDuration: .78, animationDelay: .04 },
  "object:envelope:garland-art": { animation: "reveal-left", animationDuration: .86 },
  "object:envelope:candelabra-art": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .62 },
  "object:envelope:date": { animation: "fade", animationDelay: .08 },
  "object:envelope:ticket-stage": { animation: "rise", animationDuration: .86, animationDelay: .08 },
  "object:envelope:fan-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .1 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .66, animationDelay: .12 },

  "object:cover:rail": { animation: "reveal-up", animationDuration: .8 },
  "object:cover:steps": { animation: "reveal-left", animationDuration: .78, animationDelay: .03 },
  "object:cover:fan-art": { animation: "soft-scale", animationDuration: .8, animationDelay: .04 },
  "object:cover:garland-art": { animation: "reveal-left", animationDuration: .84, animationDelay: .07 },
  "object:cover:arch-art": { animation: "glide-right", animationDuration: .9, animationDelay: .08 },
  "object:cover:champagne-art": { animation: "rise", animationDuration: .8, animationDelay: .11 },
  "object:cover:kicker": { animation: "fade", animationDuration: .62, animationDelay: .05 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .82, animationDelay: .08 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .07 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .62, animationDelay: .1 },
  "object:cover:event-name": { animation: "rise", animationDuration: .82 },
  "object:cover:closing-copy": { animation: "fade", animationDelay: .14 },
  "object:cover:date": { animation: "reveal-up", animationDuration: .72, animationDelay: .12 },

  "heading:greeting": { animation: "slide-left", animationDuration: .72 },
  "object:greeting:deco-art": { animation: "glide-right", animationDuration: .84, animationDelay: .06 },

  "heading:identity": { animation: "rise", animationDuration: .72 },
  "object:identity:mirror-art": { animation: "soft-scale", animationDuration: .84, animationDelay: .06 },
  "object:identity:chaise-art": { animation: "glide-right", animationDuration: .86, animationDelay: .08 },
  "object:identity:fan-art": { animation: "fade", animationDuration: .76, animationDelay: .1 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .84 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "object:identity:ampersand": { animation: "fade", animationDuration: .64, animationDelay: .1 },

  "heading:event": { animation: "slide-left", animationDuration: .72 },
  "object:event:details-group": { animation: "rise", animationDuration: .8, animationDelay: .07 },
  "object:event:deco-art": { animation: "glide-right", animationDuration: .86, animationDelay: .08 },

  "heading:dateTime": { animation: "slide-right", animationDuration: .72 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:dateTime:deco-art": { animation: "fade", animationDuration: .76, animationDelay: .1 },

  "heading:gallery": { animation: "slide-left", animationDuration: .72 },
  "object:gallery:garland-art": { animation: "reveal-left", animationDuration: .84 },
  "object:gallery:toast-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .04 },
  "object:gallery:rhythm-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .1 },
  "object:gallery:reflection-group": { animation: "rise", animationDuration: .82, animationDelay: .16 },
  "object:gallery:champagne-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .08 },
  "object:gallery:gramophone-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .13 },
  "object:gallery:mirror-art": { animation: "soft-scale", animationDuration: .8, animationDelay: .18 },

  "heading:countdown": { animation: "fade", animationDuration: .68 },
  "object:countdown:grid": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:countdown:deco-art": { animation: "fade", animationDuration: .8, animationDelay: .1 },

  "heading:location": { animation: "slide-right", animationDuration: .72 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "object:location:deco-art": { animation: "glide-left", animationDuration: .88, animationDelay: .08 },

  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "object:rsvp:deco-art": { animation: "fade", animationDuration: .78, animationDelay: .08 },

  "heading:wishes": { animation: "slide-left", animationDuration: .72 },
  "object:wishes:deco-art": { animation: "glide-left", animationDuration: .84, animationDelay: .08 },

  "heading:gift": { animation: "rise", animationDuration: .72 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:gift:deco-art": { animation: "fade", animationDuration: .78, animationDelay: .1 },

  "heading:closing": { animation: "rise", animationDuration: .74 },
  "object:closing:copy-group": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:closing:deco-art": { animation: "soft-scale", animationDuration: .86, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .78, animationDelay: .12 },
};

const classicPearlNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "rise", animationDuration: .72 },
  "object:envelope:garland-art": { animation: "reveal-left", animationDuration: .88 },
  "object:envelope:candelabra-art": { animation: "glide-right", animationDuration: .84, animationDelay: .06 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .62 },
  "object:envelope:date": { animation: "fade", animationDelay: .08 },
  "object:envelope:stationery-group": { animation: "rise", animationDuration: .86, animationDelay: .08 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .66, animationDelay: .12 },

  "object:cover:ledger-line": { animation: "reveal-up", animationDuration: .78 },
  "object:cover:chandelier-art": { animation: "glide-left", animationDuration: .86, animationDelay: .03 },
  "object:cover:arch-art": { animation: "glide-right", animationDuration: .9, animationDelay: .06 },
  "object:cover:garland-art": { animation: "reveal-left", animationDuration: .82, animationDelay: .1 },
  "object:cover:tiara-art": { animation: "soft-scale", animationDuration: .76, animationDelay: .13 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .82, animationDelay: .09 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .07 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .62, animationDelay: .1 },
  "object:cover:event-name": { animation: "rise", animationDuration: .82 },
  "object:cover:pearl-trail": { animation: "reveal-left", animationDuration: .74, animationDelay: .15 },
  "object:cover:date": { animation: "fade", animationDelay: .14 },
  "object:cover:closing-copy": { animation: "fade", animationDelay: .16 },

  "heading:greeting": { animation: "slide-left", animationDuration: .72 },
  "object:greeting:pearl-art": { animation: "glide-right", animationDuration: .84, animationDelay: .06 },

  "heading:identity": { animation: "rise", animationDuration: .72 },
  "object:identity:mirror-art": { animation: "soft-scale", animationDuration: .84, animationDelay: .06 },
  "object:identity:tiara-art": { animation: "rise", animationDuration: .76, animationDelay: .08 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .84 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "object:identity:ampersand": { animation: "fade", animationDuration: .64, animationDelay: .1 },

  "heading:event": { animation: "slide-left", animationDuration: .72 },
  "object:event:details-group": { animation: "rise", animationDuration: .8, animationDelay: .07 },
  "object:event:pearl-art": { animation: "glide-right", animationDuration: .86, animationDelay: .08 },

  "heading:dateTime": { animation: "slide-right", animationDuration: .72 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:dateTime:pearl-art": { animation: "fade", animationDuration: .76, animationDelay: .1 },

  "heading:gallery": { animation: "slide-left", animationDuration: .72 },
  "object:gallery:garland-art": { animation: "reveal-left", animationDuration: .84 },
  "object:gallery:promise-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .04 },
  "object:gallery:memory-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .1 },
  "object:gallery:reflection-group": { animation: "rise", animationDuration: .82, animationDelay: .16 },
  "object:gallery:tiara-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .08 },
  "object:gallery:perfume-art": { animation: "soft-scale", animationDuration: .74, animationDelay: .13 },
  "object:gallery:mirror-art": { animation: "soft-scale", animationDuration: .8, animationDelay: .18 },

  "heading:countdown": { animation: "fade", animationDuration: .68 },
  "object:countdown:grid": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:countdown:pearl-art": { animation: "fade", animationDuration: .8, animationDelay: .1 },

  "heading:location": { animation: "slide-right", animationDuration: .72 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "object:location:pearl-art": { animation: "glide-left", animationDuration: .88, animationDelay: .08 },

  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "object:rsvp:pearl-art": { animation: "fade", animationDuration: .78, animationDelay: .08 },

  "heading:wishes": { animation: "slide-left", animationDuration: .72 },
  "object:wishes:pearl-art": { animation: "glide-left", animationDuration: .84, animationDelay: .08 },

  "heading:gift": { animation: "rise", animationDuration: .72 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:gift:pearl-art": { animation: "fade", animationDuration: .78, animationDelay: .1 },

  "heading:closing": { animation: "rise", animationDuration: .74 },
  "object:closing:copy-group": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:closing:pearl-art": { animation: "soft-scale", animationDuration: .86, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .78, animationDelay: .12 },
};

const midnightRomanceNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "rise", animationDuration: .72 },
  "object:envelope:night-glow": { animation: "fade", animationDuration: .9 },
  "object:envelope:chandelier-art": { animation: "reveal-up", animationDuration: .92 },
  "object:envelope:lantern-art": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .62 },
  "object:envelope:date": { animation: "fade", animationDelay: .08 },
  "object:envelope:card-stage": { animation: "rise", animationDuration: .86, animationDelay: .08 },
  "object:envelope:garland-art": { animation: "fade", animationDuration: .78, animationDelay: .1 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .66, animationDelay: .12 },
  "object:cover:night-glow": { animation: "fade", animationDuration: .92 },
  "object:cover:chandelier-art": { animation: "reveal-up", animationDuration: .92 },
  "object:cover:arch-art": { animation: "soft-scale", animationDuration: .88, animationDelay: .04 },
  "object:cover:garland-art": { animation: "fade", animationDuration: .78, animationDelay: .08 },
  "object:cover:media-group": { animation: "reveal-up", animationDuration: .9, animationDelay: .08 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .82, animationDelay: .12 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .07 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .62, animationDelay: .1 },
  "object:cover:event-name": { animation: "rise", animationDuration: .82 },
  "object:cover:date": { animation: "fade", animationDelay: .14 },
  "object:cover:closing-copy": { animation: "fade", animationDelay: .16 },
  "heading:greeting": { animation: "slide-left", animationDuration: .72 },
  "object:greeting:midnight-art": { animation: "glide-right", animationDuration: .86, animationDelay: .07 },
  "heading:identity": { animation: "rise", animationDuration: .72 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .86 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .86, animationDelay: .08 },
  "object:identity:midnight-art": { animation: "soft-scale", animationDuration: .84, animationDelay: .1 },
  "heading:event": { animation: "slide-left", animationDuration: .72 },
  "object:event:details-group": { animation: "rise", animationDuration: .82, animationDelay: .08 },
  "object:event:midnight-art": { animation: "glide-right", animationDuration: .88, animationDelay: .08 },
  "heading:dateTime": { animation: "slide-right", animationDuration: .72 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .86, animationDelay: .06 },
  "object:dateTime:midnight-art": { animation: "fade", animationDuration: .78, animationDelay: .1 },
  "heading:gallery": { animation: "slide-left", animationDuration: .72 },
  "object:gallery:garland-art": { animation: "reveal-left", animationDuration: .86 },
  "object:gallery:grid": { animation: "rise", animationDuration: .8, animationDelay: .06 },
  "object:gallery:mirror-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .1 },
  "heading:countdown": { animation: "fade", animationDuration: .68 },
  "object:countdown:grid": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:countdown:midnight-art": { animation: "fade", animationDuration: .8, animationDelay: .1 },
  "heading:location": { animation: "slide-right", animationDuration: .72 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "object:location:midnight-art": { animation: "glide-left", animationDuration: .88, animationDelay: .08 },
  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "object:rsvp:midnight-art": { animation: "fade", animationDuration: .78, animationDelay: .08 },
  "heading:wishes": { animation: "slide-left", animationDuration: .72 },
  "object:wishes:midnight-art": { animation: "glide-left", animationDuration: .84, animationDelay: .08 },
  "heading:gift": { animation: "rise", animationDuration: .72 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:gift:midnight-art": { animation: "fade", animationDuration: .78, animationDelay: .1 },
  "heading:closing": { animation: "rise", animationDuration: .74 },
  "object:closing:copy-group": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:closing:midnight-art": { animation: "soft-scale", animationDuration: .86, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .78, animationDelay: .12 },
};

const gardenLightNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "rise", animationDuration: .7 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .62 },
  "object:envelope:fireflies": { animation: "fade", animationDuration: .9 },
  "object:envelope:date": { animation: "fade", animationDelay: .08 },
  "object:envelope:hanging-lantern-art": { animation: "glide-right", animationDuration: .86 },
  "object:envelope:birdcage-art": { animation: "rise", animationDuration: .88, animationDelay: .05 },
  "object:envelope:card-stage": { animation: "rise", animationDuration: .84, animationDelay: .08 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .68, animationDelay: .12 },
  "object:cover:fireflies": { animation: "fade", animationDuration: .9 },
  "object:cover:arch-art": { animation: "reveal-up", animationDuration: .9 },
  "object:cover:garland-art": { animation: "fade", animationDuration: .76, animationDelay: .05 },
  "object:cover:media-group": { animation: "soft-scale", animationDuration: .82, animationDelay: .08 },
  "object:cover:lantern-art": { animation: "glide-right", animationDuration: .82, animationDelay: .12 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .8, animationDelay: .12 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .78 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .78, animationDelay: .07 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .62, animationDelay: .1 },
  "object:cover:event-name": { animation: "rise", animationDuration: .8 },
  "object:cover:date": { animation: "fade", animationDelay: .14 },
  "object:cover:closing-copy": { animation: "fade", animationDelay: .16 },
  "heading:greeting": { animation: "slide-left", animationDuration: .72 },
  "object:greeting:garden-art": { animation: "glide-right", animationDuration: .84, animationDelay: .06 },
  "heading:identity": { animation: "rise", animationDuration: .72 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .84 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .84, animationDelay: .07 },
  "object:identity:garden-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .1 },
  "heading:event": { animation: "slide-left", animationDuration: .72 },
  "object:event:details-group": { animation: "rise", animationDuration: .8, animationDelay: .07 },
  "object:event:garden-art": { animation: "glide-right", animationDuration: .84, animationDelay: .08 },
  "heading:dateTime": { animation: "rise", animationDuration: .72 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .84, animationDelay: .06 },
  "object:dateTime:garden-art": { animation: "fade", animationDuration: .76, animationDelay: .1 },
  "heading:gallery": { animation: "slide-left", animationDuration: .7 },
  "object:gallery:garland-art": { animation: "reveal-left", animationDuration: .86 },
  "object:gallery:grid": { animation: "rise", animationDuration: .78, animationDelay: .06 },
  "object:gallery:parasol-art": { animation: "glide-right", animationDuration: .82, animationDelay: .1 },
  "heading:countdown": { animation: "fade", animationDuration: .68 },
  "object:countdown:grid": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:countdown:garden-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .1 },
  "heading:location": { animation: "slide-left", animationDuration: .72 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .82, animationDelay: .07 },
  "object:location:garden-art": { animation: "glide-left", animationDuration: .86, animationDelay: .08 },
  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "object:rsvp:garden-art": { animation: "fade", animationDuration: .76, animationDelay: .08 },
  "heading:wishes": { animation: "slide-left", animationDuration: .72 },
  "object:wishes:garden-art": { animation: "glide-left", animationDuration: .84, animationDelay: .08 },
  "heading:gift": { animation: "rise", animationDuration: .72 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .82, animationDelay: .06 },
  "object:gift:garden-art": { animation: "fade", animationDuration: .76, animationDelay: .1 },
  "heading:closing": { animation: "rise", animationDuration: .72 },
  "object:closing:copy-group": { animation: "glide-right", animationDuration: .82, animationDelay: .06 },
  "object:closing:garden-art": { animation: "soft-scale", animationDuration: .84, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .76, animationDelay: .12 },
};

const botanicalNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "fade", animationDuration: .62 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .6 },
  "object:envelope:date": { animation: "fade", animationDelay: .06 },
  "object:envelope:stationery-group": { animation: "soft-scale", animationDuration: .78 },
  "object:envelope:ring-ornament": { animation: "soft-scale", animationDuration: .68, animationDelay: .08 },
  "object:cover:kicker": { animation: "fade", animationDuration: .62 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .06 },
  "object:cover:ampersand-symbol": { animation: "soft-scale", animationDuration: .66, animationDelay: .1 },
  "object:cover:event-name": { animation: "rise", animationDuration: .8 },
  "object:cover:date": { animation: "fade", animationDelay: .12 },
  "object:cover:ring-ornament": { animation: "soft-scale", animationDuration: .72, animationDelay: .08 },
  "object:cover:sprig-left": { animation: "fade", animationDuration: .72, animationDelay: .16 },
  "object:cover:closing-copy": { animation: "fade", animationDelay: .17 },
  "heading:greeting": { animation: "rise", animationDuration: .72 },
  "object:greeting:theme-leaf": { animation: "fade", animationDuration: .72 },
  "heading:identity": { animation: "rise", animationDuration: .72 },
  "object:identity:personOne-name": { animation: "slide-left", animationDuration: .8 },
  "object:identity:personTwo-name": { animation: "slide-right", animationDuration: .8, animationDelay: .06 },
  "object:identity:ring-ornament": { animation: "soft-scale", animationDuration: .72, animationDelay: .08 },
  "object:identity:event-name": { animation: "rise", animationDuration: .76 },
  "object:identity:theme-art": { animation: "fade", animationDuration: .7 },
  "object:identity:our-story-heading": { animation: "rise", animationDuration: .72 },
  "heading:event": { animation: "rise", animationDuration: .72 },
  "object:event:ring-ornament": { animation: "soft-scale", animationDuration: .7, animationDelay: .08 },
  "heading:dateTime": { animation: "rise", animationDuration: .72 },
  "object:dateTime:panel": { animation: "fade", animationDelay: .08 },
  "heading:gallery": { animation: "rise", animationDuration: .72 },
  "object:gallery:specimenOne-group": { animation: "tilt-in", animationDuration: .78 },
  "object:gallery:specimenTwo-group": { animation: "tilt-in", animationDuration: .78, animationDelay: .06 },
  "heading:countdown": { animation: "fade", animationDuration: .68 },
  "heading:location": { animation: "rise", animationDuration: .72 },
  "object:location:ring-ornament": { animation: "soft-scale", animationDuration: .7, animationDelay: .08 },
  "heading:rsvp": { animation: "rise", animationDuration: .72 },
  "heading:wishes": { animation: "rise", animationDuration: .72 },
  "heading:gift": { animation: "rise", animationDuration: .72 },
  "heading:closing": { animation: "rise", animationDuration: .72 },
  "object:closing:theme-leaf": { animation: "fade", animationDuration: .72 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .78, animationDelay: .08 },
};

const celestialInkNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:sky-field": { animation: "fade", animationDuration: .7 },
  "object:envelope:drapery-art": { animation: "reveal-left", animationDuration: .84, animationDelay: .03 },
  "object:envelope:pillars-art": { animation: "reveal-up", animationDuration: .86, animationDelay: .06 },
  "object:envelope:calligraphy-art": { animation: "glide-right", animationDuration: .8, animationDelay: .09 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .62, animationDelay: .08 },
  "object:envelope:letter-paper": { animation: "rise", animationDuration: .82, animationDelay: .1 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .64, animationDelay: .16 },

  "object:cover:sky-field": { animation: "fade", animationDuration: .72 },
  "object:cover:drapery-art": { animation: "reveal-left", animationDuration: .86, animationDelay: .03 },
  "object:cover:screen-art": { animation: "glide-left", animationDuration: .88, animationDelay: .05 },
  "object:cover:moon-gate-art": { animation: "glide-right", animationDuration: .92, animationDelay: .08 },
  "object:cover:lantern-art": { animation: "reveal-up", animationDuration: .78, animationDelay: .11 },
  "object:cover:orbit-line": { animation: "soft-scale", animationDuration: .8, animationDelay: .12 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .8, animationDelay: .1 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .74, animationDelay: .13 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .6, animationDelay: .17 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .74, animationDelay: .2 },
  "object:cover:event-name": { animation: "rise", animationDuration: .76, animationDelay: .14 },
  "object:cover:date": { animation: "fade", animationDuration: .62, animationDelay: .22 },
  "object:cover:closing-copy": { animation: "fade", animationDuration: .66, animationDelay: .25 },

  "heading:greeting": { animation: "slide-left", animationDuration: .68 },
  "object:greeting:celestial-art": { animation: "glide-right", animationDuration: .82, animationDelay: .08 },
  "heading:identity": { animation: "rise", animationDuration: .68 },
  "object:identity:mirror-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .05 },
  "object:identity:chaise-art": { animation: "reveal-up", animationDuration: .8, animationDelay: .09 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .78, animationDelay: .1 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .78, animationDelay: .16 },

  "heading:event": { animation: "slide-left", animationDuration: .68 },
  "object:event:details-group": { animation: "rise", animationDuration: .76, animationDelay: .06 },
  "object:event:celestial-art": { animation: "glide-right", animationDuration: .82, animationDelay: .1 },

  "heading:dateTime": { animation: "slide-right", animationDuration: .68 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .78, animationDelay: .06 },
  "object:dateTime:celestial-art": { animation: "glide-left", animationDuration: .8, animationDelay: .1 },

  "heading:gallery": { animation: "slide-left", animationDuration: .68 },
  "object:gallery:toast-group": { animation: "tilt-in", animationDuration: .76, animationDelay: .05 },
  "object:gallery:rhythm-group": { animation: "tilt-in", animationDuration: .76, animationDelay: .11 },
  "object:gallery:reflection-group": { animation: "tilt-in", animationDuration: .76, animationDelay: .17 },

  "heading:countdown": { animation: "fade", animationDuration: .64 },
  "object:countdown:grid": { animation: "rise", animationDuration: .72, animationDelay: .06 },
  "object:countdown:celestial-art": { animation: "soft-scale", animationDuration: .76, animationDelay: .1 },

  "heading:location": { animation: "slide-right", animationDuration: .68 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .78, animationDelay: .06 },
  "object:location:celestial-art": { animation: "glide-left", animationDuration: .84, animationDelay: .1 },

  "heading:rsvp": { animation: "rise", animationDuration: .68 },
  "object:rsvp:celestial-art": { animation: "reveal-up", animationDuration: .76, animationDelay: .08 },
  "heading:wishes": { animation: "slide-left", animationDuration: .68 },
  "object:wishes:celestial-art": { animation: "glide-left", animationDuration: .82, animationDelay: .08 },
  "heading:gift": { animation: "rise", animationDuration: .68 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .76, animationDelay: .06 },
  "object:gift:celestial-art": { animation: "glide-right", animationDuration: .8, animationDelay: .1 },

  "heading:closing": { animation: "rise", animationDuration: .7 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .76, animationDelay: .06 },
  "object:closing:celestial-art": { animation: "soft-scale", animationDuration: .82, animationDelay: .09 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .72, animationDelay: .12 },
};

const velvetHorizonNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:sunset-glow": { animation: "fade", animationDuration: .72 },
  "object:envelope:garland-art": { animation: "glide-left", animationDuration: .82, animationDelay: .07 },
  "object:envelope:intro": { animation: "rise", animationDuration: .68, animationDelay: .06 },
  "object:envelope:stationery-group": { animation: "soft-scale", animationDuration: .78, animationDelay: .08 },
  "object:envelope:paper": { animation: "rise", animationDuration: .74, animationDelay: .1 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .62, animationDelay: .14 },

  "object:cover:sunset-field": { animation: "fade", animationDuration: .76 },
  "object:cover:media-group": { animation: "fade", animationDuration: .8, animationDelay: .02 },
  "object:cover:arch-art": { animation: "reveal-up", animationDuration: .88, animationDelay: .04 },
  "object:cover:drape-art": { animation: "reveal-up", animationDuration: .76, animationDelay: .05 },
  "object:cover:blossom-art": { animation: "fade", animationDuration: .68, animationDelay: .08 },
  "object:cover:copy-panel": { animation: "rise", animationDuration: .8, animationDelay: .1 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .76, animationDelay: .12 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .58, animationDelay: .16 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .76, animationDelay: .19 },
  "object:cover:event-name": { animation: "rise", animationDuration: .76, animationDelay: .14 },
  "object:cover:date": { animation: "fade", animationDuration: .62, animationDelay: .21 },
  "object:cover:closing-copy": { animation: "fade", animationDuration: .66, animationDelay: .24 },

  "heading:greeting": { animation: "rise", animationDuration: .68 },
  "object:greeting:velvet-art": { animation: "glide-right", animationDuration: .8, animationDelay: .06 },
  "heading:identity": { animation: "rise", animationDuration: .68 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .8, animationDelay: .04 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .8, animationDelay: .1 },
  "object:identity:velvet-art": { animation: "reveal-up", animationDuration: .82, animationDelay: .08 },

  "heading:event": { animation: "rise", animationDuration: .68 },
  "object:event:details-group": { animation: "reveal-up", animationDuration: .76, animationDelay: .06 },
  "object:event:velvet-art": { animation: "fade", animationDuration: .68, animationDelay: .06 },

  "heading:dateTime": { animation: "rise", animationDuration: .68 },
  "object:dateTime:panel": { animation: "soft-scale", animationDuration: .76, animationDelay: .05 },
  "object:dateTime:velvet-art": { animation: "fade", animationDuration: .76, animationDelay: .08 },

  "heading:gallery": { animation: "rise", animationDuration: .68 },
  "object:gallery:grid": { animation: "rise", animationDuration: .68, animationDelay: .04 },
  "object:gallery:velvet-art": { animation: "reveal-up", animationDuration: .78, animationDelay: .07 },

  "heading:countdown": { animation: "fade", animationDuration: .64 },
  "object:countdown:grid": { animation: "rise", animationDuration: .72, animationDelay: .05 },
  "object:countdown:velvet-art": { animation: "fade", animationDuration: .68, animationDelay: .06 },

  "heading:location": { animation: "rise", animationDuration: .68 },
  "object:location:details-group": { animation: "reveal-up", animationDuration: .76, animationDelay: .06 },
  "object:location:velvet-art": { animation: "glide-left", animationDuration: .82, animationDelay: .08 },

  "heading:rsvp": { animation: "rise", animationDuration: .68 },
  "object:rsvp:velvet-art": { animation: "fade", animationDuration: .68, animationDelay: .06 },

  "heading:wishes": { animation: "rise", animationDuration: .68 },
  "object:wishes:velvet-art": { animation: "fade", animationDuration: .68, animationDelay: .06 },

  "heading:gift": { animation: "rise", animationDuration: .68 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .76, animationDelay: .06 },
  "object:gift:velvet-art": { animation: "fade", animationDuration: .76, animationDelay: .09 },

  "heading:closing": { animation: "rise", animationDuration: .7 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .74, animationDelay: .06 },
  "object:closing:velvet-art": { animation: "reveal-up", animationDuration: .82, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .72, animationDelay: .12 },
};

const zenAtelierNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:atmosphere-group": { animation: "fade", animationDuration: .72 },
  "object:envelope:sun": { animation: "soft-scale", animationDuration: .72, animationDelay: .03 },
  "object:envelope:branch": { animation: "glide-left", animationDuration: .76, animationDelay: .05 },
  "object:envelope:mountains": { animation: "reveal-up", animationDuration: .78, animationDelay: .07 },
  "object:envelope:intro-group": { animation: "rise", animationDuration: .68, animationDelay: .08 },
  "object:envelope:paper-stage": { animation: "soft-scale", animationDuration: .74, animationDelay: .1 },
  "object:envelope:mizuhiki": { animation: "reveal-left", animationDuration: .7, animationDelay: .14 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .62, animationDelay: .18 },

  "object:cover:paper-shadow": { animation: "fade", animationDuration: .68 },
  "object:cover:shoji": { animation: "reveal-left", animationDuration: .72, animationDelay: .03 },
  "object:cover:sun": { animation: "soft-scale", animationDuration: .76, animationDelay: .05 },
  "object:cover:blossom": { animation: "glide-left", animationDuration: .78, animationDelay: .07 },
  "object:cover:scroll-group": { animation: "reveal-up", animationDuration: .82, animationDelay: .08 },
  "object:cover:copy-group": { animation: "rise", animationDuration: .74, animationDelay: .12 },
  "object:cover:seal": { animation: "soft-scale", animationDuration: .62, animationDelay: .15 },
  "object:cover:personOne-name": { animation: "slide-left", animationDuration: .7, animationDelay: .14 },
  "object:cover:ampersand-symbol": { animation: "fade", animationDuration: .58, animationDelay: .18 },
  "object:cover:personTwo-name": { animation: "slide-right", animationDuration: .7, animationDelay: .2 },
  "object:cover:event-name": { animation: "rise", animationDuration: .72, animationDelay: .14 },
  "object:cover:date": { animation: "fade", animationDuration: .6, animationDelay: .22 },
  "object:cover:mountains": { animation: "reveal-left", animationDuration: .78, animationDelay: .08 },
  "object:cover:vertical-word": { animation: "fade", animationDuration: .66, animationDelay: .22 },

  "heading:greeting": { animation: "slide-left", animationDuration: .66 },
  "object:greeting:room-art": { animation: "glide-right", animationDuration: .78, animationDelay: .06 },
  "object:greeting:red-rule": { animation: "reveal-left", animationDuration: .68, animationDelay: .08 },

  "heading:identity": { animation: "rise", animationDuration: .66 },
  "object:identity:sun-art": { animation: "soft-scale", animationDuration: .76, animationDelay: .05 },
  "object:identity:blossom-art": { animation: "glide-right", animationDuration: .78, animationDelay: .08 },

  "heading:event": { animation: "slide-left", animationDuration: .66 },
  "object:event:details-group": { animation: "rise", animationDuration: .72, animationDelay: .05 },
  "object:event:cup-art": { animation: "glide-right", animationDuration: .76, animationDelay: .09 },

  "heading:dateTime": { animation: "slide-right", animationDuration: .66 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .74, animationDelay: .05 },
  "object:dateTime:cloud-art": { animation: "fade", animationDuration: .76, animationDelay: .08 },

  "heading:gallery": { animation: "slide-left", animationDuration: .66 },
  "object:gallery:cloud-art": { animation: "reveal-left", animationDuration: .76, animationDelay: .04 },
  "object:gallery:enso-art": { animation: "soft-scale", animationDuration: .72, animationDelay: .08 },
  "object:gallery:quote": { animation: "rise", animationDuration: .68, animationDelay: .1 },

  "heading:countdown": { animation: "fade", animationDuration: .62 },
  "object:countdown:grid": { animation: "rise", animationDuration: .7, animationDelay: .05 },
  "object:countdown:enso-art": { animation: "soft-scale", animationDuration: .72, animationDelay: .08 },

  "heading:location": { animation: "slide-right", animationDuration: .66 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .74, animationDelay: .05 },
  "object:location:mountain-art": { animation: "reveal-left", animationDuration: .78, animationDelay: .08 },

  "heading:rsvp": { animation: "rise", animationDuration: .66 },
  "object:rsvp:bamboo-art": { animation: "glide-left", animationDuration: .78, animationDelay: .07 },

  "heading:wishes": { animation: "slide-left", animationDuration: .66 },
  "object:wishes:blossom-art": { animation: "glide-right", animationDuration: .76, animationDelay: .07 },

  "heading:gift": { animation: "rise", animationDuration: .66 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .74, animationDelay: .05 },
  "object:gift:cup-art": { animation: "glide-left", animationDuration: .76, animationDelay: .08 },

  "heading:closing": { animation: "rise", animationDuration: .68 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .72, animationDelay: .05 },
  "object:closing:sun-art": { animation: "soft-scale", animationDuration: .76, animationDelay: .06 },
  "object:closing:cloud-art": { animation: "reveal-left", animationDuration: .78, animationDelay: .08 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .7, animationDelay: .12 },
};

const sharedSectionNative: Record<string, TemplateNativeMotion> = {
  "heading:greeting": { animation: "rise", animationDuration: .64 },
  "object:greeting:copy-group": { animation: "rise", animationDuration: .7, animationDelay: .05 },

  "heading:identity": { animation: "rise", animationDuration: .64 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .76, animationDelay: .04 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .76, animationDelay: .09 },

  "heading:event": { animation: "slide-left", animationDuration: .64 },
  "object:event:details-group": { animation: "rise", animationDuration: .7, animationDelay: .05 },

  "heading:dateTime": { animation: "rise", animationDuration: .64 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .72, animationDelay: .05 },

  "heading:gallery": { animation: "slide-left", animationDuration: .64 },
  "object:gallery:grid": { animation: "rise", animationDuration: .7, animationDelay: .05 },

  "heading:countdown": { animation: "fade", animationDuration: .6 },
  "object:countdown:grid": { animation: "rise", animationDuration: .68, animationDelay: .05 },

  "heading:location": { animation: "slide-right", animationDuration: .64 },
  "object:location:details-group": { animation: "rise", animationDuration: .7, animationDelay: .05 },

  "heading:rsvp": { animation: "rise", animationDuration: .64 },
  "object:rsvp:form-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },

  "heading:wishes": { animation: "slide-left", animationDuration: .64 },
  "object:wishes:form-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },

  "heading:gift": { animation: "rise", animationDuration: .64 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .72, animationDelay: .05 },

  "heading:closing": { animation: "rise", animationDuration: .66 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .72, animationDelay: .05 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .7, animationDelay: .1 },
};

const romanticRoseNative: Record<string, TemplateNativeMotion> = {
  "object:envelope:ring-left": { animation: "soft-scale", animationDuration: .78 },
  "object:envelope:ring-right": { animation: "soft-scale", animationDuration: .78, animationDelay: .05 },
  "object:envelope:kicker": { animation: "fade", animationDuration: .6, animationDelay: .04 },
  "object:envelope:card-stack": { animation: "rise", animationDuration: .82, animationDelay: .07 },
  "object:envelope:seal": { animation: "soft-scale", animationDuration: .64, animationDelay: .12 },
  "object:envelope:invitation-copy": { animation: "rise", animationDuration: .7, animationDelay: .14 },

  "object:cover:background-photo": { animation: "fade", animationDuration: .78 },
  "object:cover:paper-wash": { animation: "reveal-up", animationDuration: .82, animationDelay: .03 },
  "object:cover:content-group": { animation: "rise", animationDuration: .78, animationDelay: .08 },
  "object:cover:kicker": { animation: "fade", animationDuration: .58, animationDelay: .1 },
  "object:cover:date": { animation: "slide-right", animationDuration: .66, animationDelay: .12 },
  "object:cover:accent-rule": { animation: "reveal-left", animationDuration: .68, animationDelay: .14 },

  "heading:greeting": { animation: "slide-left", animationDuration: .66 },
  "object:greeting:copy-group": { animation: "glide-right", animationDuration: .74, animationDelay: .06 },

  "heading:identity": { animation: "rise", animationDuration: .66 },
  "object:identity:couple-group": { animation: "rise", animationDuration: .72, animationDelay: .05 },
  "object:identity:personOne-group": { animation: "glide-left", animationDuration: .78, animationDelay: .07 },
  "object:identity:personTwo-group": { animation: "glide-right", animationDuration: .78, animationDelay: .12 },

  "heading:event": { animation: "slide-left", animationDuration: .66 },
  "object:event:details-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },

  "heading:dateTime": { animation: "slide-right", animationDuration: .66 },
  "object:dateTime:panel": { animation: "reveal-up", animationDuration: .74, animationDelay: .06 },

  "heading:gallery": { animation: "slide-left", animationDuration: .66 },
  "object:gallery:grid": { animation: "rise", animationDuration: .72, animationDelay: .05 },

  "heading:countdown": { animation: "fade", animationDuration: .6 },
  "object:countdown:grid": { animation: "rise", animationDuration: .7, animationDelay: .05 },

  "heading:location": { animation: "slide-right", animationDuration: .66 },
  "object:location:details-group": { animation: "glide-right", animationDuration: .74, animationDelay: .06 },

  "heading:rsvp": { animation: "rise", animationDuration: .66 },
  "object:rsvp:form-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },

  "heading:wishes": { animation: "slide-left", animationDuration: .66 },
  "object:wishes:form-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },

  "heading:gift": { animation: "rise", animationDuration: .66 },
  "object:gift:panel": { animation: "reveal-up", animationDuration: .74, animationDelay: .06 },

  "heading:closing": { animation: "rise", animationDuration: .66 },
  "object:closing:heart": { animation: "soft-scale", animationDuration: .64, animationDelay: .04 },
  "object:closing:copy-group": { animation: "rise", animationDuration: .72, animationDelay: .06 },
  "object:closing:names": { animation: "soft-scale", animationDuration: .7, animationDelay: .11 },
};

const confettiClubNative: Record<string, TemplateNativeMotion> = {
  "heading:envelope": { animation: "fade", animationDuration: .55 },
  "object:envelope:invitation-title": { animation: "rise", animationDuration: .55 },
  "object:envelope:gift-group": { animation: "fade", animationDuration: .6 },
  "object:envelope:address": { animation: "fade", animationDuration: .45 },
  "heading:cover": { animation: "rise", animationDuration: .6 },
  "object:cover:date-group": { animation: "fade", animationDuration: .5 },
  "object:cover:cake-art": { animation: "soft-scale", animationDuration: .65 },
  "object:identity:event-name": { animation: "rise", animationDuration: .55 },
  "object:gallery:grid": { animation: "fade", animationDuration: .55 },
  "object:closing:cake-art": { animation: "soft-scale", animationDuration: .55 },
};

const nativeDefaults: Record<string, Record<string, TemplateNativeMotion>> = {
  "cherry-picnic": { "heading:cover": { animation: "glide-left", animationDuration: .6 } },
  "velvet-wish": { "heading:cover": { animation: "fade", animationDuration: .65 } },
  "little-parade": { "heading:cover": { animation: "rise", animationDuration: .55 } },
  "disco-bloom": { "heading:cover": { animation: "glide-right", animationDuration: .6 } },
  "serambi-pagi": { "heading:cover": { animation: "rise", animationDuration: .6 } },
  "rumah-senja": { "heading:cover": { animation: "glide-left", animationDuration: .6 } },
  "langit-safari": { "heading:cover": { animation: "rise", animationDuration: .6 } },
  "purnama-biru": { "heading:cover": { animation: "rise", animationDuration: .6 } },
  "giok-abadi": { "heading:cover": { animation: "rise", animationDuration: .6 } },
  "peony-silk": { "heading:cover": { animation: "glide-right", animationDuration: .6 } },
  "imperial-crimson": { "heading:cover": { animation: "rise", animationDuration: .6 } },
  "porcelain-bloom": { "heading:cover": { animation: "glide-left", animationDuration: .6 } },
  "taman-doa": { "object:cover:garden-art": { animation: "rise", animationDuration: .6 } },
  "red-thread": { "object:cover:ceremonial-knot-art": { animation: "soft-scale", animationDuration: .6 } },
  "little-cloud": { "heading:cover": { animation: "fade", animationDuration: .55 }, "object:cover:moon-mobile-art": { animation: "rise", animationDuration: .6 } },
  gathering: { "heading:cover": { animation: "rise", animationDuration: .55 }, "object:cover:rosette-art": { animation: "soft-scale", animationDuration: .6 } },
  "silver-reverie": { "heading:cover": { animation: "rise", animationDuration: .6 }, "object:cover:silver-loops-art": { animation: "fade", animationDuration: .6 } },
  "golden-keepsake": { "heading:cover": { animation: "fade", animationDuration: .6 }, "object:cover:golden-fan-art": { animation: "reveal-up", animationDuration: .6 } },
  "confetti-club": confettiClubNative,
  "romantic-rose": romanticRoseNative,
  serein: sereinNative,
  "botanical-ivory": botanicalNative,
  "eternal-blossom": blossomNative,
  "modern-maroon": modernMaroonNative,
  "garden-light": gardenLightNative,
  "midnight-romance": midnightRomanceNative,
  "classic-pearl": classicPearlNative,
  "golden-art-deco": goldenArtDecoNative,
  "celestial-ink": celestialInkNative,
  "paper-cut-botanical": paperCutBotanicalNative,
  "pencil-reverie": pencilReverieNative,
  "zen-atelier": zenAtelierNative,
  "velvet-horizon": velvetHorizonNative,
};

export function templateHasDefaultMotion(template: string) {
  return Object.hasOwn(nativeDefaults, template);
}

export function templateNativeMotion(template: string) {
  const themed = nativeDefaults[template];
  return themed ? { ...sharedSectionNative, ...themed } : {};
}

export function templatePhotoMotion(template: string, overrides: PhotoMotionMap = {}, styles: InvitationSectionStyles = {}): PhotoMotionMap {
  const defaults = photoDefaults[template];
  if (!defaults) return overrides;
  const result: PhotoMotionMap = {};
  for (const slot of Object.keys(defaults) as PhotoSlot[]) {
    const section = slot === "cover" ? "cover" : slot === "gallery" ? "gallery" : "identity";
    const authoredSection = styles[section]?.animation !== undefined || Boolean(styles[section]?.timeline);
    const base = authoredSection ? {} : defaults[slot];
    result[slot] = { ...base, ...overrides[slot] };
  }
  return result;
}

export function templateNativeMotionForKey(template: string, key: string, styles: InvitationSectionStyles = {}) {
  // Instance suffixes keep the same default but retain independent persisted overrides.
  const parts = key.split(":");
  const sectionMotion = styles[parts[1] as keyof InvitationSectionStyles];
  if (sectionMotion?.animation !== undefined || sectionMotion?.timeline) return undefined;
  const base = parts[0] === "object" ? parts.slice(0, 3).join(":") : parts.slice(0, 2).join(":");
  return templateNativeMotion(template)[base];
}
