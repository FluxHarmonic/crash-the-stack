#include <mesche.h>
#include <stdio.h>

#include "crash/graphics.h"
#include "crash/texture.h"

int main(int argc, char **argv) {
  VM vm;
  mesche_vm_init(&vm, argc, argv);

  // Set up load paths and load core modules
  mesche_vm_load_path_add(&vm, "./compiler/modules/");
  mesche_vm_load_path_add(&vm, "./src/");
  mesche_vm_register_core_modules(&vm);

  // Register some API functions with Mesche
  ObjectModule *module =
      mesche_module_resolve_by_name_string(&vm, "substratic graphics");
  mesche_vm_define_native(&vm, module, "window-create",
                          subst_graphics_window_create_msc, true);
  mesche_vm_define_native(&vm, module, "window-show",
                          subst_graphics_window_show_msc, true);
  mesche_vm_define_native(&vm, module, "window-needs-close?",
                          subst_graphics_window_needs_close_p_msc, true);
  mesche_vm_define_native(&vm, module, "window-clear",
                          subst_graphics_window_clear_msc, true);
  mesche_vm_define_native(&vm, module, "window-swap-buffers",
                          subst_graphics_window_swap_buffers_msc, true);
  mesche_vm_define_native(&vm, module, "texture-load-internal",
                          subst_texture_load_msc, true);
  mesche_vm_define_native(&vm, module, "texture-draw", subst_texture_draw_msc,
                          true);

  // Evaluate the init script
  mesche_vm_load_file(&vm, "src/main.msc");

  // Report the final memory allocation statistics
  /* mesche_mem_report((MescheMemory *)&vm); */

  // Write out a final newline for now
  printf("\n");

  // Free the VM and exit
  mesche_vm_free(&vm);
  return 0;
}
