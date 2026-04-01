<script lang="ts">
  import { game, type ValidationResult } from './lib/game.svelte';
  import { journeys } from './lib/journeys';
  import { dictionaryService } from './lib/dictionary.svelte';
  import NavButton from './lib/components/NavButton.svelte';
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

  let levelsDialog: HTMLDialogElement;
  let settingsDialog: HTMLDialogElement;

  const cardBase = "flex-1 flex items-center justify-between p-4 h-16 bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl transition-all w-full box-border";
  const spineBase = "w-12 flex flex-col items-center justify-center shrink-0 h-16";
  const labelBase = "text-[16px] font-black leading-none";

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

  function getCharacterClasses(char: string, index: number, move: any) {
    if (move.type === 'initial') return '';
    const prev = move.previousWord || '';
    const colors = {
      letter: 'decoration-blue-500',
      synonym: 'decoration-purple-500',
      antonym: 'decoration-orange-500',
      anagram: 'decoration-pink-500'
    };
    const base = 'underline underline-offset-4 decoration-2 ';
    const colorClass = colors[move.type as keyof typeof colors] || 'decoration-slate-400';
    if (char !== prev[index]) return base + colorClass;
    return '';
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
    { label: 'Morph', color: 'bg-blue-500', tip: 'Change exactly one letter (e.g., CAT → BAT)' },
    { label: 'Anagram', color: 'bg-pink-500', tip: 'Rearrange the existing letters (e.g., ARC → CAR)' },
    { label: 'Synonym', color: 'bg-purple-500', tip: 'A word with a similar meaning (e.g., HAPPY → GLAD)' },
    { label: 'Antonym', color: 'bg-orange-500', tip: 'A word with the opposite meaning (e.g., COLD → HOT)' }
  ];

  function handleBackdropClick(e: MouseEvent, dialog: HTMLDialogElement) {
      if (e.target === dialog) dialog.close();
  }

  function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
          showRandomConfig = false;
          levelsDialog?.close();
          settingsDialog?.close();
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
      const typeEmojis = {
          letter: '🟦',
          synonym: '🟪',
          antonym: '🟧',
          anagram: '🟫',
          initial: '⬜',
          unknown: '❓'
      };

      const pathString = game.history
          .map(m => typeEmojis[m.type as keyof typeof typeEmojis])
          .join('');

      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
      const text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${shareUrl}`;
      
      navigator.clipboard.writeText(text);
      showSharedToast = true;
      setTimeout(() => showSharedToast = false, 3000);
  }
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
            <button onclick={() => location.reload()} class="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black px-8 py-3 rounded-xl border border-slate-700 transition-all">RELOAD PAGE</button>
        {/if}
    </div>
  </div>
{/if}

{#if showSharedToast}
    <div class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
        Copied to Clipboard!
    </div>
{/if}

<!-- Cursor-following Obscurity Tooltip -->
{#if activeObscurity !== null}
    <div 
        class="fixed pointer-events-none z-[60] bg-slate-800/90 border-2 border-slate-700 p-2 px-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-100 flex flex-col items-center"
        style="left: {mouseX + 15}px; top: {mouseY + 15}px"
    >
        <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Rarity Rank</span>
        <div class="flex items-center gap-1.5">
            <span class="text-base font-black {getObscurityColor(activeObscurity)} leading-none">{activeObscurity}</span>
            <span class="text-[10px] font-bold text-slate-300 uppercase">{getObscurityLabel(activeObscurity)}</span>
        </div>
    </div>
{/if}

<main class="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4">
  <header class="mb-12 text-center relative w-full max-w-lg">
    <div class="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
        <div class="flex items-center gap-2">
            <span class="text-5xl font-black bg-white text-slate-900 px-3 py-1 rounded-2xl transform -rotate-3 shadow-[4px_4px_0px_#3b82f6] border-2 border-slate-900 border-b-4 border-r-4">WORD</span>
            <div class="w-12 h-0.5 border-t-4 border-dashed border-slate-700 self-end mb-4"></div>
        </div>
        <span class="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 transform rotate-2 -mt-2 drop-shadow-2xl">JOURNEY</span>
    </div>

    <div class="flex justify-between items-center px-4">
      <div class="flex gap-2">
        <NavButton onclick={() => levelsDialog.showModal()} title="Choose Journey">
            <span>🗺️</span>
        </NavButton>

        <NavButton onclick={() => game.solve()} title="Magic Path" active={game.isSolving}>
            <span class={game.isSolving ? "animate-pulse" : ""}>🪄</span>
        </NavButton>
        
        <!-- Combo Random Button -->
        <div 
            class="random-config-container relative flex flex-col items-center group"
            onmouseenter={() => showRandomConfig = true}
            onmouseleave={() => showRandomConfig = false}
        >
            <div class="relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden h-[52px] z-20 transition-all">
                <button 
                    onclick={startRandom}
                    title="Start Random Journey"
                    class="flex items-center gap-2 text-xs font-black bg-blue-600 hover:bg-blue-500 h-full px-4 transition-all active:scale-95 leading-none border-r border-blue-700 shrink-0"
                >
                    <span class="text-lg text-white">🎲</span>
                    <span class="font-mono text-base text-white">{game.randomWordLength}</span>
                </button>
                <div class="px-2 h-full flex items-center transition-colors text-slate-500">
                    <svg class="w-4 h-4 transform transition-transform {showRandomConfig ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            
            {#if showRandomConfig}
                <div class="absolute top-[40px] left-0 right-0 p-6 pt-10 bg-slate-800 border-2 border-slate-700 rounded-b-[2rem] shadow-2xl z-10 animate-in slide-in-from-top-4 duration-300 w-64 origin-top backdrop-blur-md">
                    <div class="space-y-6">
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

        <NavButton onclick={() => settingsDialog.showModal()} title="Gear">
            <span>⚙️</span>
        </NavButton>
      </div>
      
      <div class="flex items-center gap-3 pr-2">
        <div class="text-4xl font-black text-white italic tracking-tighter">{game.score}</div>
        <span class="text-3xl filter drop-shadow-lg">🏆</span>
      </div>
    </div>
  </header>

  <!-- Journey Select Dialog -->
  <dialog bind:this={levelsDialog} onclick={(e) => handleBackdropClick(e, levelsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none">
    <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div class="p-6 border-b-2 border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Select Journey</h2>
            <button onclick={() => levelsDialog.close()} class="text-slate-500 hover:text-white transition-colors">✕</button>
        </div>
        <div class="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
            {#each journeys as s}
              <button onclick={() => selectJourney(s)} class="w-full text-left p-5 bg-slate-900/30 hover:bg-slate-700 border-2 border-slate-700/50 rounded-2xl transition-all group">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-slate-200 group-hover:text-blue-400">{s.name}</span>
                  <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-700">{s.difficulty}</span>
                </div>
                <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>
              </button>
            {/each}
        </div>
    </div>
  </dialog>

  <!-- Gear Dialog -->
  <dialog bind:this={settingsDialog} onclick={(e) => handleBackdropClick(e, settingsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-md outline-none">
    <div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Gear</h2>
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
    <!-- Start Word -->
    <div class="flex gap-3 items-center">
      <div class={spineBase}>
        <div class={labelBase} title="Start">🟢</div>
      </div>
      <div 
        class={cardBase}
        onmouseenter={() => activeObscurity = 0}
        onmouseleave={() => activeObscurity = null}
      >
        <span class="font-mono text-2xl font-black tracking-[0.2em] text-slate-400">{game.startWord}</span>
        <div class="w-2 h-2 rounded-full bg-slate-600"></div>
      </div>
    </div>

    <!-- History -->
    <div class="flex flex-col gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
      {#each game.history.slice(1) as move, i}
        <div class="flex gap-3 items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <div class={spineBase}>
            <div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 shadow-lg">{i + 1}</div>
          </div>
          <div 
            class="{cardBase} group relative border-l-4 shadow-lg"
            class:border-l-blue-500={move.type === 'letter'}
            class:border-l-purple-500={move.type === 'synonym'}
            class:border-l-orange-500={move.type === 'antonym'}
            class:border-l-pink-500={move.type === 'anagram'}
            onmouseenter={() => activeObscurity = move.obscurity || 0}
            onmouseleave={() => activeObscurity = null}
          >
            <span class="font-mono text-2xl tracking-[0.15em] font-bold">
              {#each move.word.split('') as char, i}
                <span class={getCharacterClasses(char, i, move)}>{char}</span>
              {/each}
            </span>
            <div class="flex items-center gap-3">
                <span class="text-[10px] font-black text-slate-500">+{move.moveScore}</span>
                <span class="text-[8px] font-black uppercase tracking-tighter text-slate-500">{move.type === 'letter' ? 'morph' : move.type}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    {#if game.isGameOver}
      <div class="ml-15 mt-4 p-8 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl backdrop-blur-xl animate-in zoom-in duration-500 text-center shadow-2xl">
        <div class="text-emerald-400 text-5xl mb-2 italic font-black uppercase tracking-tighter">Success</div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8 italic">Journey completed in {game.history.length - 1} steps</p>
        <div class="flex flex-col gap-3 items-center">
            <div class="flex gap-3 justify-center">
              <button onclick={() => game.reset()} class="bg-slate-800 hover:bg-slate-700 text-[10px] font-black px-8 py-3 rounded-xl border border-slate-700 transition-all active:scale-95 shadow-xl">RETRY</button>
              <button onclick={() => levelsDialog.showModal()} class="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black px-8 py-3 rounded-xl shadow-lg shadow-emerald-900/40 active:scale-95">NEW JOURNEY</button>
            </div>
            <button 
                onclick={shareResult}
                class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-12 py-4 rounded-2xl transition-all shadow-xl active:scale-95 border-b-4 border-blue-800"
            >
                SHARE RESULT
            </button>
        </div>
      </div>
    {:else}
      <!-- Input -->
      <div class="flex flex-col gap-2">
        <div class="flex gap-3 items-center {isShaking ? 'animate-shake' : ''}">
          <div class={spineBase}>
            <div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 border-dashed shrink-0 
              {validation.isValid ? (
                validation.type === 'letter' ? 'text-blue-500 border-blue-500' : 
                validation.type === 'synonym' ? 'text-purple-500 border-purple-500' : 
                validation.type === 'antonym' ? 'text-orange-500 border-orange-500' : 
                validation.type === 'anagram' ? 'text-pink-500 border-pink-500' : ''
              ) : (validation.errors.length > 0 ? 'text-red-500 border-red-500 shadow-lg' : 'text-slate-600')}">
              {game.history.length}
            </div>
          </div>
          <form onsubmit={handleSubmit} class="flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border relative
            {validation.isValid ? (
              validation.type === 'letter' ? 'border-blue-500 shadow-blue-500/20' : 
              validation.type === 'synonym' ? 'border-purple-500 shadow-purple-500/20' : 
              validation.type === 'antonym' ? 'border-orange-500 shadow-orange-500/20' : 
              validation.type === 'anagram' ? 'border-pink-500 shadow-pink-500/20' : ''
            ) : (activeErrors.length > 0 ? 'border-red-500 shadow-red-500/20' : 'border-blue-500/30 shadow-blue-500/10')}">
            <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none font-mono text-2xl uppercase tracking-[0.2em] font-black">
                {#each guess.toUpperCase().split('') as char, i}
                    <span class={getInputCharacterClasses(char, i, validation)}>{char}</span>
                {/each}
            </div>
            <input type="text" bind:value={guess} oninput={handleInput} placeholder="NEXT WAYPOINT..." class="flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-800 text-transparent caret-white" maxlength="20" />
            <button type="submit" class="text-white w-20 h-full transition-all active:scale-90 flex items-center justify-center shrink-0 
                {validation.isValid ? (
                  validation.type === 'letter' ? 'bg-blue-600' : 
                  validation.type === 'synonym' ? 'bg-purple-600' : 
                  validation.type === 'antonym' ? 'bg-orange-600' : 
                  validation.type === 'anagram' ? 'bg-pink-600' : ''
                ) : 'bg-slate-700'}">
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

      <!-- Goal -->
      <div class="flex gap-3 items-center mt-2 text-left">
        <div class={spineBase}>
          <div class={labelBase} title="Goal">💰</div>
        </div>
        <div 
            class="{cardBase} border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent cursor-help"
            onmouseenter={showFinishObscurity}
            onmouseleave={() => activeObscurity = null}
        >
          <span class="font-mono text-2xl font-black tracking-[0.2em] text-emerald-400 animate-pulse">{game.finishWord}</span>
          <div class="w-8 h-8 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <section class="mt-12 max-w-lg w-full px-4">
    <div class="grid grid-cols-4 gap-4 mb-8 text-center text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
      {#each legendItems as item}
        <div class="group relative flex flex-col items-center cursor-help">
          <div class="w-full h-1.5 {item.color} rounded-full mb-2 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-y-150"></div>
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{item.label}</span>
          <div class="invisible group-hover:visible absolute bottom-full mb-4 w-56 p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-2xl text-[10px] text-slate-400 leading-relaxed z-30 animate-in fade-in slide-in-from-bottom-2 text-left">
            <p class="font-medium">{item.tip}</p>
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
