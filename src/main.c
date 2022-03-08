#include <mesche.h>
#include <stdio.h>

#include "substratic/renderer.h"
#include "substratic/texture.h"
#include "substratic/window.h"

int main(int argc, char **argv) {
  VM vm;
  mesche_vm_init(&vm, argc, argv);

  // Set up load paths and load core modules
  mesche_vm_load_path_add(&vm, "./compiler/modules/");
  mesche_vm_load_path_add(&vm, "./src/");
  mesche_vm_register_core_modules(&vm);

  // Initialize Substratic modules in Mesche
  subst_window_module_init(&vm);
  subst_texture_module_init(&vm);
  subst_renderer_module_init(&vm);

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
