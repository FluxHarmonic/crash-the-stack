# Crash The Stack on Windows

The `windows-amd64` config builds a `crash-the-stack.exe` from Linux through
the zig toolchain sigil pins, the same way sigil's own Windows release
artifact is built. First done 2026-09-21 (P4b, ruling D37: a Linux and a
Windows artifact every release). This page is how to build it, how to run it
under Wine on the development box, what broke on the way and where the fix
went, and what nobody has tested yet.

## Build

    scripts/dev sigil build --config windows-amd64

Output: `build/windows-amd64/bin/crash-the-stack.exe` (44 MB, `PE32+
executable for MS Windows 6.00 (console), x86-64`). A `motif.exe` (37 MB,
the tracker package's own entry) lands beside it, as `motif` does beside
the Linux binary in `build/*/bin/`, because motif declares an entry point;
it is not part of the game and a release can leave it out.

The config in `package.sgl` mirrors `release` (native backend, optimize 2,
bundle) with `toolchain: 'zig`, `target: "x86_64-windows-gnu"` and
`features: '(release cross windows)`, and the sigil-desktop dependency's
config gate includes it. Every package in the dependency graph is compiled
with the root config's target (a dependency's `configs:` gate is matched by
the root config's name), so motif, which has no `windows-amd64` config of its
own, cross-compiles too.

Nothing in `manifest.scm` is needed beyond what the Linux build uses: the
Win32 GLFW files, miniaudio's WASAPI backend, stb_vorbis, motif's `render.c`
and the game's `src/c/crash-native.c` compile against the Windows headers
zig ships.

### What the binary needs at run time

`objdump -p` (`guix shell binutils -- objdump -p build/windows-amd64/bin/crash-the-stack.exe | grep 'DLL Name'`):

    KERNEL32.dll  USER32.dll  GDI32.dll  SHELL32.dll  WS2_32.dll
    api-ms-win-crt-{environment,heap,runtime,stdio,string,private,convert,
                    math,utility,filesystem,time,conio,locale}-l1-1-0.dll

All system DLLs. The `api-ms-win-crt-*` set is the Universal C Runtime,
present on Windows 10 and later; Windows 7 and 8.1 need the UCRT update
(KB2999226) or the VC++ redistributable. `WS2_32` is sigil-lib's socket
code, not the game. OpenGL (`opengl32.dll`) and the audio stack
(`ole32`/`mmdevapi` for WASAPI) are loaded by name at run time by
sigil-graphics' GL loader and miniaudio, so they do not appear as imports.

The game reads its assets relative to the current directory (`assets/`),
as on Linux: run it from the build directory or from a directory that
holds `assets/`. Saves: `(crash store)` resolves its directory from
`XDG_DATA_HOME`, then `$HOME/.local/share`, then `.`; real Windows sets
neither variable, so saves land in `.\crash-the-stack\` under the current
directory, and `store-set!` swallows the error when that is not writable
(the game runs, nothing persists). Wine passes the Unix `HOME` through
and hides this. A Windows branch on `%APPDATA%` (or `%LOCALAPPDATA%`)
in `default-root` is the fix; not made here (the brief keeps this task
to the config and new files).

## Running under Wine on the Guix box

Wine 10.0 from Guix (`guix shell wine64`), a fresh prefix (17 s to create),
Gecko and Mono prompts skipped with `WINEDLLOVERRIDES=mscoree,mshtml=`:

    export WINEPREFIX=/tmp/crash-wine WINEDLLOVERRIDES=mscoree,mshtml=
    guix shell wine64 -- wine64 wineboot --init          # once
    cd build/windows-amd64
    guix shell wine64 -- wine64 bin/crash-the-stack.exe --fresh --seed 3

**Use Wine's Wayland driver on sway: `unset DISPLAY` with `WAYLAND_DISPLAY`
set.** With `DISPLAY` set Wine uses its X11 driver through XWayland, and on
this box's layout (both outputs start at x=1920, nothing at the origin) that
driver delivers mouse events at the wrong place or not at all: the window
looks right, keys work, clicks land elsewhere. Under the Wayland driver the
window is a native xdg_shell client and clicks map exactly. Diagnosed with a
60-line Win32 probe, not GLFW: Wine's X11 driver shifts the monitors so the
primary sits at (0,0) but keeps the window at (0,0) too and the pointer in
raw X root coordinates. On a layout with an output at (0,0) the X11 driver
is fine (Xvfb, and a headless sway with one output at the origin, both
measured).

Useful environment: `WINEDEBUG=-all` once it runs (Wine's HID thread prints
`dropping short report` lines for one of the USB devices on the box, and
GLFW's joystick enumeration triggers them); `SIGIL_DESKTOP_VERBOSE=1` prints
the window, framebuffer, content scale and GL version at start;
`PULSE_SINK=worker-null` routes the audio for a silent drive.

### What was measured (2026-09-21, sigil 0.22.2, Wine 10.0, Mesa)

- Window and GL context: `platform=win32 window=1280x800
  framebuffer=1280x800 content-scale=1.00x1.00`, GL 4.5 through WGL on
  XWayland/Xvfb, GL 4.6 through EGL under the Wayland driver. sigil-desktop
  asks for a 4.3 core context on Windows as on Linux; nothing had to change.
- Audio: miniaudio picks WASAPI, Wine maps it to PulseAudio (`winepulse`),
  and `pactl list sink-inputs` shows `application.name =
  "crash-the-stack.exe"`, uncorked, on the session's sink. Two
  `miniaudio WARNING: [WASAPI] Failed to find suitable device format for
  device info retrieval` lines at start are device enumeration only; the
  device opens and plays. David heard the soundtrack and the cues on his
  session. With `PULSE_SINK` pointed at a suspended null sink the same
  lines read `ERROR: Failed to retrieve mix format` and the game runs on
  regardless.
- The three OGG tracks decode (`crash: track spy 3748500`, `groove
  3656291`, `breaker 3628800`): stb_vorbis through sigil-audio's linked
  copy works on Windows.
- STACK: dealt (`--fresh --seed 3`), a tag-typed move (DR + DZ, 144 to 142
  tiles), mouse selection, the pair hint, the ICE counter-hack landing.
  DEFRAG (`--cards`): an ace to its foundation and a pull from the feed by
  mouse. Tracker (`--tune assets/refs/audio/breaker.cts`): motif's
  `render.c` runs. `--bench-probe 5`: 5 deals in 547 ms, 1709 us per
  position (native codegen, no window). Screenshots from the headless
  sway drive are in this directory (`wine-*.png`).
- `[sg][warning] ... GL_UNIFORMBLOCK_NAME_NOT_FOUND_IN_SHADER` for `u_key`
  and `u_rate` at shader creation: `(crash gpu rules)` declares both for
  every field rule and only some rules read them, so the driver's GLSL
  compiler drops the unused one. sokol skips the upload; harmless.

## What is untested

- Real Windows. Everything above is Wine on Linux with Mesa; a Windows GPU
  driver's GLSL compiler, WASAPI on real hardware, the save directory
  (see above), DPI scaling (`content-scale` above 1: GLFW's
  `GLFW_SCALE_FRAMEBUFFER` is on; the framebuffer size equals the client
  size on Win32 and the cursor is scaled the same way), and the console
  subsystem's extra window (the exe is a console app: a console window
  opens beside the game on real Windows; a `-Wl,--subsystem,windows` link
  flag or `FreeConsole()` would hide it) are all unverified.
- Windows 7/8.1 (UCRT api-sets, see above).
- A code-signing story: none. SmartScreen will warn on an unsigned exe.

## Nothing changed outside the game

No fix was needed in sigil-desktop, sigil-graphics, sigil-audio, motif or
the monorepo toolchain for this build to link and run: the Windows link
flags and configs those packages carry (sigil-desktop `-lkernel32 -luser32
-lshell32 -lgdi32`; sigil-graphics and sigil-audio none, everything loaded
at run time) were enough on the first link.
