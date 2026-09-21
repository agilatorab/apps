// The one source of truth for this site. Every page is generated from these
// rows — ten near-identical privacy policies maintained by hand disagree with
// each other within a month, and an inaccurate policy is a review risk rather
// than merely untidy.
//
// A row describes the app as a person meets it on the App Store. The only
// destinations any generated page carries are the store, this site and our
// contact address — scripts/check.mjs holds the output to that.
//
// FIELDS
//   slug        the URL path on this site, and nothing else
//   name        the App Store name — what the listing is called
//   tagline     one line, shown on the index card
//   appStoreId  the numeric Apple ID once the record exists; null renders the
//               card without a store link instead of linking nowhere
//   sync        cloud destinations the user may CHOOSE to connect; [] = none
//   localFolder the app can write to a folder the user picks on their device
//   icloud      the installed app can carry data between the player's own
//               devices through Apple's iCloud — a service of their Apple
//               Account, not ours, and worded as such
//   encrypted   the synced document is encrypted at rest before it leaves
//   selfHosted  server software the user runs themselves and points the app
//               at — a different fact from `sync`, which is an account with a
//               provider, and worded as the arrangement it is
//   gameCenter  the app talks to Apple's Game Center: the signed-in player,
//               achievements, and scores that a public board then shows
//   purchases   the app sells something inside itself, through Apple
//   health      the app records health information, which changes both the
//               policy's wording and the App Store questionnaire
//   child       the health data is about a child rather than the user

export const CONTACT = "support@agilator.se";
export const PUBLISHER = "Agilator AB";
export const SITE = "apps.agilator.se";
export const EFFECTIVE = "2026-09-19";

export const APPS = [
  {
    slug: "sea-haven",
    name: "Sea Haven",
    tagline: "A personal-watercraft racing game on generated northern shores.",
    appStoreId: null,
    sync: [],
    localFolder: false,
    encrypted: false,
    health: false,
    child: false,
    extra: "Settings and the screenshots you take are kept on your device.",
  },
  {
    slug: "adas-trail",
    name: "Ada's Trail",
    tagline: "A top-down survival scroller — build a roster, run the campaign.",
    appStoreId: null,
    sync: [],
    icloud: true,
    localFolder: false,
    encrypted: false,
    gameCenter: true,
    purchases: true,
    health: false,
    child: false,
    extra:
      "Your hero roster, campaign progress and settings are kept on the device you play on.",
  },
  {
    slug: "scandinavian-flick",
    name: "Scandinavian Flick",
    tagline: "A drift-first arcade rally game over generated low-poly stages.",
    appStoreId: null,
    sync: [],
    icloud: false,
    localFolder: false,
    encrypted: false,
    health: false,
    child: false,
    extra: "Your times, unlocks and settings are kept on the device you play on.",
  },
  {
    slug: "calendar",
    name: "Nird Calendar",
    tagline: "A wall calendar that doesn't nag you — week numbers, red Sundays, short notes.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: true,
    encrypted: false,
    health: false,
    child: false,
  },
  {
    slug: "checklist",
    name: "Nird Checklist",
    tagline: "A quiet checklist. Add items, check them off, swipe to archive.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    icloud: true,
    localFolder: true,
    encrypted: true,
    health: false,
    child: false,
  },
  {
    slug: "notes",
    name: "Nird Notes",
    tagline: "Notes that stay on your device unless you say otherwise.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    selfHosted: ["Nextcloud"],
    localFolder: true,
    encrypted: true,
    health: false,
    child: false,
  },
  {
    slug: "contacts",
    name: "Nird Contacts",
    tagline: "An address book as plain JSON, exportable as vCard or CSV.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: true,
    encrypted: true,
    health: false,
    child: false,
  },
  {
    slug: "calc",
    name: "Nird Calc",
    tagline: "A calculator with named, commentable sessions.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: true,
    encrypted: false,
    health: false,
    child: false,
  },
  {
    slug: "paint",
    name: "Nird Paint",
    tagline: "A sketchpad for the diagram you'd otherwise draw on a whiteboard.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    icloud: false,
    localFolder: true,
    encrypted: true,
    health: false,
    child: false,
  },
  {
    slug: "time",
    name: "Nird Time",
    tagline: "Start working, take your breaks, stop — and read your hours back.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: false,
    encrypted: false,
    health: false,
    child: false,
  },
  {
    slug: "meds",
    name: "Nird Meds",
    tagline: "Enter your medications and when to take them, then log each dose.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: false,
    encrypted: false,
    health: true,
    child: false,
  },
  {
    slug: "cycle",
    name: "Nird Cycle",
    tagline: "Two taps a day, then read your cycle history and a forecast.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: false,
    encrypted: false,
    health: true,
    child: false,
  },
  {
    slug: "baby",
    name: "Nird Baby",
    tagline: "Follow one child's feeding, sleep and growth from birth.",
    appStoreId: null,
    sync: ["Dropbox", "Google Drive"],
    localFolder: true,
    encrypted: false,
    health: true,
    child: true,
  },
];
