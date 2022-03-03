#ifndef __subst_graphics_h
#define __subst_graphics_h

#define GLFW_INCLUDE_NONE
#include <GLFW/glfw3.h>
#include <cglm/cglm.h>
#include <glad/glad.h>
#include <inttypes.h>
#include <mesche.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

// Graphics ---------------------------------------

typedef struct {
  vec2 screen_size;
  vec2 desired_size;
  mat4 screen_matrix;
  mat4 view_matrix;
} SubstRenderContext;

typedef struct {
  float *width, *height;
  bool is_resizing;
  SubstRenderContext context;
  GLFWwindow *glfwWindow;
} SubstWindow;

typedef enum {
  SubstDrawNone,
  SubstDrawScaled = 1,
  SubstDrawRotated = 2,
  SubstDrawCentered = 4
} SubstDrawFlags;

typedef struct SubstDrawArgs {
  float scale_x, scale_y;
  float rotation;
  uint8_t flags;
  GLuint shader_program;
} SubstDrawArgs;

typedef struct {
  GLenum shader_type;
  const char *shader_text;
} SubstShaderFile;

int subst_graphics_init(void);
void subst_graphics_end(void);

SubstWindow *subst_graphics_window_create(int width, int height,
                                          const char *title);
void subst_graphics_window_show(SubstWindow *window);
void subst_graphics_window_destroy(SubstWindow *window);

void subst_graphics_loop_start(SubstWindow *window, MescheRepl *repl);

void subst_graphics_draw_args_scale(SubstDrawArgs *args, float scale_x,
                                    float scale_y);
void subst_graphics_draw_args_rotate(SubstDrawArgs *args, float rotation);
void subst_graphics_draw_args_center(SubstDrawArgs *args, bool centered);

/* void subst_graphics_draw_texture(SubstRenderContext *context, */
/*                                  SubstTexture *texture, float x, float y); */
/* void subst_graphics_draw_texture_ex(SubstRenderContext *context, */
/*                                     SubstTexture *texture, float x, float y,
 */
/*                                     SubstDrawArgs *args); */

void subst_graphics_draw_rect_fill(SubstRenderContext *context, float x,
                                   float y, float w, float h, vec4 color);

GLuint subst_graphics_shader_compile(const SubstShaderFile *shader_files,
                                     uint32_t shader_count);

Value subst_graphics_window_create_msc(MescheMemory *mem, int arg_count,
                                       Value *args);
Value subst_graphics_window_show_msc(MescheMemory *mem, int arg_count,
                                     Value *args);
Value subst_texture_draw_msc(MescheMemory *mem, int arg_count, Value *args);

Value subst_graphics_window_clear_msc(MescheMemory *mem, int arg_count,
                                      Value *args);
Value subst_graphics_window_swap_buffers_msc(MescheMemory *mem, int arg_count,
                                             Value *args);

Value subst_graphics_window_needs_close_p_msc(MescheMemory *mem, int arg_count,
                                              Value *args);

Value subst_graphics_func_render_to_file(MescheMemory *mem, int arg_count,
                                         Value *args);

// Shaders ---------------------------------------

#define GLSL(src) "#version 330 core\n" #src

#endif
