# Crash The Stack: conventions

Rulings from David's code reads. Follow them in every file; they are not
suggestions.

## Code style (Sigil)

- Break a call or binding across lines once it has more than two or three
  arguments, one argument per line, aligned under the first:

  ```scheme
  (map (lambda (c)
         (string->symbol (string c)))
       (string->list FACE-KEYS))
  ```

  and one binding per line in `let`/`let*`. Short forms may stay on one line.
- `(sigil core)` is implicit in every library; never import it.
- Naming: `UPPER-CASE` for a constant, `*earmuffs*` for mutable module
  state, kebab-case everywhere else.
- American English spellings in identifiers and comments: color, center,
  neighbor.
- Structs are immutable by convention; a change is copy-construction,
  `(session s field: value ...)`. Mark a field `mutable: #t` only where a
  setter is actually used (the generator's private board copy).
- Colours live in the palette at the top of `(crash render)`; no literal
  `set-color` elsewhere.
- Prefer a stdlib procedure over a private one when the stdlib has it
  (`list-sort` from `(sigil list)`, not a hand-rolled sort).
- No vector with `#f` cells at a module's top level (`(make-vector n #f)`,
  `(vector #f "BOOT" ...)`): make it on first use. Three times on the web
  build such a vector took a page down before its first frame with a
  type error in an unrelated module (`(crash title)` in P3d; twice in
  `(crash cards render)` in the polish row, bisected one definition at a
  time) while the same module ran natively. Top-level vectors of strings
  or integers (`SUBSYSTEM-TAGS`, `BAYER-4`, the text caches) have not
  shown it. Unexplained at the sigil level (t-afdee1).

## Layering

- The rules family under `(crash stack ...)`, plus `(crash geometry)` and
  `(crash input)`, import only `(sigil struct)`, `(sigil math)`,
  `(sigil list)` and each other. `test/test-imports.sgl` enforces it.
- `(crash render)` draws; the shells under `(crash shell ...)` are the only
  modules that read a platform (`native` sigil-desktop, `web` the browser bridges);
  `(crash shell)` holds what they share and `(crash main)` picks one.

## Building

- `scripts/dev <cmd>` wraps a command in the guix environment the native
  build needs (`manifest.scm`). `scripts/dev sigil build`,
  `scripts/dev sigil test`.
- Play the `release` config (`scripts/dev sigil build --config release`,
  then `scripts/dev ./build/release/bin/crash-the-stack`): the `dev`
  bundle runs the game as bytecode at about 5 frames a second.
