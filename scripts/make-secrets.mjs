// Prints three fresh secrets for Render. Writes nothing to disk. Run: node scripts/make-secrets.mjs
import { randomBytes } from "node:crypto";
const hex = (n) => randomBytes(n).toString("hex");
console.log("Copy each line into Render > Environment. Never put these in GitHub, Netlify or chat.\n");
console.log("AUDIT_HMAC_KEY=" + hex(32));
console.log("QR_SIGNING_KEY=" + hex(32));
console.log("SIMULATED_USER_PASSWORD=" + hex(12));
