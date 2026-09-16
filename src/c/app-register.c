/*
 * app-register.c - register sigil-graphics' C module in the web build.
 *
 * The wasm runtime calls the weak sigil_wasm_app_register hook after the
 * browser bridges are installed. The generated native entry initialises the
 * Sigil modules but not the C module behind (sigil graphics), so without this
 * hook %gfx-setup and friends are unbound and the sokol code is dead-stripped.
 * Native builds never compile this file (package.sgl gates it on wasm targets).
 */
#include <sigil/sigil.h>

extern void sigil__init_sigil_graphics_module(SigilVM *vm);

void sigil_wasm_app_register(SigilVM *vm)
{
    sigil__init_sigil_graphics_module(vm);
}
