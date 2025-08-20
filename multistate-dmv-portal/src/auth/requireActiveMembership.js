/**
 * Replace with your real auth check.
 * For now, allow if X-Membership: active or trialing. Otherwise 402.
 */
export default function requireActiveMembership(req, res, next) {
  const m = req.headers["x-membership"];
  if (m === "active" || m === "trialing") return next();
  // In production, read req.user from your auth session and check membership status in DB.
  return res.status(402).json({ error: "Membership required" });
}
