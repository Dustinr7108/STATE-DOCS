import { NV } from "./nv.js";
import { TEMPLATE_STATE } from "./template.js";

export const DMV_REGISTRY = new Map([
  [NV.state, NV],
  [TEMPLATE_STATE.state, TEMPLATE_STATE],
]);
