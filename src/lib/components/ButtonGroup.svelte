<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="button-group {className}">
  {@render children()}
</div>

<style lang="postcss">
  @reference "../../app.css";

  .button-group {
    @apply flex items-stretch h-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl;
  }

  /* Wrapper div: stretch to full inner height of the group */
  .button-group :global(> div) {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    height: 100%;
  }

  /* Button: fill the wrapper height instead of using a fixed pixel value */
  .button-group :global(> div > button) {
    flex: 1;
    border-radius: 0;
    border: none;
    border-right: 1px solid var(--color-slate-700);
    box-shadow: none;
  }

  /* No trailing divider on the last item */
  .button-group :global(> div:last-child > button) {
    border-right: none;
  }

  /* Round the group's outer corners on first/last buttons */
  .button-group :global(> div:first-child > button) {
    border-top-left-radius: var(--radius-2xl);
    border-bottom-left-radius: var(--radius-2xl);
  }

  .button-group :global(> div:last-child > button) {
    border-top-right-radius: var(--radius-2xl);
    border-bottom-right-radius: var(--radius-2xl);
  }
</style>
