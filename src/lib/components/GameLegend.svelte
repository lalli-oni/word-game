<script lang="ts">
  import Tooltip from './Tooltip.svelte';
  import HowToPlay from './dialogs/HowToPlay.svelte';

  let showHowTo = $state(false);

  const legendItems = [
    { label: 'Morph', color: 'bg-blue-500', tip: 'Change exactly one letter.', examples: ['C<u class="decoration-blue-500 decoration-2">A</u>T ➔ C<u class="decoration-blue-500 decoration-2">O</u>T', 'F<u class="decoration-blue-500 decoration-2">I</u>RE ➔ F<u class="decoration-blue-500 decoration-2">A</u>RE', 'B<u class="decoration-blue-500 decoration-2">E</u>AR ➔ B<u class="decoration-blue-500 decoration-2">O</u>AR'] },
    { label: 'Anagram', color: 'bg-pink-500', tip: 'Rearrange the existing letters.', examples: ['<u class="decoration-pink-500 decoration-2">ARC</u> ➔ <u class="decoration-pink-500 decoration-2">CAR</u>', '<u class="decoration-pink-500 decoration-2">EAR</u> ➔ <u class="decoration-pink-500 decoration-2">ARE</u>', '<u class="decoration-pink-500 decoration-2">DIRE</u> ➔ <u class="decoration-pink-500 decoration-2">RIDE</u>'] },
    { label: 'Synonym', color: 'bg-purple-500', tip: 'A word with a similar meaning.', examples: ['<u class="decoration-purple-500 decoration-2">HAPPY</u> ➔ <u class="decoration-purple-500 decoration-2">GLAD</u>', '<u class="decoration-purple-500 decoration-2">SMALL</u> ➔ <u class="decoration-purple-500 decoration-2">TINY</u>', '<u class="decoration-purple-500 decoration-2">FAST</u> ➔ <u class="decoration-purple-500 decoration-2">QUICK</u>'] },
    { label: 'Antonym', color: 'bg-orange-500', tip: 'A word with the opposite meaning.', examples: ['<u class="decoration-orange-500 decoration-2">COLD</u> ➔ <u class="decoration-orange-500 decoration-2">HOT</u>', '<u class="decoration-orange-500 decoration-2">LOVE</u> ➔ <u class="decoration-orange-500 decoration-2">HATE</u>', '<u class="decoration-orange-500 decoration-2">DARK</u> ➔ <u class="decoration-orange-500 decoration-2">LIGHT</u>'] }
  ];
</script>

<section class="flex-none w-full max-w-lg px-8 pt-2 pb-3">
  <div class="flex items-end justify-between gap-4 text-center text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">
    <button
      onclick={() => showHowTo = true}
      class="group flex flex-col items-center cursor-pointer hover:text-slate-300 transition-colors"
      aria-label="How to Play"
    >
      <span class="text-base leading-none mb-2 opacity-60 group-hover:opacity-100 transition-opacity">❓</span>
      <span class="group-hover:text-slate-300 transition-colors">Rules</span>
    </button>

    {#each legendItems as item}
      <Tooltip title={item.tip} position="bottom" class="flex-1 flex flex-col items-center">
          {#snippet children()}<div class="group relative flex flex-col items-center cursor-help w-full"><div class="w-full h-1.5 {item.color} rounded-full mb-2 opacity-60 group-hover:opacity-100 transition-all group-hover:scale-y-150 shadow-sm"></div><span class="group-hover:text-slate-300 transition-colors">{item.label}</span></div>{/snippet}
          {#snippet content()}<div class="bg-slate-950/50 p-4 rounded-3xl font-mono text-sm space-y-3 min-w-60">{#each item.examples as ex}<div class="text-white border-b border-slate-800 last:border-0 pb-2 last:pb-0"><span>{@html ex}</span></div>{/each}</div>{/snippet}
      </Tooltip>
    {/each}
  </div>
</section>

<HowToPlay show={showHowTo} onClose={() => showHowTo = false} />
