

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/settings/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/4.BhxDrLrS.js","_app/immutable/chunks/D6hlAfJz.js","_app/immutable/chunks/D_Ou-Ifb.js"];
export const stylesheets = [];
export const fonts = [];
