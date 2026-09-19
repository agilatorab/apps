// Fails the build if a generated page links anywhere it should not.
//
// The check is an ALLOWLIST rather than a list of things to avoid: the site
// links to the App Store, to itself, and to our own contact address, and that
// is the whole of it. Stating what is permitted keeps the rule short, makes an
// unexpected destination fail by default, and means this file carries no list
// of domains worth naming.

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT } from "../data/apps.js";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");

/** Every destination a generated page is allowed to point at. */
const ALLOWED = [
  (url) => url.startsWith("/"), // within this site
  (url) => url === `mailto:${CONTACT}`, // our own contact address
  (url) => url.startsWith("https://apps.apple.com/"), // a store listing
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let failures = 0;
let checked = 0;

for await (const path of walk(DIST)) {
  if (!path.endsWith(".html")) continue;
  const text = await readFile(path, "utf8");
  for (const [, url] of text.matchAll(/(?:href|src)="([^"]*)"/g)) {
    checked++;
    if (ALLOWED.some((ok) => ok(url))) continue;
    console.error(`${path.replace(DIST, "dist")}: unexpected destination ${url}`);
    failures++;
  }
}

if (failures) {
  console.error(`\n${failures} unexpected destination(s) in the generated site.`);
  process.exit(1);
}
console.log(`${checked} link(s) checked, all permitted`);
