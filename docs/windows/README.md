# Crash The Stack on Windows

The `windows-amd64` config builds a `crash-the-stack.exe` from Linux through
the zig toolchain sigil pins, the same way sigil's own Windows release
artifact is built. First done 2026-09-21 (P4b, ruling D37: a Linux and a
Windows artifact every release). This page is how to build it, how to run it
under Wine on the development box, what broke on the way and where the fix
went, and what nobody has tested yet.

## Build

    scripts/dev sigil build --config windows-amd64

Output: `build/windows-amd64/bin/crash-the-stack.exe` (44,898,738 bytes on
sigil 0.22.3, sha256 `96a7717b08687c36822b507fa251411bf7f4d39fa6ef994207d6564d221f6017`;
`PE32+ executable for MS Windows 6.00 (GUI), x86-64`). The first builds
were on 0.22.2 (44,071,862 bytes console-subsystem, 44,864,598 GUI); the
0.22.3 relock moved only the ten sigil monorepo entries of `sigil.lock`
(motif and sigil-dsp held at 0.6.2 and 0.3.2), the import list is
byte-identical across the two runtimes, and the Wine drive below was
repeated on the 0.22.3 exe (STACK: a mouse match 144 to 142; DEFRAG: the
ace and a pull; the tracker).

The config in `package.sgl` mirrors `release` (native backend, optimize 2,
bundle) with `toolchain: 'zig`, `target: "x86_64-windows-gnu"`, `static?:
#t` (as the monorepo's and the sigil-desktop/graphics/audio `windows-amd64`
configs: `-static` at the link, no `-s` strip) and `features: '(release
cross windows)`, and the sigil-desktop dependency's config gate includes
it. Nothing in the game's or its dependencies' source branches on
`release`, `cross` or `windows` today (every `cond-expand` in the tree is on
`wasm`, `test` or `else`), so the Windows build compiles the same Sigil as
`release`; the features are there for a future branch. One thing to know
before writing one: the compiler's built-in feature list is the HOST's
(`linux`, `posix`, `unix` are true while cross-compiling), and `windows` is
true only because this config lists it.

Every package in the dependency graph is compiled with the root config's
target; a dependency's `configs:` gate is matched by the root config's
NAME. That is why motif, which has no `windows-amd64` config of its own,
cross-compiles, and also why the graph is not exactly `release`'s: motif
gates its own sigil-mcp and sigil-audio dependencies to `(dev release)`, so
sigil-mcp is not built for Windows (sigil-audio is, because the game
depends on it directly). The game imports nothing from sigil-mcp. The
`motif.exe` (36.8 MB) that lands beside the game, as `motif` does beside
the Linux binary, is bundled against that missing module: `motif --help`
runs under Wine, `motif mcp` dies with `unbound variable 'mcp-server'`. It
is not part of the game; a release ships `crash-the-stack.exe` alone. The
fix, if a Windows motif is ever wanted, is motif's gate reading `(dev
release windows-amd64)`.

Nothing in `manifest.scm` is needed beyond what the Linux build uses: the
Win32 GLFW files, miniaudio's WASAPI backend, stb_vorbis, motif's `render.c`
and the game's `src/c/crash-native.c` compile against the Windows headers
zig ships. No fix was needed in sigil-desktop, sigil-graphics, sigil-audio
or the toolchain for the first link: the Windows link flags those packages
carry (sigil-desktop `-lkernel32 -luser32 -lshell32 -lgdi32`; the others
none, everything loaded at run time) were enough.

### What the binary needs at run time

`guix shell binutils -- objdump -p build/windows-amd64/bin/crash-the-stack.exe | grep 'DLL Name'`:

    KERNEL32.dll  USER32.dll  GDI32.dll  SHELL32.dll  WS2_32.dll
    api-ms-win-crt-{environment,heap,runtime,stdio,string,private,convert,
                    math,utility,filesystem,time,conio,locale}-l1-1-0.dll

All system DLLs. The `api-ms-win-crt-*` set is the Universal C Runtime,
present on Windows 10 and later; Windows 7 and 8.1 need the UCRT update
(KB2999226) or the VC++ redistributable. `WS2_32` is sigil-lib's socket
code, not the game. OpenGL (`opengl32.dll`) and the audio stack
(`ole32`/`mmdevapi` for WASAPI) are loaded by name at run time by
sigil-graphics' GL loader and miniaudio, so they do not appear as imports.

The game reads its assets by paths relative to the current directory
(`assets/...`), and `link-assets` puts them at `build/windows-amd64/assets/`.
Since 2026-09-22 the native shell moves the process to the exe's parent
directory at startup when `assets/` is not under the current directory
but is under `<exe dir>/..` (sigil's own bundle layout, the one `(sigil
resources)` expects), so double-clicking `bin\crash-the-stack.exe` in
Explorer, which starts it with `bin\` as the current directory, works.
Measured under Wine: from `bin\` the three tracks decode (`crash: track
spy 3748500` ...); the exe copied to a directory with no `../assets`
prints `crash: track spy 0` and `crash: credits missing
assets/credits.txt`, the failure the move prevents. The Linux dev binary
launched from `build/dev/bin/` behaves the same. One consequence: a
relative `--tune`/`--edit` path given on such a launch resolves against
the install directory, not the shell's.

Saves: `(crash store)` resolves its directory from `XDG_DATA_HOME`, then
`APPDATA`, then `$HOME/.local/share`, then `.`; `(crash tracker files)`
resolves the tunes directory the same way. The `APPDATA` step is from this
work (David's ruling: `%APPDATA%`, the Roaming profile). Before it, a stock
Windows launch, which sets neither `XDG_DATA_HOME` nor `HOME`, saved into
`.\crash-the-stack\` under the current directory, and `store-set!`'s
`guard` hid a failed write. `test/test-store-root.sgl` covers the chain,
and the Windows binary was run under Wine with `XDG_DATA_HOME` unset: the
save appeared under `drive_c/users/<user>/AppData/Roaming/crash-the-stack/`.

## Running under Wine on the Guix box

Wine 10.0 from Guix (`guix shell wine64`), a fresh prefix, Gecko and Mono
prompts skipped with `WINEDLLOVERRIDES=mscoree,mshtml=`:

    export WINEPREFIX=/tmp/crash-wine WINEDLLOVERRIDES=mscoree,mshtml=
    guix shell wine64 -- wine64 wineboot --init          # once
    unset DISPLAY                                        # see below
    cd build/windows-amd64
    guix shell wine64 -- wine64 bin/crash-the-stack.exe --fresh --seed 3

**Use Wine's Wayland driver on sway: `unset DISPLAY` with `WAYLAND_DISPLAY`
set.** With `DISPLAY` set Wine uses its X11 driver through XWayland, and on
this box's layout (`output DP-2 pos 1920 0`, `output eDP-1 pos 1920 1080`,
nothing at the origin) mouse input goes wrong: David saw clicks landing
away from where he clicked; a 60-line Win32 probe (a bare `CreateWindowA`
window that prints every mouse message) on a headless sway reshaped to
that layout received no click at all, reported its window at (0,0) while X
had it at (2240,140), and `GetCursorPos` in raw X root coordinates. The
same probe with the outputs moved to the origin printed
`CLICK msg=(640,364)` for a click at the window's (640,364), and the game's
own X11-driver runs on Xvfb and on an origin layout each started a run
from one click at the STACK entry. So it is Wine's X11 driver on a layout
with no output at the origin, not GLFW and not the game. Under the Wayland
driver the window is a native xdg_shell client, the probe prints exact
coordinates on the real layout, and David: "Audio works, clicks work."

Useful environment: `WINEDEBUG=-all` once it runs (Wine's HID thread
prints `dropping short report` lines for one of the USB devices on the
box); `SIGIL_DESKTOP_VERBOSE=1` prints the window, framebuffer, content
scale and GL version at start; `PULSE_SINK=worker-null` routes the audio
for a silent drive; `XDG_DATA_HOME=<scratch>` keeps a drive's save out of
the real one (Wine passes the Unix environment to the program).

### What was measured (2026-09-21, sigil 0.22.2, Wine 10.0, Mesa)

- Window and GL context: `platform=win32 window=1280x800
  framebuffer=1280x800 content-scale=1.00x1.00`, `gl=4.5` on llvmpipe
  (Xvfb, the headless sway) and `gl=4.6` on David's GPU, the same number
  under the X11 and the Wayland driver on the same renderer. sigil-desktop
  asks for a 4.3 core context on Windows as on Linux; nothing had to change.
- Audio: miniaudio picks WASAPI, Wine maps it to PulseAudio (`winepulse`);
  `pactl list sink-inputs` showed `application.name =
  "crash-the-stack.exe"`, uncorked, on the session's sink, and David heard
  the soundtrack and the cues. Two `miniaudio WARNING: [WASAPI] Failed to
  find suitable device format for device info retrieval` lines at start are
  device enumeration only; the device opens and plays. With `PULSE_SINK`
  pointed at a suspended null sink the lines read `ERROR: Failed to
  retrieve mix format` and the game runs on regardless.
- The three OGG tracks decode (`crash: track spy 3748500`, `groove
  3656291`, `breaker 3628800`): stb_vorbis through sigil-audio's linked
  copy works on Windows.
- STACK: dealt (`--fresh --seed 3`), a tag-typed move (DR + DZ, 144 to 142
  tiles), mouse selection, the pair hint, the ICE counter-hack landing.
  DEFRAG (`--cards`): an ace to its foundation and a pull from the feed by
  mouse. Tracker (`--tune assets/refs/audio/breaker.cts`): motif's
  `render.c` runs. `--bench-probe 5`: 5 deals in 547 ms, 1709 us per
  position (native codegen, no window). Screenshots from the headless
  sway drive (Wayland driver, first build) are in this directory
  (`wine-*.png`).
- `[sg][warning] ... GL_UNIFORMBLOCK_NAME_NOT_FOUND_IN_SHADER` for `u_key`
  and `u_rate` at shader creation: `(crash gpu rules)` declares both for
  every field rule and only some rules read them, so the driver's GLSL
  compiler drops the unused one. sokol skips the upload; harmless.

## What is untested

- Real Windows. Everything above is Wine on Linux with Mesa. Unverified: a
  Windows GPU driver's GLSL compiler, WASAPI on real hardware, `%APPDATA%`
  resolution outside Wine, DPI scaling (`content-scale` above 1: GLFW's
  `GLFW_SCALE_FRAMEBUFFER` is on; on Win32 the framebuffer size equals the
  client size and the cursor is scaled the same way), and the console
  handling: the exe links as a GUI-subsystem program
  (`-Wl,--subsystem,windows` in the config's `link-flags:`), so Explorer
  opens no console beside the game, and `crash-native.c` calls
  `AttachConsole(ATTACH_PARENT_PROCESS)` at module init and, only for a
  standard stream the process does not already have (so a redirect such
  as `crash-the-stack.exe > log.txt` is kept), reopens it on `CONOUT$`,
  so a launch from `cmd`/PowerShell should still print the diagnostics.
  Untested on a real console: under Wine `AttachConsole` has no Windows
  parent console to attach to, and the exe's output reached the Unix
  stdout through the inherited handles as before (measured; that path
  does not exercise the attach). The flag sits on the config, and a
  config's link flags reach every bundle of that config (every bundle
  links every native archive, so a library-level flag reaches them
  too): `motif.exe` is GUI-subsystem as well, one more reason it is not
  part of the artifact.
- Windows 7/8.1 (UCRT api-sets, see above).
- A code-signing story: none. SmartScreen will warn on an unsigned exe.
