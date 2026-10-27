// ======================================
// PRUEBAS NODE
// ======================================

import test from "node:test";
import { cases } from "./cases.js";

for (const item of cases) {
  test(item.name, item.run);
}
