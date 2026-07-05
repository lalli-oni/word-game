<script lang="ts">
  import { getContext, onDestroy, onMount } from 'svelte';
  import Spinner from './Spinner.svelte';
  import { BUTTON_GROUP_CONTEXT, type ButtonGroupContext } from './button-group-context';
  import { BUTTON_VARIANT_COLORS } from './button-variants';

  type Props = {
    onclick?: (e: MouseEvent) => void;
    title?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
    disabled?: boolean;
    loading?: boolean;
    class?: string;
    fill?: boolean;
    children?: any;
    tooltip?: string;
    tooltipPosition?: 'top' | 'bottom' | 'auto';
    active?: boolean;
    'aria-label'?: string;
  };

  let { 
    onclick, 
    title, 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    loading = false,
    class: className = '', 
    fill = false,
    children,
    tooltip,
    tooltipPosition = 'auto',
    active = false,
    'aria-label': ariaLabel
  }: Props = $props();

  const variants = {
    primary: `${BUTTON_VARIANT_COLORS.primary} border-b-4 border-blue-800`,
    secondary: `${BUTTON_VARIANT_COLORS.secondary} border border-slate-700`,
    ghost: `${BUTTON_VARIANT_COLORS.ghost} border-transparent`,
    danger: `${BUTTON_VARIANT_COLORS.danger} border-b-4 border-red-800`,
    success: `${BUTTON_VARIANT_COLORS.success} border-b-4 border-emerald-800`
  };

  // Enforce consistent height across sizes
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-xl",
    md: "h-[var(--spacing-control)] px-6 text-sm rounded-2xl",
    lg: "h-16 px-8 text-base rounded-[2rem]",
    icon: "h-[var(--spacing-control)] w-[var(--spacing-control)] rounded-2xl flex-shrink-0",
    "icon-sm": "h-10 w-10 rounded-2xl flex-shrink-0"
  };

  const groupedSizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-[var(--spacing-control)] px-6 text-sm",
    lg: "h-16 px-8 text-base",
    icon: "h-[var(--spacing-control)] w-[var(--spacing-control)] flex-shrink-0",
    "icon-sm": "h-10 w-10 flex-shrink-0"
  };

  let showTooltip = $state(false);
  let triggerEl = $state<HTMLButtonElement>();
  let tooltipEl = $state<HTMLDivElement>();
  let tooltipCoords = $state({ top: 0, left: 0 });
  let tooltipSide = $state<'top' | 'bottom'>('top');
  const buttonGroup = getContext<ButtonGroupContext | null>(BUTTON_GROUP_CONTEXT);
  let groupMemberId = $state<symbol | null>(null);

  onMount(() => {
    if (!buttonGroup) return;

    groupMemberId = buttonGroup.register();

    return () => {
      if (groupMemberId) {
        buttonGroup.unregister(groupMemberId);
      }
    };
  });

  const groupedMembers = buttonGroup?.members;

  function getGroupPosition(memberIds: symbol[], memberId: symbol) {
    const index = memberIds.indexOf(memberId);

    if (index === -1) return null;
    if (memberIds.length === 1) return 'only';
    if (index === 0) return 'first';
    if (index === memberIds.length - 1) return 'last';

    return 'middle';
  }

  const groupPosition = $derived(
    buttonGroup && groupedMembers && groupMemberId
      ? getGroupPosition($groupedMembers ?? [], groupMemberId)
      : null
  );

  const sizeClass = $derived(buttonGroup ? groupedSizes[size] : sizes[size]);

  function updateTooltipPosition() {
    if (!triggerEl || !tooltipEl) return;

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const padding = 16;

    const preferredTop = triggerRect.top - tooltipRect.height - 12;
    const preferredBottom = triggerRect.bottom + 12;
    const fitsTop = preferredTop >= padding;
    const fitsBottom = preferredBottom + tooltipRect.height <= window.innerHeight - padding;
    const placeAbove = tooltipPosition === 'top'
      ? true
      : tooltipPosition === 'bottom'
        ? false
        : fitsTop || !fitsBottom;

    tooltipSide = placeAbove ? 'top' : 'bottom';

    const top = placeAbove ? preferredTop : preferredBottom;
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    tooltipCoords = {
      top: Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding)),
      left
    };
  }

  let cleanup: (() => void) | null = null;

  onMount(() => {
    const update = () => {
      if (showTooltip) {
        requestAnimationFrame(updateTooltipPosition);
      }
    };

    const handleWindowChange = () => {
      update();
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    cleanup = () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };

    return cleanup;
  });

  onDestroy(() => {
    cleanup?.();
  });
</script>

<div class="relative inline-flex flex-col items-center {fill ? 'h-full' : ''} {className}">
    <button 
      bind:this={triggerEl}
      {onclick} 
      {title}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      class="font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 {variants[variant]} {sizeClass} {fill ? 'h-full' : ''} {buttonGroup ? 'rounded-none shadow-none border-none flex-1' : ''} {(groupPosition === 'first' || groupPosition === 'middle') && buttonGroup ? 'border-r border-slate-700' : ''} {active ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}"
      onmouseenter={() => {
        showTooltip = true;
        requestAnimationFrame(updateTooltipPosition);
      }}
      onmouseleave={() => showTooltip = false}
      onfocus={() => {
        showTooltip = true;
        requestAnimationFrame(updateTooltipPosition);
      }}
      onblur={() => showTooltip = false}
    >
      {#if loading}
        <div class="flex items-center justify-center w-full h-full">
            <Spinner />
        </div>
      {:else if children}
        {@render children()}
      {/if}
    </button>

    {#if tooltip && showTooltip}
        <div
          bind:this={tooltipEl}
          class="fixed px-3 py-1.5 bg-slate-950 text-white text-[10px] font-black rounded-lg shadow-2xl whitespace-nowrap z-[1000] animate-in fade-in zoom-in duration-100 pointer-events-none border border-slate-800"
          style="left: {tooltipCoords.left}px; top: {tooltipCoords.top}px"
        >
            {tooltip}
            <div
              class="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-transparent"
              class:bottom-[-8px]={tooltipSide === 'top'}
              class:border-t-4={tooltipSide === 'top'}
              class:border-t-slate-950={tooltipSide === 'top'}
              class:top-[-8px]={tooltipSide === 'bottom'}
              class:border-b-4={tooltipSide === 'bottom'}
              class:border-b-slate-950={tooltipSide === 'bottom'}
            ></div>
        </div>
    {/if}
</div>
