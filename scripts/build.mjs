// Generates the whole site into dist/. Pure Node, no dependencies — the output
// is static HTML with its CSS inlined, so a page is one request and renders
// before a stylesheet could have arrived.
//
// Run: node scripts/build.mjs   (or `make build`)

import { mkdir, writeFile, rm, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { APPS, CONTACT, PUBLISHER, SITE, EFFECTIVE } from "../data/apps.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A readable list: "a", "a and b", "a, b and c". */
const list = (xs) =>
  xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

const CSS = `
:root{--ink:#16242b;--dim:#5c7480;--line:#dde7eb;--paper:#fbfdfd;--card:#fff;--accent:#1b6f8a;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--ink:#e3edf1;--dim:#93a9b4;--line:#22343d;--paper:#0e171c;--card:#141f26;--accent:#63b6cf}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:46rem;margin:0 auto;padding:3rem 1.25rem 5rem}
header{border-bottom:1px solid var(--line);padding-bottom:1.25rem;margin-bottom:2rem}
.kicker{font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:0 0 .4rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .35rem;letter-spacing:-.01em}
h2{font-size:1.06rem;margin:2.4rem 0 .6rem;letter-spacing:-.005em}
p{margin:0 0 1rem}
ul{margin:0 0 1rem;padding-left:1.15rem}
li{margin:.3rem 0}
a{color:var(--accent)}
.lede{font-size:1.05rem;color:var(--dim);margin:0}
.note{border-left:3px solid var(--accent);padding:.1rem 0 .1rem 1rem;margin:1.5rem 0;color:var(--dim)}
footer{margin-top:3.5rem;padding-top:1.25rem;border-top:1px solid var(--line);
  color:var(--dim);font-size:.87rem}
footer a{color:var(--dim)}
.grid{display:grid;gap:.9rem;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));margin:2rem 0 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:1.05rem 1.15rem}
.card h3{margin:0 0 .3rem;font-size:1rem}
.card p{margin:0 0 .7rem;color:var(--dim);font-size:.9rem;line-height:1.5}
.links{font-size:.83rem;color:var(--dim)}
.links a{margin-right:.8rem}
.soon{font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-right:.8rem}
`.trim();

function page({ title, kicker, heading, lede, body, crumb }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header>
${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ""}
<h1>${esc(heading)}</h1>
${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
</header>
${body}
<footer>
<p>${esc(PUBLISHER)} &middot; <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a>${
    crumb ? ` &middot; <a href="/">All apps</a>` : ""
  }</p>
</footer>
</div>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- privacy */

function privacyBody(app) {
  const s = [];
  const syncs = app.sync.length ? list(app.sync) : null;

  s.push(`<p class="note">${esc(app.name)} keeps what you enter on your device.
    ${esc(PUBLISHER)} operates no server for it, receives none of your content,
    and has no way to read it.</p>`);

  s.push(`<h2>What the app stores, and where</h2>`);
  s.push(`<p>Everything you enter, and the settings you choose, is written to
    storage belonging to the app on your own device. It is not transmitted
    anywhere as a condition of using the app, and the app works fully with no
    network connection at all.</p>`);
  if (app.extra) s.push(`<p>${esc(app.extra)}</p>`);

  if (syncs) {
    s.push(`<h2>Optional cloud sync</h2>`);
    s.push(`<p>If you choose to, you can connect ${esc(app.name)} to your own
      ${esc(syncs)} account${
        app.localFolder ? ", or to a folder you pick on your device" : ""
      }. This is off until you turn it on.</p>`);
    s.push(`<p>When it is on, the app writes your data into <em>your</em>
      account, using credentials you grant directly to that provider. The data
      travels between your device and the provider you chose. It does not pass
      through ${esc(PUBLISHER)}, and we hold no keys, tokens or copies.${
        app.encrypted
          ? " The synced document is encrypted before it leaves your device."
          : ""
      } Your use of that provider is governed by that provider's own terms and
      privacy policy.</p>`);
    s.push(`<p>Disconnecting sync in the app stops any further writing. Data
      already in your own account stays there, under your control, and you can
      delete it the same way you delete anything else in that account.</p>`);
  }

  if (app.health) {
    s.push(`<h2>Health information</h2>`);
    const subject = app.child ? "the child you are tracking" : "you";
    s.push(`<p>${esc(app.name)} records information about ${esc(subject)} that
      is health-related and sensitive. It is treated exactly like everything
      else the app stores: written to your device, never sent to
      ${esc(PUBLISHER)}, and shared with no one.</p>`);
    s.push(`<p>It is <strong>never</strong> sold, rented, shared with data
      brokers, used for advertising, used to build a profile, or used to train
      any model. If you enable cloud sync, it goes to the account you chose and
      nowhere else.</p>`);
    s.push(`<p>${esc(app.name)} is a record-keeping tool. It is not a medical
      device, it does not provide medical advice, and it must not be used as a
      substitute for professional care.</p>`);
  }

  if (app.child) {
    s.push(`<h2>Information about children</h2>`);
    s.push(`<p>This app is for a parent or guardian to keep their own records
      about their own child. It is not directed at children, has no sign-up, no
      social features and no advertising, and collects nothing from a child
      directly. The record belongs to the adult keeping it, on their
      device.</p>`);
  }

  s.push(`<h2>What the app does not do</h2>`);
  s.push(`<ul>
    <li>No account, no sign-up, no email address required.</li>
    <li>No analytics, telemetry, crash reporting or usage tracking.</li>
    <li>No advertising, no advertising identifiers, no third-party ad SDKs.</li>
    <li>No selling or sharing of your information &mdash; there is nothing to
        sell, because we never receive it.</li>
    <li>No profiling and no automated decision-making.</li>
  </ul>`);

  s.push(`<h2>Information Apple receives</h2>`);
  s.push(`<p>Downloading and updating any app involves Apple, independently of
    us. Apple may collect purchase, download and &mdash; if you have opted in
    to sharing them &mdash; diagnostic reports, under Apple's own privacy
    policy. We receive only aggregate, anonymous sales and crash statistics
    through App Store Connect, which identify no individual.</p>`);

  s.push(`<h2>Your rights</h2>`);
  s.push(`<p>${esc(PUBLISHER)} is a Swedish company and subject to the GDPR. In
    practice, the rights of access, rectification, erasure and portability are
    satisfied directly by you: the data is on your device and, if you enabled
    sync, in your own cloud account. You can view, edit, export or delete it at
    any time without asking us, and deleting the app removes what it stored on
    the device. We hold no copy to disclose or erase.</p>`);
  s.push(`<p>If you believe otherwise, or want to raise a concern, write to
    <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a>. You also have the
    right to complain to your national data protection authority.</p>`);

  s.push(`<h2>Changes</h2>`);
  s.push(`<p>If this policy changes materially, the updated version is
    published here with a new effective date. This version is effective
    ${esc(EFFECTIVE)}.</p>`);

  s.push(`<h2>Contact</h2>`);
  s.push(
    `<p>${esc(PUBLISHER)} &mdash; <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a></p>`,
  );

  return s.join("\n");
}

/* ---------------------------------------------------------------- support */

function supportBody(app) {
  const s = [];
  const syncs = app.sync.length ? list(app.sync) : null;

  s.push(`<p>${esc(app.tagline)}</p>`);

  s.push(`<h2>Getting help</h2>`);
  s.push(`<p>Write to <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a> with
    the app name, your device and iOS version, and what happened. We read every
    message and aim to reply within a few working days.</p>`);

  s.push(`<h2>Common questions</h2>`);
  s.push(`<p><strong>Where is my data?</strong> On your device.
    ${esc(app.name)} works offline and keeps everything locally${
      syncs ? `, unless you connect your own ${esc(syncs)} account` : ""
    }. See the <a href="/${esc(app.slug)}/privacy/">privacy policy</a>.</p>`);

  if (syncs) {
    s.push(`<p><strong>Sync isn't working.</strong> Check that the device is
      online and that the app is still connected under Settings. Reconnecting
      the account resolves most cases; your existing entries are not affected
      by disconnecting.</p>`);
  }

  s.push(`<p><strong>How do I delete everything?</strong> Deleting the app
    removes what it stored on the device.${
      syncs
        ? " Anything already written to your own cloud account is deleted there, by you, like any other file."
        : ""
    }</p>`);

  if (app.health) {
    s.push(`<p><strong>Is this a medical device?</strong> No. ${esc(app.name)}
      is a record-keeping tool and gives no medical advice. Talk to a
      healthcare professional about anything clinical.</p>`);
  }

  s.push(`<h2>Reporting a problem</h2>`);
  s.push(`<p>Bugs, confusing behaviour and requests are all welcome at the same
    address. If something looks like a security issue, say so in the subject
    line and we will treat it accordingly.</p>`);

  return s.join("\n");
}

/* ------------------------------------------------------------------ index */

function indexBody() {
  const cards = APPS.map(
    (a) => `<div class="card">
  <h3>${esc(a.name)}</h3>
  <p>${esc(a.tagline)}</p>
  <p class="links">${
    a.appStoreId
      ? `<a href="https://apps.apple.com/app/id${esc(a.appStoreId)}">App Store</a>`
      : `<span class="soon">Coming soon</span>`
  }<a href="/${esc(a.slug)}/privacy/">Privacy</a><a href="/${esc(a.slug)}/support/">Support</a></p>
</div>`,
  ).join("\n");

  return `<p>Small, quiet apps that keep your information on your own device.
No accounts, no tracking, no advertising. Each one works offline, and syncs
only to a cloud account you choose and control.</p>
<div class="grid">
${cards}
</div>`;
}

/* ------------------------------------------------------------------ build */

async function write(path, html) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, html, "utf8");
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  await write(
    join(DIST, "index.html"),
    page({
      title: `${PUBLISHER} — Apps`,
      kicker: PUBLISHER,
      heading: "Apps",
      lede: "Local-first tools for iPhone and iPad.",
      body: indexBody(),
    }),
  );

  for (const app of APPS) {
    await write(
      join(DIST, app.slug, "privacy", "index.html"),
      page({
        title: `Privacy Policy — ${app.name}`,
        kicker: app.name,
        heading: "Privacy Policy",
        lede: `Effective ${EFFECTIVE}`,
        body: privacyBody(app),
        crumb: true,
      }),
    );
    await write(
      join(DIST, app.slug, "support", "index.html"),
      page({
        title: `Support — ${app.name}`,
        kicker: app.name,
        heading: "Support",
        lede: null,
        body: supportBody(app),
        crumb: true,
      }),
    );
  }

  // GitHub Pages needs the custom domain beside the output, and .nojekyll
  // stops it trying to run the directory through Jekyll.
  if (existsSync(join(ROOT, "CNAME"))) {
    await copyFile(join(ROOT, "CNAME"), join(DIST, "CNAME"));
  }
  await writeFile(join(DIST, ".nojekyll"), "", "utf8");

  console.log(`built ${APPS.length * 2 + 1} pages for ${APPS.length} apps → dist/`);
  console.log(`  https://${SITE}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
