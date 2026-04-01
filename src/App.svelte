<script lang="ts">
  import { game, type ValidationResult } from './lib/game.svelte';
  import { journeys } from './lib/journeys';
  import { dictionaryService } from './lib/dictionary.svelte';
  import Button from './lib/components/Button.svelte';
  import JourneyTile from './lib/components/JourneyTile.svelte';
  import TreasureChest from './lib/components/TreasureChest.svelte';
  import './app.css';

  let guess = $state('');
  let validation: ValidationResult = $state({ isValid: false, type: 'unknown', errors: [] });
  let activeErrors: string[] = $state([]);
  let isShaking = $state(false);
  let showRandomConfig = $state(false);
  let showSharedToast = $state(false);

  // Tooltip tracking
  let mouseX = $state(0);
  let mouseY = $state(0);
  let activeObscurity: number | null = $state(null);
  let globalTooltip: string | null = $state(null);

  let levelsDialog: HTMLDialogElement;
  let settingsDialog: HTMLDialogElement;
  let confirmDialog: HTMLDialogElement;
  let pendingAction: (() => void) | null = null;
  let confirmTitle = $state('Abandon Journey?');
  let confirmBody = $state('Your current progress will be lost forever.');
  let confirmActionLabel = $state('ABANDON');

  const spineBase = "w-12 flex flex-col items-center justify-center shrink-0 h-16 relative";
  const labelBase = "text-[16px] font-black leading-none group relative cursor-help";

  async function handleInput() {
    activeErrors = [];
    if (guess.length >= 2) {
      validation = await game.validateMove(guess);
    } else {
      validation = { isValid: false, type: 'unknown', errors: [] };
    }
  }

  async function handleSubmit(e?: Event) {
    if (e) e.preventDefault();
    if (!guess.trim()) return;
    const result = await game.validateMove(guess);
    if (result.isValid) {
      game.makeMove(guess.trim());
      guess = '';
      validation = { isValid: false, type: 'unknown', errors: [] };
      activeErrors = [];
    } else {
      activeErrors = result.errors;
      triggerShake();
    }
  }

  function triggerShake() {
      isShaking = true;
      setTimeout(() => isShaking = false, 500);
  }

  function confirmAction(title: string, body: string, label: string, action: () => void) {
      if (game.history.length > 1 && !game.isGameOver) {
          confirmTitle = title;
          confirmBody = body;
          confirmActionLabel = label;
          pendingAction = action;
          confirmDialog.showModal();
      } else {
          action();
      }
  }

  function selectJourney(journey: any) {
    game.loadJourney(journey);
    levelsDialog.close();
    guess = '';
    validation = { isValid: false, type: 'unknown', errors: [] };
    activeErrors = [];
  }

  async function startRandom() {
      await game.loadRandomJourney();
      showRandomConfig = false;
      guess = '';
      validation = { isValid: false, type: 'unknown', errors: [] };
      activeErrors = [];
  }

  function getInputCharacterClasses(char: string, index: number, val: ValidationResult) {
    const prev = game.currentWord;
    if (val.isValid) {
      const colors = {
        letter: 'decoration-blue-500',
        synonym: 'decoration-purple-500',
        antonym: 'decoration-orange-500',
        anagram: 'decoration-pink-500',
        initial: '',
        unknown: ''
      };
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 ' + colors[val.type];
    }
    if (!val.isValid && val.diffCount && val.diffCount > 1) {
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 decoration-red-500/60';
    }
    return '';
  }

  const legendItems = [
    { label: 'Morph', color: 'bg-blue-500', tip: 'Change exactly one letter.' , example: 'C<u>A</u>T ➔ C<u>O</u>T' },
    { label: 'Anagram', color: 'bg-pink-500', tip: 'Rearrange the existing letters.', example: '<u>ARC</u> ➔ <u>CAR</u>' },
    { label: 'Synonym', color: 'bg-purple-500', tip: 'A word with a similar meaning.', example: '<u>HAPPY</u> ➔ <u>GLAD</u>' },
    { label: 'Antonym', color: 'bg-orange-500', tip: 'A word with the opposite meaning.', example: '<u>COLD</u> ➔ <u>HOT</u>' }
  ];

  function handleBackdropClick(e: MouseEvent, dialog: HTMLDialogElement) {
      if (e.target === dialog) dialog.close();
  }

  function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
          showRandomConfig = false;
          levelsDialog?.close();
          settingsDialog?.close();
          confirmDialog?.close();
      }
  }

  function getObscurityLabel(val: number) {
      if (val <= 1) return 'Common';
      if (val <= 3) return 'Typical';
      if (val <= 6) return 'Rare';
      return 'Obscure';
  }

  function getObscurityColor(val: number) {
      if (val <= 1) return 'text-emerald-400';
      if (val <= 3) return 'text-blue-400';
      if (val <= 6) return 'text-purple-400';
      return 'text-pink-400';
  }

  function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
  }

  async function showFinishObscurity() {
      const entry = await dictionaryService.getEntry(game.finishWord);
      if (entry) {
          activeObscurity = game.calculateObscurity(entry.rank);
      } else {
          activeObscurity = 10;
      }
  }

  function shareResult() {
      const typeEmojis = { letter: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫', initial: '⬜', unknown: '❓' };
      const pathString = game.history.map(m => typeEmojis[m.type as keyof typeof typeEmojis]).join('');
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
      const text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${shareUrl}`;
      navigator.clipboard.writeText(text);
      showSharedToast = true;
      setTimeout(() => showSharedToast = false, 3000);
  }

  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  const sortedJourneys = journeys.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={handleMouseMove} />

{#if dictionaryService.status === 'hydrating' || dictionaryService.status === 'error'}
  <div class="fixed inset-0 bg-slate-950/90 z-[100] flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <div class="w-full max-w-xs">
        {#if dictionaryService.status === 'hydrating'}
            <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Preparing the Map</h2>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Unfolding Local Dictionary...</p>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
                <div class="h-full bg-blue-500 transition-all duration-300" style="width: {dictionaryService.progress}%"></div>
            </div>
            <div class="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>{dictionaryService.progress}%</span>
                <span>Plotting Routes</span>
            </div>
        {:else}
            <h2 class="text-2xl font-black text-red-500 mb-2 uppercase tracking-tighter italic">Map Error</h2>
            <p class="text-slate-300 text-xs font-bold mb-6">{dictionaryService.errorMessage || 'Unknown Initialization Failure'}</p>
            <Button onclick={() => location.reload()} variant="secondary" size="sm">RELOAD PAGE</Button>
        {/if}
    </div>
  </div>
{/if}

{#if showSharedToast}
    <div class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
        Copied to Clipboard!
    </div>
{/if}

{#if activeObscurity !== null}
    <div class="fixed pointer-events-none z-[110] bg-slate-800/90 border-2 border-slate-700 p-2 px-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-100 flex flex-col items-center" style="left: {mouseX + 15}px; top: {mouseY + 15}px">
        <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Rarity Rank</span>
        <div class="flex items-center gap-1.5">
            <span class="text-base font-black {getObscurityColor(activeObscurity)} leading-none">{activeObscurity}</span>
            <span class="text-[10px] font-bold text-slate-300 uppercase">{getObscurityLabel(activeObscurity)}</span>
        </div>
    </div>
{/if}

<!-- Global Simple Tooltip -->
{#if globalTooltip}
    <div class="fixed pointer-events-none z-[110] bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg shadow-2xl text-[10px] font-bold text-white whitespace-nowrap animate-in fade-in zoom-in duration-75" style="left: {mouseX + 15}px; top: {mouseY + 15}px">
        {globalTooltip}
    </div>
{/if}

<main class="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4">
  <header class="mb-12 text-center relative w-full max-w-lg">
    <div class="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
        <div class="flex items-center gap-2">
            <span class="text-5xl font-black bg-white text-slate-900 px-3 py-1 rounded-2xl transform -rotate-3 shadow-[4px_4px_0px_#3b82f6] border-2 border-slate-900 border-b-4 border-r-4 uppercase">WORD</span>
            <div class="w-12 h-0.5 border-t-4 border-dashed border-slate-700 self-end mb-4"></div>
        </div>
        <span class="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 transform rotate-2 -mt-2 drop-shadow-2xl uppercase">JOURNEY</span>
    </div>

    <div class="flex justify-between items-center px-4 h-[52px]">
      <div class="flex gap-2 h-full">
        <Button variant="secondary" size="icon" onclick={() => levelsDialog.showModal()} tooltip="Choose Journey" disabled={game.isGenerating || game.isSolving} class="h-full">
            <span>🗺️</span>
        </Button>

        <Button 
            variant="secondary" 
            size="icon" 
            onclick={() => confirmAction('Magic Path?', 'The wand will automatically find the shortest path from your current word.', 'ACTIVATE MAGIC', () => game.solve())} 
            loading={game.isSolving}
            tooltip="Magic Path"
            disabled={game.isGenerating}
            class="h-full"
        >
            <span>🪄</span>
        </Button>
        
        <div 
            class="random-config-container relative flex flex-col items-center group h-full"
            onmouseenter={() => showRandomConfig = true}
            onmouseleave={() => showRandomConfig = false}
        >
            <div class="relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 shadow-xl h-full z-20 transition-all overflow-hidden" class:rounded-b-none={showRandomConfig}>
                <button 
                    onclick={() => confirmAction('Abandon Journey?', 'Your current progress will be lost if you start a new random journey.', 'START NEW', startRandom)}
                    disabled={game.isGenerating || game.isSolving}
                    class="flex items-center gap-2 text-xs font-black bg-blue-600 hover:bg-blue-500 h-full px-4 transition-all active:scale-95 leading-none border-r border-blue-700 shrink-0 text-white disabled:opacity-50"
                >
                    {#if game.isGenerating}
                        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    {:else}
                        <span class="text-lg">🎲</span>
                        <span class="font-mono text-base">{game.randomWordLength}</span>
                    {/if}
                </button>
                <div class="px-2 h-full flex items-center text-slate-500">
                    <svg class="w-4 h-4 transform transition-transform {showRandomConfig ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {#if showRandomConfig}
                <div class="absolute top-[48px] left-0 right-0 p-6 pt-10 bg-slate-800 border-2 border-t-0 border-slate-700 rounded-b-[2rem] shadow-2xl z-10 animate-in slide-in-from-top-4 duration-300 w-64 origin-top backdrop-blur-md">
                    <div class="space-y-6 text-left">
                        <div>
                            <div class="flex justify-between items-end mb-3 text-slate-400">
                                <span class="text-[10px] font-black uppercase tracking-widest">Length</span>
                                <span class="text-2xl font-black text-blue-400 leading-none">{game.randomWordLength}</span>
                            </div>
                            <input type="range" min="3" max="12" bind:value={game.randomWordLength} class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        </div>
                        <div>
                            <div class="flex justify-between items-end mb-3 text-slate-400">
                                <span class="text-[10px] font-black uppercase tracking-widest">Obscurity</span>
                                <span class="text-2xl font-black {getObscurityColor(game.randomMaxObscurity)} leading-none">{getObscurityLabel(game.randomMaxObscurity)}</span>
                            </div>
                            <input type="range" min="0" max="10" bind:value={game.randomMaxObscurity} class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <Button variant="secondary" size="icon" onclick={() => settingsDialog.showModal()} tooltip="Settings" disabled={game.isGenerating || game.isSolving} class="h-full">
            <span>⚙️</span>
        </Button>
      </div>
      
      <div class="flex items-center gap-3 pr-2">
        <div class="text-4xl font-black text-white italic tracking-tighter">{game.score}</div>
        <span class="text-3xl filter drop-shadow-lg">🏆</span>
      </div>
    </div>
  </header>

  <!-- Confirm Dialog -->
  <dialog bind:this={confirmDialog} onclick={(e) => handleBackdropClick(e, confirmDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-sm outline-none">
    <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in duration-200">
        <h2 class="text-xl font-black uppercase italic tracking-tighter text-white mb-2">{confirmTitle}</h2>
        <p class="text-slate-400 text-sm mb-8">{confirmBody}</p>
        <div class="flex flex-col gap-2">
            <Button variant="danger" onclick={() => { pendingAction?.(); confirmDialog.close(); }}>{confirmActionLabel}</Button>
            <Button variant="secondary" onclick={() => confirmDialog.close()}>STAY ON JOURNEY</Button>
        </div>
    </div>
  </dialog>

  <!-- Journey Select Dialog -->
  <dialog bind:this={levelsDialog} onclick={(e) => handleBackdropClick(e, levelsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none">
    <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div class="p-6 border-b-2 border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Select Journey</h2>
            <button onclick={() => levelsDialog.close()} class="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>
        <div class="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 text-left">
            {#each sortedJourneys as s}
              {@const result = game.completedJourneys[s.id]}
              <button 
                onclick={() => confirmAction('Abandon Journey?', 'Starting a new journey will clear your current progress.', 'START NEW', () => selectJourney(s))} 
                class="w-full text-left p-5 bg-slate-900/30 hover:bg-slate-700 border-2 border-slate-700/50 rounded-2xl transition-all group relative"
              >
                <div class="flex justify-between items-center mb-1">
                  <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name}</span>
                      {#if result}
                        <span class="text-[10px]" title="Completed!">✅</span>
                      {/if}
                  </div>
                  <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-700">{s.difficulty}</span>
                </div>
                <div class="flex justify-between items-end">
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>
                    {#if result}
                        <span class="text-[9px] font-black text-emerald-500 uppercase">Best: {result.score} 🏆</span>
                    {/if}
                </div>
              </button>
            {/each}
        </div>
    </div>
  </dialog>

  <!-- Gear Dialog -->
  <dialog bind:this={settingsDialog} onclick={(e) => handleBackdropClick(e, settingsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-md outline-none">
    <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Settings</h2>
            <button onclick={() => settingsDialog.close()} class="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>
        <label class="flex items-center justify-between cursor-pointer group">
            <span class="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Untamed Vocabulary (Profanity)</span>
            <div class="relative inline-flex items-center">
                <input type="checkbox" bind:checked={game.allowProfanity} class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
        </label>
    </div>
  </dialog>

  <!-- Game Path -->
  <div class="w-full max-w-lg flex flex-col gap-3 pr-2">
    <div class="flex gap-3 items-center">
      <div class={spineBase}>
        <div class={labelBase} onmouseenter={() => globalTooltip = 'Starting word'} onmouseleave={() => globalTooltip = null}>
            <span>🟢</span>
        </div>
      </div>
      <JourneyTile word={game.startWord} isStart onmouseenter={() => activeObscurity = 0} onmouseleave={() => activeObscurity = null} />
    </div>

    <div class="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
      {#each game.history.slice(1) as move, i}
        <div class="flex gap-3 items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <div class={spineBase}>
            <div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 shadow-lg">{i + 1}</div>
          </div>
          <JourneyTile 
            word={move.word} 
            type={move.type} 
            score={move.moveScore} 
            obscurity={move.obscurity}
            onmouseenter={() => activeObscurity = move.obscurity || 0}
            onmouseleave={() => activeObscurity = null}
          />
        </div>
      {/each}
    </div>

    {#if game.isGameOver}
      <div class="ml-15 mt-4 p-8 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[3rem] backdrop-blur-xl animate-in zoom-in duration-500 text-center shadow-2xl">
        <div class="w-24 h-24 mx-auto mb-4">
            <TreasureChest open />
        </div>
        <div class="text-emerald-400 text-5xl mb-2 italic font-black uppercase tracking-tighter">Success</div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 italic">Journey completed in {game.history.length - 1} steps</p>
        <div class="flex flex-col gap-4 items-center">
            <div class="flex gap-3 justify-center">
              <Button variant="secondary" onclick={() => confirmAction('Abandon Journey?', 'Retrying will clear your current progress.', 'RETRY', () => game.reset())}>RETRY</Button>
              <Button variant="secondary" onclick={() => levelsDialog.showModal()}>NEW JOURNEY</Button>
            </div>
            <Button size="lg" variant="primary" onclick={shareResult} class="w-full max-w-[240px]">SHARE RESULT</Button>
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <div class="flex gap-3 items-center {isShaking ? 'animate-shake' : ''}">
          <div class={spineBase}>
            <div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 border-dashed shrink-0 {validation.isValid ? (validation.type === 'letter' ? 'text-blue-500 border-blue-500' : validation.type === 'synonym' ? 'text-purple-500 border-purple-500' : validation.type === 'antonym' ? 'text-orange-500 border-orange-500' : validation.type === 'anagram' ? 'text-pink-500 border-pink-500' : '') : (validation.errors.length > 0 ? 'text-red-500 border-red-500 shadow-lg' : 'text-slate-600')}">
              {game.history.length}
            </div>
          </div>
          <form onsubmit={handleSubmit} class="flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border relative {validation.isValid ? (validation.type === 'letter' ? 'border-blue-500 shadow-blue-500/20' : validation.type === 'synonym' ? 'border-purple-500 shadow-purple-500/20' : validation.type === 'antonym' ? 'border-orange-500 shadow-orange-500/20' : validation.type === 'anagram' ? 'border-pink-500 shadow-pink-500/20' : '') : (activeErrors.length > 0 ? 'border-red-500 shadow-red-500/20' : 'border-blue-500/30 shadow-blue-500/10')}">
            <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none font-mono text-2xl uppercase tracking-[0.2em] font-black">
                {#each guess.toUpperCase().split('') as char, i}
                    <span class={getInputCharacterClasses(char, i, validation)}>{char}</span>
                {/each}
            </div>
            <input type="text" bind:value={guess} oninput={handleInput} placeholder="NEXT WAYPOINT..." class="flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-800 text-transparent caret-white" maxlength="20" />
            <button type="submit" class="text-white w-20 h-full transition-all active:scale-90 flex items-center justify-center shrink-0 {validation.isValid ? (validation.type === 'letter' ? 'bg-blue-600' : validation.type === 'synonym' ? 'bg-purple-600' : validation.type === 'antonym' ? 'bg-orange-600' : validation.type === 'anagram' ? 'bg-pink-600' : '') : 'bg-slate-700'}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </form>
        </div>
        {#if activeErrors.length > 0}
          <div class="ml-16 animate-in slide-in-from-top-2 fade-in duration-300 flex flex-col gap-1 text-left">
            {#each activeErrors as err}
              <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 inline-block self-start">{err}</p>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex gap-3 items-center mt-2 text-left group">
        <div class={spineBase}>
          <div class={labelBase} onmouseenter={() => globalTooltip = 'Final destination. You need to get here!'} onmouseleave={() => globalTooltip = null}>
              <div class="w-6 h-6">
                  <TreasureChest />
              </div>
          </div>
        </div>
        <JourneyTile 
            word={game.finishWord} 
            isGoal 
            onmouseenter={showFinishObscurity} 
            onmouseleave={() => activeObscurity = null} 
        />
      </div>
    {/if}
  </div>

  <section class="mt-12 max-w-lg w-full px-4">
    <div class="grid grid-cols-4 gap-4 mb-8 text-center text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
      {#each legendItems as item}
        <div class="group relative flex flex-col items-center cursor-help">
          <div class="w-full h-1.5 {item.color} rounded-full mb-2 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-y-150"></div>
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{item.label}</span>
          <div class="invisible group-hover:visible absolute bottom-full mb-4 w-56 p-5 bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-2xl text-[10px] text-slate-400 leading-relaxed z-30 animate-in fade-in slide-in-from-bottom-2 text-left">
            <p class="font-bold mb-2 text-slate-200">{item.tip}</p>
            <div class="bg-slate-950/50 p-2 rounded-xl font-mono text-[11px] flex justify-center items-center gap-3">
                <span>Example:</span>
                <span class="text-white">{@html item.example}</span>
            </div>
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-800"></div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</main>

<style>
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 20px;
  }
</style>
