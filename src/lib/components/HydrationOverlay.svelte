<script lang="ts">
  import { dictionaryService } from '../dictionary.svelte';
  import Button from './Button.svelte';

  let { isPriorityLoaded }: { isPriorityLoaded: boolean } = $props();
</script>

{#if (dictionaryService.status === 'hydrating' && !isPriorityLoaded) || dictionaryService.status === 'error'}
  <div class="fixed inset-0 bg-slate-950/90 z-[200] flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <div class="w-full max-w-xs">
        {#if dictionaryService.status === 'hydrating'}
            <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Preparing the Map</h2>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
                <div class="h-full bg-blue-500 transition-all duration-300" style="width: {dictionaryService.overallProgress}%"></div>
            </div>
            <div class="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>{dictionaryService.overallProgress}%</span><span>Plotting Routes</span></div>
        {:else}
            <h2 class="text-2xl font-black text-red-500 mb-2 uppercase tracking-tighter italic">Map Error</h2>
            <Button onclick={() => location.reload()} variant="secondary" size="sm">RELOAD PAGE</Button>
        {/if}
    </div>
  </div>
{/if}

{#if isPriorityLoaded && dictionaryService.completedBatches < dictionaryService.totalBatches}
    <div class="fixed top-0 left-0 right-0 h-1 z-[300] bg-slate-800">
        <div class="h-full bg-blue-500 transition-all duration-500" style="width: {dictionaryService.overallProgress}%"></div>
    </div>
{/if}
