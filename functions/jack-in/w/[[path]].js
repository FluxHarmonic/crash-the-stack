// /jack-in/w/<sha16>/crash-the-stack.wasm, from R2. See web/r2-wasm.js for why
// the wasm is not a file in the deploy and why it must be same-origin.
import { serveWasm } from "../../../web/r2-wasm.js";

export const onRequestGet = (context) => serveWasm(context, "jack-in", true);
export const onRequestHead = (context) => serveWasm(context, "jack-in", false);
