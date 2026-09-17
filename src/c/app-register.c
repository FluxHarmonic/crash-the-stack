/*
 * app-register.c - register sigil-graphics' C module in the web build.
 *
 * The wasm runtime calls the weak sigil_wasm_app_register hook after the
 * browser bridges are installed. The generated native entry initializes the
 * Sigil modules but not the C module behind (sigil graphics), so without this
 * hook %gfx-setup and friends are unbound and the sokol code is dead-stripped.
 * Native builds never compile this file (package.sgl gates it on wasm targets).
 *
 * This should not be an app's job: sigil-build knows every dependency
 * library's native-init and could emit these calls in the entry it already
 * generates (web-native-entry.c). Recorded as an upstream candidate in the
 * P0b evidence note; until then every web app that uses a C-backed package
 * carries a file like this one (Cinder's web-game has the same).
 */
#include <sigil/sigil.h>

extern void sigil__init_sigil_graphics_module(SigilVM *vm);

void sigil_wasm_app_register(SigilVM *vm)
{
    sigil__init_sigil_graphics_module(vm);
}
