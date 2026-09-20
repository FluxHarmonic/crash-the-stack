;; Crash The Stack - development environment for both builds.
;; Use with scripts/dev, which runs a command as
;;   guix shell -m manifest.scm -- sh -c 'CPATH=$GUIX_ENVIRONMENT/include LIBRARY_PATH=$GUIX_ENVIRONMENT/lib <cmd>'
;; and is the same form .kiln/ci.sgv uses (sigil-graphics' precedent).
;;
;; Build side: sigil-desktop's vendored GLFW compiles against the X11 and
;; Wayland headers (it links none of them); no GL headers are needed
;; anywhere (sigil-graphics loads GL through sigil-desktop at run time),
;; and nothing audio-related (sigil-audio's miniaudio loads its backend
;; at run time). The C compiler is the zig sigil pins, not anything here.
;;
;; Run side, for scripts/dev ./build/release/bin/crash-the-stack and the
;; native arms: mesa (libGL, libEGL, llvmpipe), the X libraries GLFW
;; dlopens under Xvfb, wayland + libxkbcommon for a Wayland compositor, and
;; pulseaudio (libpulse, the first backend miniaudio tries; pipewire-pulse
;; serves it and PULSE_SINK routes it). The game's resolver finds them in
;; $GUIX_ENVIRONMENT/lib, so no LD_LIBRARY_PATH is needed. libglvnd must
;; NOT be here: Guix's mesa is built without it and a vendorless
;; libGLX.so.0 breaks GLFW's GLX ("No GLXFBConfigs returned").
;;
;; binaryen supplies wasm-opt for the web build; without it the build still
;; exits 0 and silently skips the asyncify/optimize pass.

(specifications->manifest
 '("pkg-config"

   ;; GLFW compile-time headers (sigil-desktop)
   "libx11" "libxcursor" "libxrandr" "libxinerama" "libxi" "libxext" "xorgproto"
   "wayland" "libxkbcommon"

   ;; Run time: GL, the X libraries GLFW loads, the audio backend
   "mesa"
   "libxrender"
   "pulseaudio"

   ;; Web build
   "binaryen"))     ; wasm-opt
