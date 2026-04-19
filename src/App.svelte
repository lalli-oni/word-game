<script lang="ts">
  import './app.css';
  
  import { game } from './lib/game.svelte';
  import { dictionaryService } from './lib/dictionary.svelte';
  import type { ValidationResult, ActionType } from './lib/types';
  
  // Components
  import GameHeader from './lib/components/GameHeader.svelte';
  import GameLegend from './lib/components/GameLegend.svelte';
  import HydrationOverlay from './lib/components/HydrationOverlay.svelte';
  import PathStep from './lib/components/PathStep.svelte';
  import WordCard from './lib/components/WordCard.svelte';
  import Tooltip from './lib/components/Tooltip.svelte';
  import Button from './lib/components/Button.svelte';
  
  // Dialogs
  import JourneyDialog from './lib/components/dialogs/JourneyDialog.svelte';
  import SettingsDialog from './lib/components/dialogs/SettingsDialog.svelte';
  import ConfirmDialog from './lib/components/dialogs/ConfirmDialog.svelte';
  import SuccessDialog from './lib/components/dialogs/SuccessDialog.svelte';
  
  import { getObscurityColor } from './lib/word-utils';
  import { shareResult } from './lib/social';

  // Local UI State
  let guess = $state('');
  let validation: ValidationResult = $state({ isValid: false, errors: [] });
  let activeErrors: string[] = $state([]);
  let isShaking = $state(false);
  let showRandomConfig = $state(false);
  let showSharedToast = $state(false);
  let flashWords = $state<string[]>([]);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let activeObscurity: number | null = $state(null);
  let scrollContainer: HTMLDivElement;
  let showTopIndicator = $state(false);
  let showBottomIndicator = $state(false);

  // Dialog Visibility
  let showJourneyDialog = $state(false);
  let showSettingsDialog = $state(false);
  let showConfirmDialog = $state(false);
  let showSuccessDialog = $state(false);

  // Confirm Actions
  let confirmData = $state({
      title: 'Abandon Journey?',
      body: 'Your current progress will be lost forever.',
      actionLabel: 'ABANDON',
      cancelLabel: 'STAY ON JOURNEY',
      action: () => {}
  });

  async function handleInput() {
    activeErrors = [];
    const word = guess.toUpperCase();
    if (word.length >= 2) {
        const isDuplicate = game.history.some(m => m.word === word);
        flashWords = isDuplicate ? [word] : [];
        validation = await game.validateMove(guess);
        if (word === game.finishWord && validation.isValid) handleSubmit();
    } else {
        flashWords = [];
        validation = { isValid: false, errors: [] };
    }
  }

  async function handleSubmit(e?: Event) {
    if (e) e.preventDefault();
    if (!guess.trim()) return;
    const result = await game.validateMove(guess);
    if (result.isValid) {
      const isGoal = guess.toUpperCase() === game.finishWord;
      const applied = await game.makeMove(guess.trim());
      if (!applied) return;
      guess = '';
      validation = { isValid: false, errors: [] };
      activeErrors = [];
      flashWords = [];
      if (isGoal) setTimeout(() => showSuccessDialog = true, 500);
      setTimeout(() => { if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight; }, 50);
    } else {
      activeErrors = result.errors;
      isShaking = true; setTimeout(() => isShaking = false, 500);
    }
  }

  function confirmAction(title: string, body: string, label: string, cancel: string, action: () => void) {
      if (game.history.length > 1 && !game.isGameOver) {
          confirmData = { title, body, actionLabel: label, cancelLabel: cancel, action };
          showConfirmDialog = true;
      } else { action(); }
  }

  function selectJourney(journey: any) {
    game.loadJourney(journey);
    showJourneyDialog = false;
    guess = ''; validation = { isValid: false, errors: [] }; activeErrors = [];
  }

  function getInputCharacterClasses(char: string, index: number) {
    const prev = game.currentWord;
    const val = validation;
    if (val.isValid && val.action) {
      const colors: Record<ActionType, string> = { morph: 'decoration-blue-500', synonym: 'decoration-purple-500', antonym: 'decoration-orange-500', anagram: 'decoration-pink-500' };
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 ' + colors[val.action];
    }
    if (!val.isValid && val.diffCount && val.diffCount > 1) {
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 decoration-red-500/60';
    }
    return '';
  }

  function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
          showRandomConfig = false; showJourneyDialog = false; showSettingsDialog = false;
          showConfirmDialog = false; showSuccessDialog = false;
      }
  }

  function handleScroll() {
      if (!scrollContainer) return;
      showTopIndicator = scrollContainer.scrollTop > 10;
      showBottomIndicator = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight > 10;
  }

  $effect(() => { handleScroll(); if (game.startWord) guess = ''; });
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={(e) => { mouseX = e.clientX; mouseY = e.clientY; }} />

<HydrationOverlay isPriorityLoaded={dictionaryService.isPriorityLoaded} />

{#if activeObscurity !== null}
    <div class="obscurity-tooltip" style="left: {mouseX + 15}px; top: {mouseY + 15}px">
        <span class="text-label-caps mb-0.5">Rarity Rank</span>
        <div class="flex items-center gap-1.5"><span class="text-base font-black italic text-emerald-400 leading-none">{activeObscurity}</span></div>
    </div>
{/if}

<div class="app-layout">
  <GameHeader 
    onOpenLevels={() => showJourneyDialog = true}
    onOpenSettings={() => showSettingsDialog = true}
    onConfirmWand={() => confirmAction('Wave your wand?', 'Find the shortest path to the goal.', 'WAVE THE WAND', 'I CAN DO IT!', () => game.solve())}
    onConfirmNewJourney={() => confirmAction('Abandon Journey?', 'Start a new mysterious path.', 'START NEW', 'STAY ON JOURNEY', () => game.loadRandomJourney())}
    {showRandomConfig}
    onToggleRandomConfig={(v) => showRandomConfig = v}
    isGameOver={game.isGameOver}
  />

  <GameLegend />

  <main class="game-board">
    <div bind:this={scrollContainer} onscroll={handleScroll} class="scroll-area custom-scrollbar">
        
        {#each game.history as step, i}
            <PathStep type={step.type} index={i} isGameOver={game.isGameOver}>
                {#snippet card()}
                    <WordCard 
                        type={step.type} 
                        data={step} 
                        previousWord={i > 0 ? game.history[i-1].word : undefined} 
                        flash={flashWords.includes(step.word)} 
                    />
                {/snippet}
                {#snippet sideInfo()}
                    {#if step.type !== 'origin' && step.score !== undefined}
                        <Tooltip title="Score Breakdown">
                            {#snippet children()}<span class="score-pill">+{step.score}</span>{/snippet}
                            {#snippet content()}
                                <div class="score-breakdown">
                                    <div class="breakdown-row">
                                      <span class="label">Base</span>
                                      <span class="val">100</span>
                                    </div>
                                    <div class="breakdown-row text-emerald-400 {getObscurityColor(step.obscurity)}">
                                      <span class="label italic">Rarity Bonus</span>
                                      <span class="val">-{100 - (step.score || 0)}</span>
                                    </div>
                                    <div class="total-row"><span>TOTAL</span><span class="val">{step.score}</span></div>
                                </div>
                            {/snippet}
                        </Tooltip>
                    {:else if step.type === 'origin'}
                        <span class="score-pill text-slate-400">+0</span>
                    {/if}
                {/snippet}
            </PathStep>
        {/each}

        {#if !game.isGameOver}
            <PathStep type="input" index={game.history.length}>
                {#snippet card()}
                    <WordCard 
                        type="input" 
                        bind:value={guess} 
                        data={{
                            validation,
                            hasErrors: activeErrors.length > 0,
                            isShaking,
                            oninput: handleInput,
                            onsubmit: handleSubmit,
                            characterClasses: getInputCharacterClasses
                        }}
                    />
                {/snippet}
            </PathStep>
            {#if activeErrors.length > 0}
                <div class="error-container">
                    {#each activeErrors as err}
                        <p class="error-bubble">{err}</p>
                    {/each}
                </div>
            {/if}
        {/if}

        {#if !game.isGameOver}
            <div class="destination-preview">
                <PathStep type="destination" isGameOver={false}>
                    {#snippet card()}
                        <WordCard type="destination" data={{ type: 'destination', word: game.finishWord, isReached: false, timestamp: 0, obscurity: 0 } as any} />
                    {/snippet}
                </PathStep>
            </div>
        {/if}
    </div>
  </main>
</div>

<JourneyDialog show={showJourneyDialog} onClose={() => showJourneyDialog = false} onSelect={selectJourney} />
<SettingsDialog show={showSettingsDialog} onClose={() => showSettingsDialog = false} />
<ConfirmDialog 
    show={showConfirmDialog} 
    title={confirmData.title} 
    body={confirmData.body} 
    actionLabel={confirmData.actionLabel} 
    cancelLabel={confirmData.cancelLabel} 
    onConfirm={() => { confirmData.action(); showConfirmDialog = false; }} 
    onCancel={() => showConfirmDialog = false} 
/>
<SuccessDialog 
    show={showSuccessDialog} 
    onClose={() => showSuccessDialog = false} 
    onRetry={() => { game.reset(); showSuccessDialog = false; }} 
    onNewMap={() => { showSuccessDialog = false; showJourneyDialog = true; }} 
    onShare={() => shareResult(game)} 
/>

<style lang="postcss">
  @reference "./app.css";

  .app-layout {
    @apply fixed inset-0 bg-slate-900 text-white flex flex-col items-center overflow-hidden h-dvh;
  }

  .game-board {
    @apply flex-1 w-full max-w-lg px-4 flex flex-col min-h-0 relative;
  }

  .scroll-area {
    @apply flex-1 overflow-y-auto py-4 scroll-smooth flex flex-col;
  }

  .toast-shared {
    @apply fixed top-8 left-1/2 -translate-x-1/2 z-200 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl;
  }

  .obscurity-tooltip {
    @apply fixed pointer-events-none z-110 bg-slate-800/90 border-2 border-slate-700 p-2 px-3 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center;
  }

  .score-pill {
    @apply text-sm font-black text-slate-100 transition-colors cursor-help;
  }

  .score-breakdown {
    @apply space-y-3 min-w-40;
  }

  .breakdown-row {
    @apply flex justify-between items-center text-[12px];
  }

  .breakdown-row .label {
    @apply text-slate-400 font-bold uppercase tracking-widest;
  }

  .breakdown-row .val {
    @apply font-mono font-black text-white;
  }

  .total-row {
    @apply flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg uppercase tracking-tighter;
  }

  .total-row .val {
    @apply text-white font-mono;
  }

  .error-container {
    @apply ml-16 mt-2 flex flex-col gap-1;
  }

  .error-bubble {
    @apply text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 self-start;
  }

  .destination-preview {
    @apply mt-4;
  }
</style>
