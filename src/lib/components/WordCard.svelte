<script lang="ts" generics="T extends 'input' | JourneyStep['type']">
  import type { JourneyStep, OriginStep, WaypointStep, DestinationStep, ValidationResult, ActionType } from '../types';
  import WordInput from './WordInput.svelte';

  type InputData = {
    validation: ValidationResult;
    hasErrors: boolean;
    isShaking?: boolean;
    oninput: () => void;
    onsubmit: (e: Event) => void;
    characterClasses: (char: string, index: number) => string;
  };

  type StepDataMap = {
    origin: OriginStep;
    waypoint: WaypointStep;
    destination: DestinationStep;
    input: InputData;
  };

  interface Props {
    type: T;
    data: StepDataMap[T];
    value?: string;
    previousWord?: string;
    flash?: boolean;
  }

  let { type, data, value = $bindable(''), previousWord, flash = false }: Props = $props();

  const actionUnderlines: Record<ActionType, string> = {
    morph: 'decoration-blue-500',
    anagram: 'decoration-pink-500',
    synonym: 'decoration-purple-500',
    antonym: 'decoration-orange-500'
  };
</script>

{#if type === 'input'}
  {@const d = data as InputData}
  <WordInput 
    bind:value={value} 
    validation={d.validation} 
    hasErrors={d.hasErrors} 
    oninput={d.oninput} 
    onsubmit={d.onsubmit} 
    characterClasses={d.characterClasses} 
  />
{:else}
  <div class="word-card variant-{type} {flash ? 'is-flashing' : ''}" 
       class:is-reached={type === 'destination' && (data as DestinationStep).isReached}
       style={type === 'waypoint' ? `--action-color: var(--color-${(data as WaypointStep).action === 'morph' ? 'blue' : (data as WaypointStep).action === 'anagram' ? 'pink' : (data as WaypointStep).action === 'synonym' ? 'purple' : 'orange'}-500)` : ''}
  >
    {#if type === 'origin'}
      {@const d = data as OriginStep}
      <span class="word-text">{d.word}</span>
    {:else if type === 'waypoint'}
      {@const d = data as WaypointStep}
      <div class="word-text">
          {#if previousWord && previousWord.length === d.word.length}
            {#each d.word.split('') as char, i}
                <span class={char !== previousWord[i] ? `action-underline underline-${d.action}` : ''}>
                    {char}
                </span>
            {/each}
          {:else}
            <span class="action-underline underline-{d.action}">
                {d.word}
            </span>
          {/if}
      </div>
    {:else if type === 'destination'}
      {@const d = data as DestinationStep}
      <span class="word-text">{d.word}</span>
      <div class="goal-dot" class:is-reached={d.isReached}></div>
    {/if}
  </div>
{/if}

<style lang="postcss">
  @reference "../../app.css";

  .word-card {
    @apply relative rounded-2xl border-2 transition-all duration-300 flex items-center justify-start px-6 shadow-xl w-full min-w-[200px] h-[60px];
  }

  .word-text {
    @apply font-mono text-2xl font-black uppercase tracking-[0.1em] text-white pointer-events-none;
  }

  .variant-origin {
    @apply border-slate-700/60 bg-slate-800/40;
  }

  .variant-waypoint {
    @apply border-slate-500/30 bg-slate-500/10;
    border-color: color-mix(in srgb, var(--action-color) 30%, transparent);
    background-color: color-mix(in srgb, var(--action-color) 10%, transparent);
  }

  .variant-destination {
    @apply border-slate-700/60 bg-slate-800/40 opacity-100;
  }

  .variant-destination .word-text {
    @apply text-white;
  }

  .variant-destination.is-reached {
    @apply border-emerald-500/30 bg-emerald-500/5;
  }

  .variant-destination.is-reached .word-text {
    @apply text-white;
  }

  .is-flashing {
    @apply animate-pulse ring-4 ring-blue-500/20;
  }

  .action-underline {
    @apply underline underline-offset-8 decoration-4;
  }

  .underline-morph { @apply decoration-blue-500; }
  .underline-anagram { @apply decoration-pink-500; }
  .underline-synonym { @apply decoration-purple-500; }
  .underline-antonym { @apply decoration-orange-500; }

  .goal-dot {
    @apply absolute right-4 w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-20 transition-all duration-500;
  }

  .goal-dot.is-reached {
    @apply opacity-100 shadow-[0_0_10px_rgba(52,211,153,0.8)];
  }
</style>
