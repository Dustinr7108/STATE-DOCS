import { NV } from "./nv.js";
import { TEMPLATE_STATE } from "./template.js";
import { genericMotorState } from "./generic.js";
import { US_STATES } from "./us.js";

const generated = US_STATES.filter((place) => place.code !== "NV").map((place) => [
  place.code,
  genericMotorState(place),
]);

export const DMV_REGISTRY = new Map([
  [NV.state, NV],
  ...generated,
  [TEMPLATE_STATE.state, TEMPLATE_STATE],
]);
