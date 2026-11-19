import { readFileSync } from 'node:fs';
const load = (l) => JSON.parse(readFileSync(new URL(`./locales/${l}.json`, import.meta.url), 'utf8'));
export const LOCALES = { en: load('en'), cy: load('cy') };
export const t = (lang, key) => LOCALES[lang]?.[key] ?? LOCALES.en[key] ?? key;
export function pickLang(q, accept) {
  if (q === 'cy' || q === 'en') return q;
  const first = String(accept || '').split(',')[0].trim().toLowerCase();
  return first.startsWith('cy') ? 'cy' : 'en';
}
export function missingKeys() {
  const k = (o) => Object.keys(o).filter((x) => !x.startsWith('_'));
  const en = k(LOCALES.en), cy = k(LOCALES.cy);
  return { missingInCy: en.filter((x) => !cy.includes(x) || !LOCALES.cy[x]), orphanInCy: cy.filter((x) => !en.includes(x)) };
}
