import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    console.log(`[Svelte Warning] ${warning.code}: ${warning.message}`);
    
    // Promote specific fixed warnings to errors
    if (warning.code === 'non_reactive_update' || warning.code === 'non-reactive-update') {
      throw new Error(warning.message);
    }

    // List of warnings we specifically want to allow for now
    const allowedWarnings = [
      'a11y_no_static_element_interactions',
      'a11y-no-static-element-interactions',
      'a11y_autofocus',
      'a11y-autofocus'
    ];

    if (allowedWarnings.includes(warning.code)) {
      handler(warning);
      return;
    }

    // Optional: treat everything else as error if you want to be strict
    // throw new Error(`[UNEXPECTED WARNING] ${warning.code}: ${warning.message}`);
    
    handler(warning);
  }
}
