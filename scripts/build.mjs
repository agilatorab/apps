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
import { COMPANY_SITE, MARK_SVG, PALETTE } from "../data/brand.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A readable list: "a", "a and b", "a, b and c". */
const list = (xs) =>
  xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

/** The same, for alternatives: destinations are a choice of one, not a set. */
const listOr = (xs) =>
  xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`;

// The look is the company site's (agilatorab/web): the same paper, ink and
// alligator-green accent, the same wide-tracked caps kicker, the same soft
// cards — so a person arriving from agilator.se sees one company, not two.
const tokens = (t) =>
  `--paper:${t.paper};--card:${t.card};--ink:${t.ink};--dim:${t.dim};--line:${t.line};--accent:${t.accent};--iris:${t.iris}`;

const CSS = `
:root{${tokens(PALETTE.light)};color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{${tokens(PALETTE.dark)}}}
*{box-sizing:border-box}
html{background:var(--paper)}
body{margin:0;background:var(--paper);color:var(--ink);
  font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  -webkit-text-size-adjust:100%}
.wrap{max-width:46rem;margin:0 auto;padding:1.25rem 1.25rem 4rem}
nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.25rem 0 2.5rem}
nav a.brand{display:inline-flex;align-items:center;gap:.75rem;color:var(--ink);text-decoration:none}
nav a.brand:hover .mark,nav a.brand:focus-visible .mark{--logo-iris:var(--accent)}
.mark{height:1.25rem;width:auto;--logo-iris:var(--iris)}
.mark path{transition:fill .4s ease}
nav .links a{color:var(--dim);text-decoration:none;font-size:.9rem;font-weight:500;margin-left:1rem}
nav .links a:hover{color:var(--ink)}
header{border-bottom:1px solid var(--line);padding-bottom:1.25rem;margin-bottom:2rem}
.kicker{font-size:.75rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);margin:0 0 .5rem}
h1{font-size:2rem;line-height:1.15;margin:0 0 .4rem;letter-spacing:-.02em;font-weight:600}
h2{font-size:1.06rem;margin:2.4rem 0 .6rem;letter-spacing:-.005em}
p{margin:0 0 1rem}
ul{margin:0 0 1rem;padding-left:1.15rem}
li{margin:.3rem 0}
a{color:var(--accent)}
.lede{font-size:1.1rem;color:var(--dim);margin:0}
.note{border-left:3px solid var(--accent);padding:.1rem 0 .1rem 1rem;margin:1.5rem 0;color:var(--dim)}
footer{margin-top:3.5rem;padding-top:1.25rem;border-top:1px solid var(--line);
  color:var(--dim);font-size:.87rem}
footer a{color:var(--dim)}
footer .row{display:flex;flex-wrap:wrap;gap:.4rem 1.25rem;justify-content:space-between;align-items:baseline}
footer .row p{margin:0}
.grid{display:grid;gap:.9rem;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));margin:2rem 0 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:1.15rem 1.25rem;transition:border-color .2s}
.card:hover{border-color:var(--accent)}
.card h3{margin:0 0 .3rem;font-size:1rem}
.card p{margin:0 0 .7rem;color:var(--dim);font-size:.9rem;line-height:1.5}
.links{font-size:.83rem;color:var(--dim)}
.links a{margin-right:.8rem}
.soon{font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin-right:.8rem}
@media (prefers-reduced-motion:reduce){.mark path,.card{transition:none}}
`.trim();

function page({ title, kicker, heading, lede, body, crumb }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="${PALETTE.light.paper}">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${PALETTE.dark.paper}">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<nav aria-label="Primary">
<a class="brand" href="${COMPANY_SITE}" aria-label="${esc(PUBLISHER)}">${MARK_SVG}</a>
<span class="links"><a href="/">All apps</a><a href="mailto:${esc(CONTACT)}">Contact</a></span>
</nav>
<header>
${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ""}
<h1>${esc(heading)}</h1>
${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
</header>
${body}
<footer>
<div class="row">
<p>&copy; ${EFFECTIVE.slice(0, 4)} ${esc(PUBLISHER)} &middot; Sweden &middot; <a href="${COMPANY_SITE}">agilator.se</a></p>
<p><a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a>${
    crumb ? ` &middot; <a href="/">All apps</a>` : ""
  }</p>
</div>
<p style="margin:.75rem 0 0">This site sets no cookies and loads nothing from third parties.</p>
</footer>
</div>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- privacy */

function privacyBody(app) {
  const s = [];
  const syncs = app.sync.length ? listOr(app.sync) : null;
  const selfs = app.selfHosted?.length ? listOr(app.selfHosted) : null;

  s.push(`<p class="note">${esc(app.name)} keeps what you enter on your device.
    ${esc(PUBLISHER)} operates no server for it, receives none of your content,
    and has no way to read it.${
      app.gameCenter
        ? " If you play signed in to Game Center, your scores go to Apple — that section is below."
        : ""
    }</p>`);

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

  if (selfs) {
    s.push(`<h2>A server you run yourself</h2>`);
    s.push(`<p>${esc(app.name)} can also sync to ${esc(selfs)}: server software
      you host, reached at an address you type in, with a credential you create
      there. ${esc(PUBLISHER)} is not part of that arrangement &mdash; the app
      talks to your server directly, and we never see the address, the
      credential or what passes between them.${
        app.encrypted
          ? " The document is encrypted before it leaves your device here too."
          : ""
      }</p>`);
  }

  if (app.icloud) {
    s.push(`<h2>Apple iCloud</h2>`);
    s.push(`<p>Inside the installed app, what you have saved can additionally
      be carried between your own devices through Apple's iCloud. iCloud is a
      service of <em>your</em> Apple Account, not ours: the data goes to your
      storage, under your Apple ID, and ${esc(PUBLISHER)} receives nothing
      through it and cannot read it. You can turn it off for this app in the
      device's Settings at any time.</p>`);
  }

  if (app.gameCenter) {
    s.push(`<h2>Game Center</h2>`);
    s.push(`<p>On Apple devices ${esc(app.name)} can use Game Center, which is
      part of your Apple Account. While you are signed in, the game reports
      your achievement progress and your scores to it, and reads back the
      player name Game Center gives you.</p>`);
    s.push(`<p>A score you post to a leaderboard is <strong>public</strong>:
      anyone looking at that board sees the name Game Center shows for you
      beside it. All of this goes to Apple, under Apple's own privacy policy.
      ${esc(PUBLISHER)} receives no player identity and cannot connect a score
      to a person. Signing out of Game Center in the device's Settings stops
      the reporting; the game plays the same either way.</p>`);
  }

  if (app.purchases) {
    s.push(`<h2>Purchases</h2>`);
    s.push(`<p>${esc(app.name)} sells items inside the app, and Apple handles
      every purchase: you pay Apple, Apple tells the app what you now own, and
      no payment detail reaches the app or ${esc(PUBLISHER)}. What we see is the
      aggregate sales figure App Store Connect reports, which names nobody.</p>`);
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
  const syncs = app.sync.length ? listOr(app.sync) : null;
  const selfs = app.selfHosted?.length ? listOr(app.selfHosted) : null;

  s.push(`<p>${esc(app.tagline)}</p>`);

  s.push(`<h2>Getting help</h2>`);
  s.push(`<p>Write to <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a> with
    the app name, your device and iOS version, and what happened. We read every
    message and aim to reply within a few working days.</p>`);

  s.push(`<h2>Common questions</h2>`);
  s.push(`<p><strong>Where is my data?</strong> On your device.
    ${esc(app.name)} works offline and keeps everything locally${
      syncs ? `, unless you connect your own ${esc(syncs)} account` : ""
    }${selfs ? `, or point it at a ${esc(selfs)} server you run yourself` : ""}${
      app.icloud
        ? ", and — in the installed app — can carry it between your own devices through your Apple Account's iCloud"
        : ""
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

  if (app.gameCenter) {
    s.push(`<p><strong>Do I have to use Game Center?</strong> No. Signed out,
      the game plays exactly the same and reports nothing. Signed in, your
      scores go to Apple's leaderboards, where they are public under the player
      name Game Center shows for you.</p>`);
  }

  if (app.purchases) {
    s.push(`<p><strong>A purchase did not arrive.</strong> Purchases are
      Apple's: reinstalling and using Restore Purchases recovers anything you
      have bought. If it stays missing, write to us with the date &mdash;
      refunds themselves are requested from Apple, not from us.</p>`);
  }

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
      heading: "Apps and games",
      lede: "Local-first tools and small games, made in Sweden.",
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
