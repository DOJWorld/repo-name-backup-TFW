import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
export const root = process.cwd();
export const readJson = (f) => JSON.parse(readFileSync(join(root, f), "utf8"));
export const registry = () => readJson("config/replacement-registry.json");
export const getPath = (o, p) => p.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
export const setPath = (o, p, v) => { const k = p.split("."); const last = k.pop(); k.reduce((a, x) => a[x], o)[last] = v; };
export const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const SKIP = new Set(["node_modules", ".git"]);
export function walk(dir = root, out = []) {
  for (const f of readdirSync(dir)) {
    if (SKIP.has(f)) continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(relative(root, p));
  }
  return out;
}
export const isText = (f) => !/\.(tar|gz|png|jpg|ico|woff2?)$/.test(f);
export function literalsOf(e) {
  const v = e.currentValue;
  if (!e.scanLiteral || v == null) return [];
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap((x) => (typeof x === "string" ? [x] : Object.values(x).filter((y) => typeof y === "string")));
  return Object.keys(v);
}
// Line number of every JSON path in a file written exactly as JSON.stringify(x, null, 2).
export function lineMap(root0) {
  const map = {}; let cur = 1;
  (function emit(v, path) {
    map[path] = cur;
    if (v && typeof v === "object") {
      const keys = Array.isArray(v) ? v.map((_, i) => i) : Object.keys(v);
      if (!keys.length) return;
      for (const k of keys) { cur++; emit(v[k], path ? path + "." + k : String(k)); }
      cur++;
    }
  })(root0, "");
  return map;
}
export const FORMATS = {
  text: (v) => typeof v === "string" && v.trim().length > 0 && v.length <= 120,
  email: (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  "https-origin": (v) => typeof v === "string" && /^https:\/\/[a-z0-9.-]+(:\d+)?$/.test(v),
  "https-origins": (v) => Array.isArray(v) && v.every((x) => FORMATS["https-origin"](x)),
  guid: (v) => typeof v === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v),
  "guid-role-map": (v) => v && typeof v === "object" && Object.keys(v).length === 8 &&
    Object.entries(v).every(([g, r]) => FORMATS.guid(g) && ["tfw_admin", "contractor_admin", "site_manager", "safety_officer", "permit_approver", "worker", "auditor", "support"].includes(r)) &&
    new Set(Object.values(v)).size === 8,
  "card-list": (v) => Array.isArray(v) && v.length > 0 && v.every((x) => ["sentinel", "cscs"].includes(x)),
  "site-list": (v) => Array.isArray(v) && v.length > 0 && v.every((s) => /^[A-Z0-9-]{3,20}$/.test(s.code) && FORMATS.text(s.name)) && new Set(v.map((s) => s.code)).size === v.length,
  "github-handle-prefix": (v) => typeof v === "string" && /^@[A-Za-z0-9_-]+\/$/.test(v),
};
export function validateValue(e, v) {
  if (e.format === "enum") return (e.options || []).includes(v);
  const m = /^int:(\d+)-(\d+)$/.exec(e.format);
  if (m) return Number.isInteger(v) && v >= +m[1] && v <= +m[2];
  return FORMATS[e.format] ? !!FORMATS[e.format](v) : false;
}
