import menuSourceJson from "./menu-source.json";
import type { MenuSource } from "./menu-source.types";
import { normalizeMenuSource } from "./menu-normalizer";

const menuSource: MenuSource = menuSourceJson;

export const menuCatalog = normalizeMenuSource(menuSource);
