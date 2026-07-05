<script lang="ts">
  import { setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { writable } from 'svelte/store';
  import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext } from './button-group-context';

  let { children, class: className = '' }: { children: Snippet; class?: string } = $props();

  const members = writable<symbol[]>([]);

  const context: ButtonGroupContext = {
    members,
    register: () => {
      const memberId = Symbol('button-group-member');
      members.update((current) => [...current, memberId]);
      return memberId;
    },
    unregister: (memberId) => {
      members.update((current) => current.filter((id) => id !== memberId));
    }
  };

  setContext(BUTTON_GROUP_CONTEXT, context);
</script>

<div class="button-group {className}">
  {@render children()}
</div>

<style lang="postcss">
  @reference "../../app.css";

  .button-group {
    @apply flex items-stretch h-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden;
  }
</style>
