#include <mesche.h>
#include <stdio.h>
#include <substratic.h>

int main(int argc, char **argv) {
  VM vm;
  mesche_vm_init(&vm, argc, argv);

  // TODO: Resolve all paths relative to executable path

  // Set up load paths and load core modules
#ifdef DEV_BUILD
  mesche_vm_load_path_add(&vm, "./deps/substratic/engine/modules");
#else
  mesche_vm_load_path_add(&vm, "./modules");
#endif
  mesche_vm_register_core_modules(&vm);

  // Initialize the Substratic library in Mesche
  substratic_library_init(&vm);

  // Evaluate the init script
/* #ifdef DEV_BUILD */
/*   mesche_vm_load_file(&vm, "../../modules/main.msc"); */
/* #else */
  mesche_vm_load_file(&vm, "./modules/main.msc");
/* #endif */

  // Free the VM and exit
  mesche_vm_free(&vm);
  return 0;
}
