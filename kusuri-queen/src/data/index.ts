import type { Drug } from "../types";
import { oralDrugs } from "./drugs-oral";
import { oralExtraDrugs } from "./drugs-oral-extra";
import { otcDrugs } from "./drugs-otc";
import { injectionDrugs, topicalDrugs, eyeDrugs } from "./drugs-injection";

export const drugs: Drug[] = [
  ...oralDrugs,
  ...oralExtraDrugs,
  ...otcDrugs,
  ...injectionDrugs,
  ...topicalDrugs,
  ...eyeDrugs,
];

export const drugById = new Map(drugs.map((d) => [d.id, d]));
