/**
 * Demo builds allow the packet wizard without an account.
 * Set ENFORCE_MEMBERSHIP=true to require X-Membership: active or trialing.
 */
export default function requireActiveMembership(req, res, next) {
  if (process.env.ENFORCE_MEMBERSHIP !== "true") return next();
  const membership = req.headers["x-membership"];
  if (membership === "active" || membership === "trialing") return next();
  return res.status(402).json({ error: "Membership required" });
}
