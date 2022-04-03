#include <mesche.h>
#include <stdio.h>
#include <substratic.h>

int main(int argc, char **argv) {
  VM vm;
  mesche_vm_init(&vm, argc, argv);

  // Set up the compiler's load path relative to the program path
  char cwd[500];
  char *program_path = mesche_process_executable_path();
  char *program_dir = mesche_fs_file_directory(strdup(program_path));

  // Add the main modules path
  char *tmp_path = mesche_cstring_join(program_dir, strlen(program_dir),
#ifdef DEV_BUILD
                                       "/../../modules", 14,
#else
                                       "/modules", 8,
#endif
                                       NULL);

  // Register the main module path
  char *modules_path = mesche_fs_resolve_path(tmp_path);
  printf("Module path: %s\n", modules_path);

  free(tmp_path);
  mesche_vm_load_path_add(&vm, modules_path);

  // Resolve the main file path
  tmp_path = mesche_cstring_join(modules_path, strlen(modules_path),
                                 "/main.msc", 9, NULL);
  char *main_file_path = mesche_fs_resolve_path(tmp_path);

  // Add the Substratic module path for dev builds
#ifdef DEV_BUILD
  tmp_path =
      mesche_cstring_join(program_dir, strlen(program_dir),
                          "/../../deps/substratic/engine/modules", 37, NULL);

  char *subst_modules_path = mesche_fs_resolve_path(tmp_path);
  mesche_vm_load_path_add(&vm, subst_modules_path);
  free(subst_modules_path);
#endif

  // Register core Mesche modules
  mesche_vm_register_core_modules(&vm);

  // Initialize the Substratic library in Mesche
  substratic_library_init(&vm);

  // Evaluate the init script
  mesche_vm_load_file(&vm, main_file_path);

  // Free the VM
  mesche_vm_free(&vm);

  // Free temporary strings
  free(tmp_path);
  free(main_file_path);
  free(modules_path);
  free(program_dir);
  free(program_path);

  return 0;
}
