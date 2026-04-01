<script lang="ts">
  type Props = {
    open?: boolean;
    class?: string;
  };
  let { open = false, class: className = '' }: Props = $props();
</script>

<svg 
    viewBox="0 0 24 24" 
    class="w-full h-full drop-shadow-lg {className}"
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
>
    <!-- Base / Bottom of Chest -->
    <path d="M3 10H21V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V10Z" fill="#78350F" stroke="#451A03" stroke-width="1.5"/>
    
    <!-- Metal Bands -->
    <path d="M7 10V20" stroke="#F59E0B" stroke-width="1.5"/>
    <path d="M17 10V20" stroke="#F59E0B" stroke-width="1.5"/>

    {#if open}
        <!-- Open Lid -->
        <path d="M21 10L21 5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V10" fill="#92400E" stroke="#451A03" stroke-width="1.5" class="animate-in slide-in-from-bottom-2 duration-300"/>
        <!-- Inner Glow -->
        <rect x="5" y="10" width="14" height="4" fill="#FDE68A" fill-opacity="0.5"/>
        <circle cx="12" cy="8" r="1" fill="#F59E0B" class="animate-pulse"/>
    {:else}
        <!-- Closed Lid -->
        <path d="M3 10C3 7.79086 4.79086 6 7 6H17C19.2091 6 21 7.79086 21 10H3Z" fill="#92400E" stroke="#451A03" stroke-width="1.5"/>
        <!-- Lock -->
        <rect x="10" y="9" width="4" height="3" rx="1" fill="#F59E0B" stroke="#451A03" stroke-width="1"/>
    {/if}
</svg>
