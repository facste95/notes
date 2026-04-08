import { c as create_ssr_component, a as subscribe } from "../../../../chunks/ssr.js";
import { p as page } from "../../../../chunks/stores.js";
import "../../../../chunks/db.js";
import "@tiptap/starter-kit";
import "../../../../chunks/ui.js";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return `${`<div class="not-found" style="padding: 2rem; color: #888;" data-svelte-h="svelte-ee9i14">Nota non trovata.</div>`}`;
});
export {
  Page as default
};
