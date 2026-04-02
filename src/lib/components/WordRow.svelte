<script lang="ts">
  type Props = {
    // Snippets for flexible content
    spine?: import('svelte').Snippet;
    card?: import('svelte').Snippet;
    side?: import('svelte').Snippet;
    class?: string;
  };

  let { 
    spine,
    card,
    side,
    class: className = ''
  }: Props = $props();
</script>

<div class="flex items-center gap-3 w-full group/row {className}">
    <!-- 1. LEFT INDICATOR (SPINE) -->
    <div class="w-12 shrink-0 flex items-center justify-center h-16 relative">
        {#if spine}
            {@render spine()}
        {/if}
    </div>

    <!-- 2. CENTER CONTENT (CARD) -->
    <div class="flex-1 min-w-0">
        {#if card}
            {@render card()}
        {/if}
    </div>

    <!-- 3. RIGHT CONTENT (SCORE/SIDE) -->
    <div class="w-12 shrink-0 flex items-center justify-center h-16">
        {#if side}
            {@render side()}
        {/if}
    </div>
</div>
