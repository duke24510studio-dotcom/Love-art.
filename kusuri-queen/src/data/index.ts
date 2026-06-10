import type { Drug } from "../types";
import { oralDrugs } from "./drugs-oral";
import { injectionDrugs, topicalDrugs, eyeDrugs } from "./drugs-injection";

export const drugs: Drug[] = [
  ...oralDrugs,
  ...injectionDrugs,
  ...topicalDrugs,
  ...eyeDrugs,
];

export const drugById = new Map(drugs.map((d) => [d.id, d]));
