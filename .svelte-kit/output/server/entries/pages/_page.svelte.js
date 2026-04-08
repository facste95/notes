import { c as create_ssr_component } from "../../chunks/ssr.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import "../../chunks/db.js";
const css = {
  code: ".empty-state.svelte-1qgiadx{display:flex;align-items:center;justify-content:center;height:100%;color:#888;font-style:italic}",
  map: `{"version":3,"file":"+page.svelte","sources":["+page.svelte"],"sourcesContent":["<script>\\n  import { onMount } from 'svelte';\\n  import { goto } from '$app/navigation';\\n  import { db } from '$lib/db.js';\\n\\n  onMount(async () => {\\n    const onboarding = await db.prefs.get('onboardingCompleted');\\n    if (!onboarding) {\\n      // Onboarding will be shown as overlay in layout (Task 16)\\n      return;\\n    }\\n\\n    const lastPref = await db.prefs.get('lastOpenedNoteId');\\n    if (lastPref?.value) {\\n      const note = await db.notes.get(lastPref.value);\\n      if (note) {\\n        goto(\`/note/\${note.id}\`);\\n        return;\\n      }\\n    }\\n\\n    const firstNote = await db.notes.orderBy('updatedAt').last();\\n    if (firstNote) {\\n      goto(\`/note/\${firstNote.id}\`);\\n    }\\n  });\\n<\/script>\\n\\n<div class=\\"empty-state\\">\\n  <p>Nessuna nota. Creane una dalla sidebar.</p>\\n</div>\\n\\n<style>\\n  .empty-state {\\n    display: flex;\\n    align-items: center;\\n    justify-content: center;\\n    height: 100%;\\n    color: #888;\\n    font-style: italic;\\n  }\\n</style>\\n"],"names":[],"mappings":"AAiCE,2BAAa,CACX,OAAO,CAAE,IAAI,CACb,WAAW,CAAE,MAAM,CACnB,eAAe,CAAE,MAAM,CACvB,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,CACX,UAAU,CAAE,MACd"}`
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="empty-state svelte-1qgiadx" data-svelte-h="svelte-1v3dddu"><p>Nessuna nota. Creane una dalla sidebar.</p> </div>`;
});
export {
  Page as default
};
