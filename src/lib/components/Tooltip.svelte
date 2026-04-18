<script lang="ts">
  import { fade, scale } from 'svelte/transition';

  type Props = {
    children?: any;
    title?: string;
    content?: any;
    position?: 'top' | 'bottom';
    class?: string;
    visible?: boolean;
  };

  let { children, title, content, position = 'top', class: className = '', visible = $bindable(false) }: Props = $props();

  let triggerEl = $state<HTMLElement>();
  let tooltipEl = $state<HTMLElement>();
  let coords = $state({ top: 0, left: 0 });
  const tooltipId = `tooltip-${Math.random().toString(36).slice(2,9)}`;

  function updatePosition() {
    if (!triggerEl || !tooltipEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = 0;
    let left = 0;

    if (position === 'top') {
      top = triggerRect.top - tooltipRect.height - 12;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (position === 'bottom') {
      top = triggerRect.bottom + 12;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    }

    // Viewport safety
    const padding = 16;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    coords = { top, left };
  }

  $effect(() => {
    if (visible) {
      setTimeout(updatePosition, 0);
    }
  });
</script>

<div 
  bind:this={triggerEl}
  class={className}
  role="button"
  tabindex="0"
  aria-describedby={tooltipId}
  aria-expanded={visible}
  onmouseenter={() => visible = true}
  onmouseleave={() => visible = false}
  onfocus={() => visible = true}
  onblur={() => visible = false}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { visible = !visible; e.preventDefault(); } if (e.key === 'Escape') visible = false; }}
>
  {@render children?.()}
</div>

{#if visible}
  <div 
    bind:this={tooltipEl}
    id={tooltipId}
    role="tooltip"
    transition:scale={{ duration: 150, start: 0.95 }}
    class="fixed z-[1000] pointer-events-none p-6 bg-slate-900 border-2 border-slate-700 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] min-w-[220px] backdrop-blur-md"
    style="left: {coords.left}px; top: {coords.top}px"
  >
    {#if title}
      <p class="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 border-b border-slate-800 pb-3">{title}</p>
    {/if}
    <div class="text-white text-sm">
        {@render content?.()}
    </div>
    
    <!-- Arrow -->
    <div 
        class="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"
        class:bottom-[-10px]={position === 'top'}
        class:border-t-[10px]={position === 'top'}
        class:border-t-slate-700={position === 'top'}
        class:top-[-10px]={position === 'bottom'}
        class:border-b-[10px]={position === 'bottom'}
        class:border-b-slate-700={position === 'bottom'}
    ></div>
  </div>
{/if}
