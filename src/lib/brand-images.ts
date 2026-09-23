/**
 * Editorial imagery used across public pages and auth.
 * Swap `src` for final brand photography — every image is referenced by key.
 * Current placeholders: Unsplash (free licence).
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const BRAND_IMAGES = {
  heroCutting: {
    src: u("1584184924103-e310d9dc82fc"),
    alt: "A tailor's hands cutting a length of brown tweed on a wooden workbench",
  },
  shearsOnWool: {
    src: u("1718184021018-d2158af6b321"),
    alt: "Tailor's shears and a measuring tape resting on dark wool cloth",
  },
  satinAndTape: {
    src: u("1536867520774-5b4f2628a69b"),
    alt: "Champagne satin with a measuring tape and brass scissors",
  },
  swatches: {
    src: u("1619384846683-8dede3452564"),
    alt: "A hand choosing between fabric swatches and horn buttons",
  },
  swatchBook: {
    src: u("1633655442330-0b44ca0cce9b"),
    alt: "A swatch book of grey and navy suiting fabrics",
  },
  suitDetail: {
    src: u("1603394151492-5e9b974b090b"),
    alt: "Close-up of a man fastening the cuff of a navy tailored jacket",
  },
  eveningDress: {
    src: u("1623580674393-edf6eb7090f8"),
    alt: "A woman in a long black evening dress against a pale wall",
  },
  traditional: {
    src: u("1724412665971-114bd351a42d"),
    alt: "A black abaya with embroidered trim, photographed against warm stone",
  },
  handStitch: {
    src: u("1568288796918-03e7d93306bd"),
    alt: "Close-up of hands hand-stitching white cotton",
  },
  studio: {
    src: u("1633655442164-da26330e85b4"),
    alt: "A tailor in his studio beside a rail of finished jackets",
  },
  patternMaking: {
    src: u("1586216583645-bf798306a3d7"),
    alt: "Hands working with a paper pattern on a wooden cutting table",
  },
  sketches: {
    src: u("1502217625004-89c03571bcca"),
    alt: "Fashion sketches of dresses pinned beside fabric",
  },
} as const;

export type BrandImageKey = keyof typeof BRAND_IMAGES;
