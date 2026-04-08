import { w as writable } from "./index.js";
typeof navigator !== "undefined" ? navigator.language?.startsWith("it") ? "it" : "en" : "it";
const theme = writable("light");
const sidebarOpen = writable(true);
export {
  sidebarOpen as s,
  theme as t
};
