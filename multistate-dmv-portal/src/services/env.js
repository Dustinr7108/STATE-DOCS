export function envValue(name) {
  if (typeof Netlify !== "undefined" && Netlify.env) {
    const value = Netlify.env.get(name);
    if (value) return value;
  }
  return process.env[name] || "";
}
