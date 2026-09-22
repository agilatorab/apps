// Regenerates data/brand.js from a checkout of the company site
// (github.com/agilatorab/web): the mark from public/mark.svg and the palette
// from the @theme block in src/styles.css. Run it whenever the brand changes
// there, then rebuild and commit the result.
//
// Run: node scripts/import-brand.mjs ../web

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const web = process.argv[2];
if (!web) {
  console.error("usage: node scripts/import-brand.mjs <path-to-web-checkout>");
  process.exit(2);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const svg = readFileSync(join(web, "public/mark.svg"), "utf8")
  .trim()
  .replace(/^<svg /, '<svg class="mark" ');

// The light values are the @theme block; the dark ones are the :root override
// under prefers-color-scheme: dark. Each is a `--color-<name>: <value>;` line.
const css = readFileSync(join(web, "src/styles.css"), "utf8");
const block = (re) => {
  const m = re.exec(css);
  if (!m) {
    console.error("styles.css no longer has the expected token block");
    process.exit(1);
  }
  return m[1];
};
const read = (text, name) => {
  const m = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(text);
  if (!m) {
    console.error(`styles.css is missing --color-${name}`);
    process.exit(1);
  }
  return m[1].trim();
};
const light = block(/@theme\s*\{([\s\S]*?)\n\}/);
const dark = block(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}/);
const palette = (text) => ({
  paper: read(text, "paper"),
  card: read(text, "card"),
  ink: read(text, "ink"),
  dim: read(text, "dim"),
  line: read(text, "line"),
  accent: read(text, "accent"),
  iris: read(text, "iris-rest"),
});
const row = (t) => JSON.stringify(t).replace(/"(\w+)":/g, "$1: ").replace(/,/g, ", ").replace(/^\{/, "{ ").replace(/\}$/, " }");

const out = `// The Agilator AB mark — the eyes from the logo — as inline SVG, and the
// palette the company site uses, so this site and agilator.se look like one
// thing. Both are copied from the agilatorab/web repository (public/mark.svg
// and src/styles.css); when the brand changes there, regenerate this file
// rather than editing it: \`node scripts/import-brand.mjs <path-to-web-repo>\`.
//
// The SVG takes its ink from \`currentColor\` and its iris colour from the
// \`--logo-iris\` custom property; unset, the eyes are holes.

export const COMPANY_SITE = "https://agilator.se/";

export const MARK_SVG = ${JSON.stringify(svg)};

export const PALETTE = {
  light: ${row(palette(light))},
  dark: ${row(palette(dark))},
};
`;
writeFileSync(join(ROOT, "data/brand.js"), out);
console.log("wrote data/brand.js from", web);
