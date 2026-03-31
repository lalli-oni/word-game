<script lang="ts">
  type Props = {
    onclick?: () => void;
    title?: string;
    class?: string;
    children?: any;
    active?: boolean;
  };

  let { onclick, title, class: className = '', children, active = false }: Props = $props();
</script>

<button 
  {onclick} 
  {title}
  class="text-xl bg-slate-800 hover:bg-slate-700 p-3 rounded-2xl border border-slate-700 shadow-xl transition-all active:scale-95 leading-none flex items-center justify-center relative {active ? 'bg-slate-700 ring-2 ring-blue-500/50' : ''} {className}"
>
  {@render children()}
</button>
