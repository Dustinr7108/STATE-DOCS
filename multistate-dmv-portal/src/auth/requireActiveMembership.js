/**
 * Record help is not behind a paywall. The old header check returned 402 and
 * stopped the wizard before a packet could be built. Government offices still
 * verify identity when they receive the request.
 */
export default function requireActiveMembership(_req, _res, next) {
  return next();
}
