// /tracker/w/<sha16>/crash-tracker.wasm, from R2. See web/r2-wasm.js.
import { serveWasm } from "../../../web/r2-wasm.js";

export const onRequestGet = (context) => serveWasm(context, "tracker", true);
export const onRequestHead = (context) => serveWasm(context, "tracker", false);
