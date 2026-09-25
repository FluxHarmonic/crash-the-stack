// make-version-json.mjs - the release's /version.json, generated, never written by hand.
//
//   node scripts/make-version-json.mjs <staged-dir> <build-stamp>
//
// The game fetches /version.json (no-cache) to find out whether a newer
// version exists and what to say about it. Everything in it comes from
// something that is already true somewhere else:
//
//   version   package.sgl's version: field
//   build     the stamp of the tree being published (passed in, not guessed)
//   released  the date: of that version's News post
//   summary   the summary: of that News post
//   news      the post's URL, /news/<slug>/
//
// The post is found by turning the version into a slug: 0.1.2 -> 0-1-2. That
// convention is the only link between a release and its post, so a missing
// post is an ERROR rather than a blank field: shipping a release whose news
// entry does not exist is a mistake worth stopping the publish for.
//
// The summary is drawn text in the game's HUD, which is why it is checked
// here as well as in verify-site: the font has 56 characters and a line-2
// row holds 91 of them. A summary that breaks either rule would draw a hole
// or take a second HUD row, and neither is visible from the site.

import fs from "node:fs";
import path from "node:path";

const [stagedDir, buildStamp] = process.argv.slice(2);
if (!stagedDir || !buildStamp) {
  console.error("usage: make-version-json.mjs <staged-dir> <build-stamp>");
  process.exit(2);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const die = (m) => { console.error("make-version-json: " + m); process.exit(1); };

// package.sgl's version: field, the same one the Windows exe reads
const pkg = fs.readFileSync(path.join(ROOT, "package.sgl"), "utf8");
const vm = /^\s*version:\s*"([^"]+)"/m.exec(pkg);
if (!vm) die("no version: in package.sgl");
const version = vm[1];

// the release's News post: 0.1.2 -> site/content/news/0-1-2.md
const slug = version.replace(/\./g, "-");
const postPath = path.join(ROOT, "site", "content", "news", slug + ".md");
if (!fs.existsSync(postPath)) {
  die(`no News post for ${version} at site/content/news/${slug}.md; write the release post before publishing`);
}
const post = fs.readFileSync(postPath, "utf8");
const field = (name) => {
  const m = new RegExp("^" + name + ":[ \\t]*(.+)$", "m").exec(post);
  return m ? m[1].trim() : null;
};
const released = field("date");
const summary = field("summary");
if (!released) die(`the News post for ${version} has no date:`);
if (!summary) die(`the News post for ${version} has no summary:`);

// The two rules the game's HUD imposes on the summary. Kept here as well as
// in verify-site so a publish cannot be the first place either is noticed.
const FONT = "!#$'()+,-./0123456789:;<=>?[]^abcdefghijklmnopqrstuvwxyz ";
const LINE2_CHARS = 91;   // (640 - 60 - 32) / 6, the line-2 span over the cell width
const bad = [...summary].filter((c) => !FONT.includes(c.toLowerCase()));
if (bad.length) die(`the ${version} summary uses characters the game's font cannot draw: ${[...new Set(bad)].join(" ")}`);
if (summary.length > LINE2_CHARS) die(`the ${version} summary is ${summary.length} characters; the HUD holds ${LINE2_CHARS}`);

const out = {
  version,
  released: released.slice(0, 10),
  build: buildStamp,
  summary,
  news: `/news/${slug}/`,
};
const dest = path.join(stagedDir, "version.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");
console.log(`make-version-json: ${dest} <- ${version} (${out.released}, build ${buildStamp})`);
