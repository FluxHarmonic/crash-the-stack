// The arms must exit non-zero when a leg fails, or a gate that runs them
// reports success on a red. verify-site's shutdown put process.exit(code)
// inside an unref'd timer, so a run whose event loop emptied first exited
// 0 with FAIL lines on screen (found in review, 2026-09-23; five of five
// runs). Every arm now sets process.exitCode before that timer.
//
//   node test/test-arm-exit.mjs [STAGED]
//
// It stages a copy of the tree (default build/hosted-site), plants one
// failure a leg is certain to catch, runs verify-site against the copy and
// asserts a non-zero exit with that leg's FAIL line. A planted failure is
// the only honest way to test this: a green run exits 0 either way.
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
const STAGED = process.argv[2] || "build/hosted-site";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const staged = path.resolve(ROOT, STAGED);
if (!fs.existsSync(path.join(staged, "soundtrack", "style.css"))) {
  console.log(`SETUP-FAILED: ${staged} is not a staged tree (scripts/stage-web builds one)`);
  process.exit(2);
}
const tmp = fs.mkdtempSync("/tmp/crash-arm-exit-");
const copy = path.join(tmp, "staged");
fs.cpSync(staged, copy, { recursive: true });
// the plant: the soundtrack leg asserts the site's palette in the page's stylesheet
const css = path.join(copy, "soundtrack", "style.css");
fs.writeFileSync(css, fs.readFileSync(css, "utf8").replace("--bg: #0d0a1a", "--bg: #ffffff"));
const run = spawnSync("node", ["verify-site.mjs", copy, "--port", "8175", "--cdp", "9275"],
                      { cwd: ROOT, encoding: "utf8", timeout: 900000 });
fs.rmSync(tmp, { recursive: true, force: true });
const out = (run.stdout || "") + (run.stderr || "");
const failed = /^FAIL soundtrack: /m.test(out);
const result = /^RESULT: \d+ passed, (\d+) failed/m.exec(out);
let detail = "";
if (!result) detail = "the arm printed no RESULT line";
else if (result[1] === "0") detail = `the planted failure was not caught: ${result[0]}`;
else if (!failed) detail = "a leg failed, but not the soundtrack leg the plant targets";
else if (run.status === 0) detail = `the arm reported ${result[0]} and still exited 0`;
else if (run.status !== 1) detail = `the arm exited ${run.status}, not 1`;
if (detail) { console.log(`FAIL arm-exit: ${detail}`); process.exit(1); }
console.log(`PASS arm-exit: a planted failure gives "${result[0]}" and exit ${run.status}`);
