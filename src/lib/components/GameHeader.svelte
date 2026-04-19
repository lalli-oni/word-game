<script lang="ts">
  import Tutorial from './dialogs/Tutorial.svelte';
  let tutorialOpen = false;

  import { game } from '../game.svelte';
  import { shareResult } from '../social';
  import { getObscurityColor, getObscurityLabel } from '../word-utils';
  import Button from './Button.svelte';
  import HowToPlay from './dialogs/HowToPlay.svelte';

  interface Props {
    onOpenLevels: () => void;
    onOpenSettings: () => void;
    onConfirmWand: () => void;
    onConfirmNewJourney: () => void;
    showRandomConfig: boolean;
    onToggleRandomConfig: (val: boolean) => void;
    isGameOver: boolean;
  }

  let { 
    onOpenLevels,
    onOpenSettings,
    onConfirmWand,
    onConfirmNewJourney,
    showRandomConfig,
    onToggleRandomConfig,
    isGameOver
  }: Props = $props();


  import HintButton from './HintButton.svelte';
  const HintControl = HintButton;

  let showSharedToast = $state(false);
  let showHowTo = $state(false);

  function confirmSolve(cb: () => void) {
    if (confirm('Reveal full solution? This cannot be undone for this run.')) cb();
  }
</script>

<header class="game-header">
  <div class="brand-container animate-in fade-in zoom-in duration-700">
      <div class="logo-row">
        <span class="logo-word">WORD</span>
        <div class="logo-divider"></div>
      </div>
      <span class="logo-journey">JOURNEY</span>
  </div>

  <div class="controls-row">
    <div class="button-group">
      <Button variant="secondary" size="icon" onclick={onOpenLevels} tooltip="Choose Journey" disabled={game.isGenerating || game.isSolving} class="h-full"><span>🗺️</span></Button>
      <Button variant="secondary" size="icon" onclick={() => { game.suggestedByWand = true; onConfirmWand(); }} loading={game.isSolving} tooltip="Magic Path" disabled={game.isGenerating || game.isGameOver} class="h-full"><span>🪄</span></Button>
      <svelte:component this={HintControl} showSolveConfirm={(cb) => confirmSolve(cb)} />
      <Button variant="secondary" size="icon" onclick={() => showHowTo = true} tooltip="How to Play" class="h-full"><span>❓</span></Button>

      
      <!-- make trigger keyboard accessible: use a button for the toggle and expose aria attributes -->
      <div class="random-config-wrapper group">
          <div class="random-trigger" class:is-expanded={showRandomConfig}>
              <button onclick={onConfirmNewJourney} disabled={game.isGenerating || game.isSolving} class="random-btn" aria-haspopup="true" aria-expanded={showRandomConfig}>
                {#if game.isGenerating}
                  <svg class="spinner" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {:else}
                  <span class="dice-icon">🎲</span><span class="word-len">{game.randomWordLength}</span>
                {/if}
              </button>
              <div class="chevron-box"><svg class="chevron" class:is-rotated={showRandomConfig} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg></div>
          </div>
          {#if showRandomConfig}
            <div class="dropdown-panel animate-in slide-in-from-top-4 duration-300">
              <div class="dropdown-content">
                <div class="slider-group">
                  <div class="slider-label"><span>Length</span><span class="slider-val text-blue-400">{game.randomWordLength}</span></div>
                  <input type="range" min="3" max="12" bind:value={game.randomWordLength} class="slider accent-blue-500" />
                </div>
                <div class="slider-group">
                  <div class="slider-label"><span>Obscurity</span><span class="slider-val {getObscurityColor(game.randomMaxObscurity)}">{getObscurityLabel(game.randomMaxObscurity)}</span></div>
                  <input type="range" min="0" max="10" bind:value={game.randomMaxObscurity} class="slider accent-purple-500" />
                </div>
              </div>
            </div>
          {/if}
      </div>
      <Button variant="secondary" size="icon" onclick={onOpenSettings} tooltip="Settings" disabled={game.isGenerating || game.isSolving} class="h-full"><span>⚙️</span></Button>
    </div>
    
    <div class="score-display">
      {#if game.isGameOver}
          <Button
            variant="success"
            onclick={() => {
              shareResult(game);
              showSharedToast = true;
              setTimeout(() => showSharedToast = false, 3000);
            }}
            class="w-full uppercase tracking-widest font-black italic"
          >
            SHARE YOUR JOURNEY
          </Button>
      {/if}
      <div class="score-value">{game.score}</div>
      <span class="trophy">🏆</span>
    </div>
  </div>

  {#if showSharedToast}<div class="toast-shared animate-in slide-in-from-top-4 duration-300">Copied to Clipboard!</div>{/if}
  <HowToPlay show={showHowTo} onClose={() => showHowTo = false} />
</header>

<style lang="postcss">
  @reference "../../app.css";

  .game-header {
    @apply flex-none w-full max-w-lg pt-8 pb-4 px-4 mx-auto;
  }

  .brand-container {
    @apply flex flex-col items-center mb-6;
  }

  .logo-row {
    @apply flex items-center gap-2;
  }

  .logo-word {
    @apply text-4xl md:text-5xl font-black bg-white text-slate-900 px-3 py-1 rounded-2xl transform -rotate-3 shadow-[4px_4px_0px_#3b82f6] border-2 border-slate-900 border-b-4 border-r-4 uppercase leading-none;
  }

  .logo-divider {
    @apply w-10 h-0.5 border-t-4 border-dashed border-slate-700 self-end mb-3;
  }

  .logo-journey {
    @apply text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 transform rotate-2 -mt-2 drop-shadow-2xl uppercase leading-none;
  }

  .controls-row {
    @apply flex justify-between items-center px-4 h-[52px];
  }

  .button-group {
    @apply flex gap-2 h-full items-center;
  }

  .random-config-wrapper {
    @apply relative flex flex-col items-center h-full;
  }

  .random-trigger {
    @apply relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 shadow-xl h-full z-20 transition-all overflow-hidden;
  }

  .random-trigger.is-expanded {
    @apply rounded-b-none;
  }

  .random-btn {
    @apply flex items-center gap-2 text-xs font-black bg-blue-600 hover:bg-blue-500 h-full px-4 transition-all active:scale-95 leading-none border-r border-blue-700 shrink-0 text-white disabled:opacity-50;
  }

  .chevron-box {
    @apply px-2 h-full flex items-center text-slate-500;
  }

  .chevron {
    @apply w-4 h-4 transform transition-transform duration-300;
  }

  .chevron.is-rotated {
    @apply rotate-180;
  }

  .dropdown-panel {
    @apply absolute top-[48px] left-0 right-0 p-6 pt-10 bg-slate-800 border-2 border-t-0 border-slate-700 rounded-b-[2rem] shadow-2xl z-10 w-64 origin-top backdrop-blur-md;
  }

  .slider-group {
    @apply space-y-3 text-left mb-6 last:mb-0;
  }

  .slider-label {
    @apply flex justify-between items-end text-slate-400 text-[10px] font-black uppercase tracking-widest;
  }

  .slider-val {
    @apply text-2xl font-black leading-none;
  }

  .slider {
    @apply w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer;
  }

  .score-display {
    @apply flex items-center gap-3 pr-2;
  }

  .score-value {
    @apply text-4xl font-black text-white italic tracking-tighter;
  }

  .trophy {
    @apply text-3xl filter drop-shadow-lg;
  }

  .spinner {
    @apply animate-spin h-4 w-4;
  }
</style>
