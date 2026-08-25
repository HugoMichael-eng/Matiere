export const MATERIAL_FAMILIES = [
  "citrus",
  "floral",
  "woody",
  "resinous",
  "fresh",
  "musk",
  "spicy",
  "green",
] as const;

export type MaterialFamily = (typeof MATERIAL_FAMILIES)[number];

const FAMILY_ALIASES: Record<MaterialFamily, readonly string[]> = {
  citrus: ["citrus", "citruses", "citrusy"],
  floral: ["floral", "florals", "flower", "flowers", "flowery"],
  woody: ["woody", "wood", "woods", "woodsy", "earthy"],
  resinous: [
    "resinous",
    "resin",
    "resins",
    "resinic",
    "amber",
    "ambers",
    "ambery",
    "balsam",
    "balsams",
    "balsamic",
  ],
  fresh: ["fresh", "freshness", "freshy"],
  musk: ["musk", "musks", "musky", "animalic", "animalics"],
  spicy: ["spicy", "spice", "spices", "peppery"],
  green: [
    "green",
    "greens",
    "greenery",
    "herbal",
    "herb",
    "herbs",
    "herbaceous",
    "aromatic",
    "aromatics",
  ],
};

const ALIAS_TO_FAMILY = new Map<string, MaterialFamily>(
  Object.entries(FAMILY_ALIASES).flatMap(([family, aliases]) =>
    aliases.map(alias => [alias, family as MaterialFamily]),
  ),
);

const FAMILY_PART_SEPARATOR = /[/,&+|;]+/;

function cleanFamilyPart(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s+/g, " ");
}

function familyForPart(value: string): MaterialFamily | undefined {
  const cleaned = cleanFamilyPart(value);
  return ALIAS_TO_FAMILY.get(cleaned) ??
    cleaned.split(" ").map(token => ALIAS_TO_FAMILY.get(token)).find(Boolean);
}

/**
 * Return every recognized family represented by a material's family field.
 * Composite values such as "Resinous / Animalic" intentionally return both
 * matching families so they can satisfy more than one accord.
 */
export function normalizeMaterialFamilies(value: string | null | undefined): MaterialFamily[] {
  if (!value?.trim()) return [];
  return [...new Set(
    value
      .split(FAMILY_PART_SEPARATOR)
      .map(familyForPart)
      .filter((family): family is MaterialFamily => family !== undefined),
  )];
}

/**
 * Canonicalize a family value when every part is understood. Mixed values
 * with unknown descriptors are left alone so the API never erases useful
 * material metadata.
 */
export function canonicalizeMaterialFamily(value: string): string {
  const parts = value.split(FAMILY_PART_SEPARATOR).map(part => part.trim()).filter(Boolean);
  const families = normalizeMaterialFamilies(value);
  if (parts.length > 0 && families.length === parts.length) return families.join(" / ");
  return value.trim();
}