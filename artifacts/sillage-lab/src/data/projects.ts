/**
 * Representative fragrance project workspace data.
 * Labeled clearly as demo workspace content because the backend has no
 * Project entity yet. Structure mirrors what a real API would return.
 */

export type ProjectStatus = "active" | "resting" | "archived" | "complete";

export interface ProjectNote {
  id: string;
  body: string;
  createdAt: string;
  tag?: string;
}

export interface ProjectEvaluation {
  id: string;
  modLabel: string;
  opening: string;
  fifteenMin: string;
  oneHour?: string;
  fourHour?: string;
  drydown?: string;
  overall: string;
  whatWorks: string;
  adjustments: string;
  date: string;
}

export type InspirationItemType = "image" | "quote" | "material" | "note" | "text";

export interface InspirationItem {
  id: string;
  type: InspirationItemType;
  src?: string;
  caption?: string;
  body?: string;
  materialName?: string;
  materialSubtitle?: string;
  tag?: string;
  /** Controls visual weight in masonry: "full" = full-width, "wide" = 2-col span, "normal" = 1 col */
  span?: "full" | "wide" | "normal";
  /** Intrinsic aspect ratio hint for masonry height calculation */
  aspect?: "portrait" | "landscape" | "square" | "panoramic" | "tall";
}

export interface DemoProject {
  id: string;
  name: string;
  status: ProjectStatus;
  description: string;
  olfactiveDirection: string;
  createdAt: string;
  updatedAt: string;
  coverImage: string;
  notes: ProjectNote[];
  evaluations: ProjectEvaluation[];
  inspiration: InspirationItem[];
  linkedFormulaIds: number[];
  linkedMaterialNames: string[];
  modCount: number;
}

const BASE = import.meta.env.BASE_URL + "images/";

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "proj-01",
    name: "Sel Gris",
    status: "active",
    description:
      "A mineral, slightly briny skin scent. Opens with the cold clarity of sea air, settles into warm skin musk with a trace of driftwood.",
    olfactiveDirection: "Marine mineral · warm skin · driftwood base",
    createdAt: "2024-11-04",
    updatedAt: "2025-01-14",
    coverImage: BASE + "hero-droplets.jpg",
    modCount: 4,
    linkedMaterialNames: [
      "Ambroxan", "Calone 1951", "Iso E Super", "Hawthorn Absolute", "Ambergris Tincture",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-01",
        body: "MOD 04 is the closest so far. The calone is at 0.08% — any higher and it reads 'swimming pool'. Keep it geological, not aquatic.",
        createdAt: "2025-01-14",
        tag: "evaluation",
      },
      {
        id: "n-02",
        body: "Consider swapping the hawthorn absolute for flouve — wants something more hay-like, less floral in the transition.",
        createdAt: "2025-01-08",
        tag: "material direction",
      },
      {
        id: "n-03",
        body: "Brief: The smell of a tide pool at low water. Salt and sun. Something alive underneath the stillness.",
        createdAt: "2024-11-04",
        tag: "brief",
      },
    ],
    evaluations: [
      {
        id: "e-01",
        modLabel: "MOD 04",
        opening: "Clean, cold minerality. The calone is right — imperceptible but present.",
        fifteenMin: "Salt note settles. Ambroxan begins to warm the skin accord.",
        oneHour: "Lovely drydown. Very smooth, almost quiet.",
        drydown: "Warm musk with a trace of wood. The driftwood accord is subtle.",
        overall: "Best iteration yet. The balance is close.",
        whatWorks: "Calone level, ambroxan proportion, skin feel",
        adjustments: "Reduce hawthorn slightly; the floral pulls it away from mineral.",
        date: "2025-01-14",
      },
      {
        id: "e-02",
        modLabel: "MOD 03",
        opening: "Too aquatic — the calone is overwhelming the mineral quality.",
        fifteenMin: "Flattens quickly.",
        overall: "Not working. Reduce calone by half.",
        whatWorks: "Base accord is strong",
        adjustments: "Calone -50%. Increase ambroxan.",
        date: "2024-12-28",
      },
    ],
    inspiration: [
      {
        id: "i-01",
        type: "image",
        src: BASE + "hero-droplets.jpg",
        caption: "Tide pool, Bretagne — the image the entire project started from",
      },
      {
        id: "i-02",
        type: "quote",
        body: "The sea has never been friendly to man. At most it has been the accomplice of human restlessness.",
        caption: "Joseph Conrad",
      },
      {
        id: "i-03",
        type: "material",
        materialName: "Ambroxan",
        body: "The skin-scent material. Warm, slightly woody, mineral. Used at 1.5% to give the base its lived-in quality.",
      },
      {
        id: "i-04",
        type: "image",
        src: BASE + "texture.jpg",
        caption: "Salt crystal texture reference — surface structure",
      },
      {
        id: "i-05",
        type: "note",
        body: "Structural observation: the marine facet needs to be geological, not biological. Salt rock not seaweed.",
        tag: "direction",
      },
      {
        id: "i-06",
        type: "material",
        materialName: "Calone 1951",
        body: "Oceanic, melon-like, transparent. Extremely powerful — the dose is the message.",
      },
    ],
  },
  {
    id: "proj-02",
    name: "Résine Noire",
    status: "resting",
    description:
      "A dark resinous accord built around labdanum and benzoin, with an oud facet that reads more furniture than barbershop. The brief: a bookshop in a monastery.",
    olfactiveDirection: "Resinous · warm amber · incense · dry wood",
    createdAt: "2024-09-12",
    updatedAt: "2024-12-03",
    coverImage: BASE + "resin.jpg",
    modCount: 7,
    linkedMaterialNames: [
      "Labdanum Absolute", "Benzoin Resinoid", "Frankincense EO", "Oud CO₂", "Cedarwood Atlas",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-04",
        body: "Resting for 6 weeks before re-evaluation. MOD 07 has the richest drydown of the series — needs time to let the oud accord settle.",
        createdAt: "2024-12-03",
        tag: "resting note",
      },
      {
        id: "n-05",
        body: "The problem with every mod so far: the frankincense is competing with the benzoin for the same olfactive space. Consider dropping frankincense and using a smoke molecule instead.",
        createdAt: "2024-11-20",
        tag: "direction",
      },
    ],
    evaluations: [
      {
        id: "e-03",
        modLabel: "MOD 07",
        opening: "Labdanum right up front — warm, animalic, complex.",
        fifteenMin: "The oud accord comes forward. A little sharp still.",
        fourHour: "Settled beautifully. Cedar in the base is exactly right.",
        drydown: "Deep amber-wood. The benzoin sweetness balances the oud.",
        overall: "Most successful mod. Needs time to evaluate thoroughly.",
        whatWorks: "Labdanum/benzoin ratio, cedar base",
        adjustments: "Consider reducing frankincense in MOD 08.",
        date: "2024-12-03",
      },
    ],
    inspiration: [
      {
        id: "i-07",
        type: "image",
        src: BASE + "resin.jpg",
        caption: "Labdanum resin — the project's anchor material",
      },
      {
        id: "i-08",
        type: "quote",
        body: "Incense is the ghost of wood. It carries the memory of the tree but none of its weight.",
        caption: "Studio notes, September 2024",
      },
      {
        id: "i-09",
        type: "material",
        materialName: "Labdanum Absolute",
        body: "Warm, leathery, animalic. The backbone of the chypre family. At 4% it anchors the entire structure.",
      },
      {
        id: "i-10",
        type: "image",
        src: BASE + "botanicals.jpg",
        caption: "Dried botanical reference — texture and warmth",
      },
    ],
  },
  {
    id: "proj-03",
    name: "Lait Vert",
    status: "active",
    description:
      "A green floral built around violet leaf absolute and galbanum, with a milky-skin base from hedione and cashmeran. Clean and quiet.",
    olfactiveDirection: "Green · violet leaf · milky skin · transparent",
    createdAt: "2025-01-02",
    updatedAt: "2025-01-18",
    coverImage: BASE + "flower.jpg",
    modCount: 2,
    linkedMaterialNames: [
      "Violet Leaf Absolute", "Galbanum EO", "Hedione HC", "Cashmeran", "Lily of the Valley Base",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-06",
        body: "Early stage. The violet leaf needs to be clearly plant-forward, not sweet. Use it at sub-1% to get the metallic green without the iris impression.",
        createdAt: "2025-01-18",
        tag: "direction",
      },
    ],
    evaluations: [],
    inspiration: [
      {
        id: "i-11",
        type: "image",
        src: BASE + "leaves.jpg",
        caption: "Wet violet leaves — saturated green, cold, metallic surface",
        aspect: "landscape",
      },
      {
        id: "i-11b",
        type: "text",
        body: "Not botanical. Architectural green.",
        span: "normal",
        tag: "direction",
      },
      {
        id: "i-11c",
        type: "image",
        src: BASE + "flower.jpg",
        caption: "Diffused daylight on pale fabric — translucency as texture",
        aspect: "portrait",
      },
      {
        id: "i-11d",
        type: "text",
        body: "The smell of a greenhouse after everyone has left.",
        span: "wide",
        tag: "brief fragment",
      },
      {
        id: "i-11e",
        type: "image",
        src: BASE + "texture.jpg",
        caption: "Milky resin surface — organic, semi-opaque",
        aspect: "square",
      },
      {
        id: "i-11f",
        type: "image",
        src: BASE + "mood-clean.jpg",
        caption: "Pale grey fabric, close-woven — restrained, tactile",
        aspect: "portrait",
      },
      {
        id: "i-11g",
        type: "image",
        src: BASE + "botanicals.jpg",
        caption: "Brutalist concrete surface — mineral, structural, cold",
        aspect: "landscape",
      },
      {
        id: "i-11h",
        type: "text",
        body: "Cold light through translucent leaves.",
        span: "normal",
        tag: "atmosphere",
      },
      {
        id: "i-11i",
        type: "image",
        src: BASE + "studio-practice.jpg",
        caption: "Restrained fashion — pale tones, structural line",
        aspect: "portrait",
      },
      {
        id: "i-11j",
        type: "image",
        src: BASE + "petals.jpg",
        caption: "Close-up organic texture — pale, powdery, fragile",
        aspect: "square",
      },
      {
        id: "i-11k",
        type: "image",
        src: BASE + "mood-fresh.jpg",
        caption: "Translucent pale-green glass — the core chromatic reference",
        aspect: "landscape",
        span: "wide",
      },
      {
        id: "i-12",
        type: "material",
        materialName: "Violet Leaf Absolute",
        materialSubtitle: "Green · wet leaf · metallic",
        body: "Metallic, green, ozonic. Very powerful — 0.3% gives the impression. The distinctive quality is its coldness: it reads as plant-forward, not sweet.",
        span: "normal",
      },
    ],
  },
  {
    id: "proj-04",
    name: "Poudre Dorée",
    status: "archived",
    description:
      "An iris-forward powder accord with a modern feel. Archived after MOD 05 — the project found its natural conclusion.",
    olfactiveDirection: "Iris · powder · violet · white musk",
    createdAt: "2024-06-15",
    updatedAt: "2024-10-18",
    coverImage: BASE + "petals.jpg",
    modCount: 5,
    linkedMaterialNames: [
      "Irone Alpha", "Orris Concrete", "Ethylene Brassylate", "Musks Blend",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-07",
        body: "Archived. MOD 05 is the definitive version. The iris-powder balance is right. This one is done.",
        createdAt: "2024-10-18",
        tag: "archive note",
      },
    ],
    evaluations: [
      {
        id: "e-04",
        modLabel: "MOD 05",
        opening: "Pure iris. Very clean, slightly cold.",
        fifteenMin: "Powder accord develops beautifully.",
        oneHour: "Musk foundation. The orris concrete note in the dry-down is exceptional.",
        drydown: "Soft white powder. Very elegant.",
        overall: "This is finished. No further modifications needed.",
        whatWorks: "Everything in proportion",
        adjustments: "None — archive this version.",
        date: "2024-10-18",
      },
    ],
    inspiration: [
      {
        id: "i-14",
        type: "image",
        src: BASE + "petals.jpg",
        caption: "Rose petals — the powder reference",
      },
    ],
  },
];
