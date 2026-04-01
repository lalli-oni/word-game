<script lang="ts">
  type Props = {
    onclick?: (e: MouseEvent) => void;
    title?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    class?: string;
    children?: any;
    tooltip?: string;
    active?: boolean;
  };

  let { 
    onclick, 
    title, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    loading = false,
    class: className = '', 
    children,
    tooltip,
    active = false
  }: Props = $props();

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 border-transparent",
    danger: "bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white border-b-4 border-emerald-800"
  };

  // Enforce consistent height across sizes
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-xl",
    md: "h-[52px] px-6 text-sm rounded-2xl",
    lg: "h-16 px-8 text-base rounded-[2rem]",
    icon: "h-[52px] w-[52px] rounded-2xl flex-shrink-0"
  };

  let showTooltip = $state(false);
</script>

<div class="relative inline-flex flex-col items-center {className}">
    <button 
      {onclick} 
      {title}
      disabled={disabled || loading}
      class="font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 {variants[variant]} {sizes[size]} {active ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}"
      onmouseenter={() => showTooltip = true}
      onmouseleave={() => showTooltip = false}
    >
      {#if loading}
        <div class="flex items-center justify-center w-full h-full">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      {:else if children}
        {@render children()}
      {/if}
    </button>

    {#if tooltip && showTooltip}
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-950 text-white text-[10px] font-black rounded-lg shadow-2xl whitespace-nowrap z-[100] animate-in fade-in zoom-in duration-100 pointer-events-none border border-slate-800">
            {tooltip}
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
        </div>
    {/if}
</div>
