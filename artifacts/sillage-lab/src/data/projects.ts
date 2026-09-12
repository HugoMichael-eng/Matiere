/**
 * Representative fragrance project workspace data.
 * Labeled clearly as demo workspace content because the backend has no
 * Project entity yet. Structure mirrors what a real API would return.
 *
 * DEMO FORMULA LIBRARY: Representative entries labeled [DEMO] — never
 * merged into real API mutation state.
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

export type InspirationItemType = "image" | "quote" | "material" | "note" | "text" | "direction" | "interpretation";

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
  /** Visual descriptor tags for interpretation */
  descriptors?: string[];
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
  heroImage?: string;
  /** Short creative statement — shown large in overview */
  creativeStatement?: string;
  /** Next creative question driving development */
  nextQuestion?: string;
  notes: ProjectNote[];
  evaluations: ProjectEvaluation[];
  inspiration: InspirationItem[];
  linkedFormulaIds: number[];
  linkedMaterialNames: string[];
  modCount: number;
}

const BASE = import.meta.env.BASE_URL + "images/";

// ─── Representative formula library (DEMO — read-only, never persisted) ───────

export interface DemoFormula {
  id: string;
  project: string;
  mod: string;
  direction: string;
  materials: string[];
  lastEvaluation: string;
  status: "active" | "resting" | "archived";
  notes: string;
}

export const DEMO_FORMULAS: DemoFormula[] = [
  {
    id: "df-01",
    project: "Lait Vert",
    mod: "MOD 01",
    direction: "Green · violet leaf · initial structure",
    materials: ["Violet Leaf Absolute", "Galbanum EO", "Hedione HC"],
    lastEvaluation: "The green is reading botanical instead of structural. Too much galbanum.",
    status: "archived",
    notes: "Baseline. Too literal. Adjust galbanum down 40%.",
  },
  {
    id: "df-02",
    project: "Lait Vert",
    mod: "MOD 02",
    direction: "Green · transparent · milky skin approach",
    materials: ["Violet Leaf Absolute", "Galbanum EO", "Hedione HC", "Cashmeran", "Lily of the Valley Base"],
    lastEvaluation: "The atmosphere is right. MOD 02 connects cold vegetal light to a soft skin base without becoming conventionally floral.",
    status: "active",
    notes: "Reduce Cashmeran slightly and test a trace of Ambrettolide to soften the four-hour edge.",
  },
  {
    id: "df-03",
    project: "Lait Vert",
    mod: "MOD 03",
    direction: "Green · architectural · mineral diffusion",
    materials: ["Violet Leaf Absolute", "Stemone", "Hedione HC", "Habanolide", "Cashmeran"],
    lastEvaluation: "Cold without smelling marine. The Stemone adds distance. Correct direction.",
    status: "active",
    notes: "Could the mineral feeling come from transparency rather than another material?",
  },
  {
    id: "df-04",
    project: "Sel Gris",
    mod: "MOD 03",
    direction: "Marine mineral · geological · warm skin",
    materials: ["Ambroxan", "Calone 1951", "Iso E Super", "Hawthorn Absolute"],
    lastEvaluation: "Too aquatic — the calone is overwhelming the mineral quality.",
    status: "archived",
    notes: "Calone -50%. The base accord is strong, keep it.",
  },
  {
    id: "df-05",
    project: "Sel Gris",
    mod: "MOD 04",
    direction: "Cold mineral · skin musk · driftwood base",
    materials: ["Ambroxan", "Calone 1951", "Iso E Super", "Hawthorn Absolute", "Ambergris Tincture"],
    lastEvaluation: "Best iteration yet. The balance is close. Calone level correct.",
    status: "active",
    notes: "Reduce hawthorn slightly; the floral pulls it away from mineral.",
  },
  {
    id: "df-06",
    project: "Animal in the Mirror",
    mod: "MOD 05",
    direction: "Powdery skin · iris · white floral · animalic depth",
    materials: ["Irone Alpha", "Musks Blend", "Ethylene Brassylate", "Hedione", "Orris Concrete"],
    lastEvaluation: "Too beautiful. Needs friction. The skin effect needs an edge.",
    status: "resting",
    notes: "Keep the skin effect but remove cosmetic softness. Add animalic trace.",
  },
  {
    id: "df-07",
    project: "Animal in the Mirror",
    mod: "MOD 06",
    direction: "Intimate · lacquer skin · powdery tension",
    materials: ["Irone Alpha", "Musks Blend", "Ethylene Brassylate", "Civet Synthetic", "Orris Concrete"],
    lastEvaluation: "Drydown needs less warmth, more distance. The animalic trace is correct in direction.",
    status: "active",
    notes: "The line between beautiful and uncanny is where this needs to live.",
  },
  {
    id: "df-08",
    project: "Résine Noire",
    mod: "MOD 07",
    direction: "Resinous amber · ecclesiastical · warm dark wood",
    materials: ["Labdanum Absolute", "Benzoin Resinoid", "Frankincense EO", "Oud CO₂", "Cedarwood Atlas"],
    lastEvaluation: "Most successful mod. Needs time to evaluate thoroughly.",
    status: "resting",
    notes: "Consider reducing frankincense in MOD 08. The benzoin/cedar ratio is right.",
  },
];

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
    coverImage: BASE + "sel-gris-01.jpg",
    heroImage: BASE + "sel-gris-01.jpg",
    creativeStatement: "Cold without smelling marine.",
    nextQuestion: "How do we keep the mineral quality without the calone becoming dominant?",
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
        src: BASE + "sel-gris-01.jpg",
        caption: "Salt crystallization — mineral grey, geological not marine",
        aspect: "landscape",
      },
      {
        id: "i-01b",
        type: "text",
        body: "Cold without smelling marine.",
        tag: "direction",
        span: "normal",
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
        materialSubtitle: "Warm · mineral · skin",
        body: "The skin-scent material. Warm, slightly woody, mineral. Used at 1.5% to give the base its lived-in quality.",
        descriptors: ["warm", "mineral", "skin"],
      },
      {
        id: "i-04",
        type: "image",
        src: BASE + "texture.jpg",
        caption: "Eroded surface — geological texture reference",
        aspect: "square",
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
        materialSubtitle: "Oceanic · melon · transparent",
        body: "Oceanic, melon-like, transparent. Extremely powerful — the dose is the message.",
        descriptors: ["cold", "transparent", "oceanic"],
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
    coverImage: BASE + "resine-noire-01.jpg",
    heroImage: BASE + "resine-noire-01.jpg",
    creativeStatement: "Incense is the ghost of wood.",
    nextQuestion: "Can we replace the frankincense with a smoke molecule and keep the ceremony without the resin?",
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
        src: BASE + "resine-noire-01.jpg",
        caption: "Dark resin surface — the project's chromatic world",
        aspect: "landscape",
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
        materialSubtitle: "Warm · leathery · animalic",
        body: "Warm, leathery, animalic. The backbone of the chypre family. At 4% it anchors the entire structure.",
        descriptors: ["warm", "leathery", "dark"],
      },
      {
        id: "i-10",
        type: "image",
        src: BASE + "amber.jpg",
        caption: "Amber material — aged light through resin",
        aspect: "landscape",
      },
      {
        id: "i-10b",
        type: "text",
        body: "A bookshop in a monastery.",
        tag: "brief",
        span: "normal",
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
    coverImage: BASE + "lait-vert-01.jpg",
    heroImage: BASE + "lait-vert-02.jpg",
    creativeStatement: "Not botanical. Architectural green.",
    nextQuestion: "How do we keep the green wet without making it botanical?",
    modCount: 3,
    linkedMaterialNames: [
      "Violet Leaf Absolute", "Galbanum EO", "Hedione HC", "Cashmeran", "Stemone", "Habanolide",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-06",
        body: "Early stage. The violet leaf needs to be clearly plant-forward, not sweet. Use it at sub-1% to get the metallic green without the iris impression.",
        createdAt: "2025-01-18",
        tag: "direction",
      },
      {
        id: "n-06b",
        body: "The green is reading botanical instead of structural. Explore Stemone as a more architectural green material — cold, precise, less vegetal.",
        createdAt: "2025-01-12",
        tag: "material direction",
      },
    ],
    evaluations: [
      {
        id: "e-05",
        modLabel: "MOD 02",
        opening: "Cold crushed leaf with a clear metallic edge. The galbanum is present without turning sharp.",
        fifteenMin: "The green structure begins to soften. Hedione opens space around the violet leaf rather than sweetening it.",
        oneHour: "Milky skin appears under the vegetal accord. The transition is quiet and continuous.",
        fourHour: "Cashmeran becomes slightly too dry at the edge, but the transparent floral body remains intact.",
        drydown: "Pale woods and clean skin musk. The green impression survives as a cool shadow.",
        overall: "The atmosphere is right. MOD 02 connects cold vegetal light to a soft skin base without becoming conventionally floral.",
        whatWorks: "Violet leaf restraint, transparent diffusion, milky skin transition",
        adjustments: "Reduce Cashmeran slightly and test a trace of Ambrettolide to soften the four-hour edge.",
        date: "2025-01-18",
      },
    ],
    inspiration: [
      {
        id: "i-11",
        type: "image",
        src: BASE + "lait-vert-01.jpg",
        caption: "Crushed botanical matter — cold, translucent, mineral",
        aspect: "landscape",
        descriptors: ["cold", "green", "translucent"],
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
        src: BASE + "lait-vert-02.jpg",
        caption: "Glass condensation — translucency as texture",
        aspect: "landscape",
        descriptors: ["transparent", "cold", "synthetic"],
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
        caption: "Mineral surface — organic, semi-opaque",
        aspect: "square",
        descriptors: ["mineral", "opaque", "textured"],
      },
      {
        id: "i-11f",
        type: "image",
        src: BASE + "mood-clean.jpg",
        caption: "Pale tones — restrained, tactile",
        aspect: "portrait",
        descriptors: ["soft", "pale", "quiet"],
      },
      {
        id: "i-11h",
        type: "text",
        body: "Cold light through translucent leaves.",
        span: "normal",
        tag: "atmosphere",
      },
      {
        id: "i-12",
        type: "material",
        materialName: "Violet Leaf Absolute",
        materialSubtitle: "Green · wet leaf · metallic",
        body: "Metallic, green, ozonic. Very powerful — 0.3% gives the impression. The distinctive quality is its coldness: it reads as plant-forward, not sweet.",
        span: "normal",
        descriptors: ["metallic", "cold", "green"],
      },
      {
        id: "i-12b",
        type: "material",
        materialName: "Stemone",
        materialSubtitle: "Structural green · cold · precise",
        body: "More architectural than violet leaf. Less metallic, more structural. The smell of an empty greenhouse.",
        span: "normal",
        descriptors: ["structural", "cold", "precise"],
      },
    ],
  },
  {
    id: "proj-04",
    name: "Animal in the Mirror",
    status: "active",
    description:
      "A powdery, intimate skin scent with an iris core and a subtle animalic depth. The brief: your own skin, unrecognised.",
    olfactiveDirection: "Iris · powder · intimate skin · animalic trace",
    createdAt: "2024-06-15",
    updatedAt: "2024-12-18",
    coverImage: BASE + "animal-mirror-01.jpg",
    heroImage: BASE + "animal-mirror-01.jpg",
    creativeStatement: "Too beautiful. Needs friction.",
    nextQuestion: "Where is the line between beautiful and uncanny, and how do we live on it?",
    modCount: 6,
    linkedMaterialNames: [
      "Irone Alpha", "Orris Concrete", "Ethylene Brassylate", "Musks Blend", "Civet Synthetic",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-07",
        body: "The iris accord is too clean. The brief calls for something slightly uncanny — beautiful but with an animal edge that makes you look twice.",
        createdAt: "2024-12-18",
        tag: "direction",
      },
      {
        id: "n-07b",
        body: "Keep the skin effect but remove cosmetic softness. The difference is important: skin feels human, cosmetic softness feels manufactured.",
        createdAt: "2024-11-30",
        tag: "evaluation",
      },
    ],
    evaluations: [
      {
        id: "e-06",
        modLabel: "MOD 06",
        opening: "The iris opens cleanly. Skin appears immediately.",
        fifteenMin: "Powder accord develops. The musk foundation is correct.",
        fourHour: "Drydown needs less warmth, more distance.",
        drydown: "Animalic trace in the base. Correct direction, needs calibration.",
        overall: "The line between beautiful and uncanny is where this needs to live. MOD 06 is close.",
        whatWorks: "Iris clarity, powder accord, skin transition",
        adjustments: "Reduce warmth in drydown. The animalic trace is right in direction.",
        date: "2024-12-18",
      },
      {
        id: "e-07",
        modLabel: "MOD 05",
        opening: "Pure iris. Very clean, slightly cold.",
        fifteenMin: "Powder accord develops beautifully.",
        overall: "Too beautiful. Needs friction.",
        whatWorks: "Iris accord, powder quality",
        adjustments: "Add animalic trace. Find the edge.",
        date: "2024-11-30",
      },
    ],
    inspiration: [
      {
        id: "i-14",
        type: "image",
        src: BASE + "animal-mirror-01.jpg",
        caption: "Lacquer reflection — controlled, intimate, slightly uncanny",
        aspect: "landscape",
        descriptors: ["intimate", "uncanny", "reflective"],
      },
      {
        id: "i-14b",
        type: "text",
        body: "Your own skin, unrecognised.",
        tag: "brief",
        span: "normal",
      },
      {
        id: "i-14c",
        type: "image",
        src: BASE + "petals.jpg",
        caption: "White powder texture — fragile, cosmetic, human",
        aspect: "square",
        descriptors: ["soft", "powder", "intimate"],
      },
      {
        id: "i-14d",
        type: "material",
        materialName: "Irone Alpha",
        materialSubtitle: "Iris · cold · violet · slightly woody",
        body: "The most complex and costly iris material. Cold violet quality with a slightly woody facet. At low doses it reads as skin rather than flower.",
        descriptors: ["iris", "cold", "intimate"],
      },
    ],
  },
  {
    id: "proj-05",
    name: "Poudre Dorée",
    status: "archived",
    description:
      "An iris-forward powder accord with a modern feel. Archived after MOD 05 — the project found its natural conclusion.",
    olfactiveDirection: "Iris · powder · violet · white musk",
    createdAt: "2024-03-15",
    updatedAt: "2024-10-18",
    coverImage: BASE + "petals.jpg",
    creativeStatement: "This one is done.",
    nextQuestion: null as unknown as string,
    modCount: 5,
    linkedMaterialNames: [
      "Irone Alpha", "Orris Concrete", "Ethylene Brassylate", "Musks Blend",
    ],
    linkedFormulaIds: [],
    notes: [
      {
        id: "n-08",
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
        id: "i-16",
        type: "image",
        src: BASE + "petals.jpg",
        caption: "Rose petals — the powder reference",
        aspect: "square",
      },
    ],
  },
];
