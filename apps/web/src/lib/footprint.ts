export type FootprintProperty = "water" | "energy" | "carbon" | "token";

export const FOOTPRINT_TEXT_CLASS_BY_PROPERTY: Record<FootprintProperty, string> = {
  water: "text-footprint-water",
  energy: "text-footprint-energy",
  carbon: "text-footprint-carbon",
  token: "text-footprint-token"
};
