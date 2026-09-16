;; Crash The Stack - development environment for the native build.
;; Use with scripts/dev, which runs a command as
;;   guix shell -m manifest.scm -- sh -c 'CPATH=$GUIX_ENVIRONMENT/include LIBRARY_PATH=$GUIX_ENVIRONMENT/lib <cmd>'
;; and is the same form .kiln/ci.sgv uses (sigil-graphics' precedent).
;;
;; sigil-app's sokol_app needs <GL/gl.h> and the X11 headers; sigil-graphics
;; links libGL. The C compiler is the zig sigil pins, not anything from here.

(specifications->manifest
 '("pkg-config"

   ;; Graphics (sokol_gfx + sokol_app on Linux)
   "mesa"           ; OpenGL implementation (libGL)
   "libglvnd"       ; OpenGL dispatcher; provides GL/gl.h on modern Guix
   "libx11"
   "libxi"
   "libxcursor"))
