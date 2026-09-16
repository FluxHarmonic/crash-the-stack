;; Crash The Stack - development environment for the native build.
;; Use with: guix shell -m manifest.scm -- sh -c 'CPATH=$GUIX_ENVIRONMENT/include LIBRARY_PATH=$GUIX_ENVIRONMENT/lib sigil build'
;;
;; sigil-app's sokol_app needs OpenGL and X11 headers; sigil-graphics links
;; libGL. The C compiler itself is the zig pinned by sigil, not from here.

(specifications->manifest
 '("pkg-config"

   ;; Graphics (sokol_gfx + sokol_app on Linux)
   "mesa"           ; OpenGL headers + libGL
   "libx11"
   "libxi"
   "libxcursor"))
