<script lang="ts">
  import { game, type ValidationResult } from './lib/game.svelte';
  import { journeys } from './lib/journeys';
  import { dictionaryService } from './lib/dictionary.svelte';
  import './app.css';

  let guess = $state('');
  let validation: ValidationResult = $state({ isValid: false, type: 'unknown', errors: [] });
  let activeErrors: string[] = $state([]);
  let isShaking = $state(false);

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

  async function handleSubmit() {
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
      levelsDialog.close();
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
      if (char !== prev[index]) {
        return 'underline underline-offset-4 decoration-2 ' + colors[val.type];
      }
    }

    if (!val.isValid && val.diffCount && val.diffCount > 1) {
      if (char !== prev[index]) {
        return 'underline underline-offset-4 decoration-2 decoration-red-500/60';
      }
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
      if (e.target === dialog) {
          dialog.close();
      }
  }
</script>

{#if dictionaryService.status === 'hydrating'}
  <div class="fixed inset-0 bg-slate-950/90 z-[100] flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <div class="w-full max-w-xs">
        <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Preparing the Map</h2>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Unfolding Local Dictionary...</p>
        
        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
            <div class="h-full bg-blue-500 transition-all duration-300" style="width: {dictionaryService.progress}%"></div>
        </div>
        <div class="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span>{dictionaryService.progress}%</span>
            <span>Plotting Routes</span>
        </div>
    </div>
  </div>
{/if}

<main class="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4">
  <header class="mb-12 text-center relative w-full max-w-lg">
    <!-- Playful Logo Header -->
    <div class="flex flex-col items-center mb-6 animate-in fade-in zoom-in duration-700">
        <div class="flex items-center gap-2">
            <span class="text-5xl md:text-6xl font-black bg-white text-slate-900 px-3 py-1 rounded-2xl transform -rotate-3 shadow-[4px_4px_0px_#3b82f6] border-2 border-slate-900">WORD</span>
            <div class="w-12 h-0.5 border-t-4 border-dashed border-slate-700 self-end mb-4"></div>
        </div>
        <span class="text-5xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 transform rotate-2 -mt-2 drop-shadow-2xl">JOURNEY</span>
    </div>

    <div class="flex justify-between items-end px-4">
      <div class="text-left flex gap-3">
        <div>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Maps</p>
            <button on:click={() => levelsDialog.showModal()} class="text-2xl bg-slate-800 hover:bg-slate-700 p-2 rounded-2xl border-2 border-slate-700 transition-all shadow-xl active:scale-95 leading-none">🗺️</button>
        </div>
        <div>
            <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Gear</p>
            <button on:click={() => settingsDialog.showModal()} class="text-2xl bg-slate-800 hover:bg-slate-700 p-2 rounded-2xl border-2 border-slate-700 transition-all shadow-xl active:scale-95 leading-none">⚙️</button>
        </div>
      </div>
      <div class="text-right">
        <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Moves</p>
        <div class="text-4xl font-black text-white leading-none tracking-tighter italic">{game.score}</div>
      </div>
    </div>
  </header>

  <!-- Journey Select Dialog -->
  <dialog 
    bind:this={levelsDialog} 
    on:click={(e) => handleBackdropClick(e, levelsDialog)}
    class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none overflow-visible"
  >
    <div class="bg-slate-800 border-4 border-slate-700 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-8 border-b-4 border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 class="text-2xl font-black uppercase italic tracking-tighter text-white">Choose Your Journey</h2>
            <button on:click={() => levelsDialog.close()} class="text-slate-500 hover:text-white transition-colors p-2 text-xl">✕</button>
        </div>
        
        <div class="overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6">
            <!-- Enhanced Random Challenge with Slider -->
            <div class="p-8 bg-blue-500/10 border-2 border-blue-500/30 rounded-[2rem] flex flex-col gap-6">
                <div class="flex justify-between items-center">
                    <div class="flex flex-col">
                        <span class="text-2xl font-black uppercase italic tracking-tighter text-blue-400">🎲 Mysterious Path</span>
                        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unpredictable adventure</p>
                    </div>
                    <button 
                        on:click={startRandom}
                        class="bg-blue-600 hover:bg-blue-500 text-white text-sm font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-blue-900/40 active:scale-95 border-b-4 border-blue-800"
                    >
                        EXPLORE
                    </button>
                </div>
                
                <div class="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                    <div class="flex justify-between items-end mb-4">
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Path Distance (Word Length)</span>
                        <span class="text-2xl font-black text-blue-400 leading-none">{game.randomWordLength}</span>
                    </div>
                    <input 
                        type="range" 
                        min="3" 
                        max="12" 
                        bind:value={game.randomWordLength}
                        class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 mb-1">Curated Expeditions</h3>
                {#each journeys as s}
                  <button 
                    on:click={() => selectJourney(s)} 
                    class="w-full text-left p-6 bg-slate-900/30 hover:bg-slate-700/50 border-2 border-slate-700/50 rounded-2xl transition-all group"
                  >
                    <div class="flex justify-between items-center mb-1">
                      <span class="text-lg font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name}</span>
                      <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-700">{s.difficulty}</span>
                    </div>
                    <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>
                  </button>
                {/each}
            </div>
        </div>
    </div>
  </dialog>

  <!-- Gear/Settings Dialog -->
  <dialog 
    bind:this={settingsDialog} 
    on:click={(e) => handleBackdropClick(e, settingsDialog)}
    class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-md outline-none"
  >
    <div class="bg-slate-800 border-4 border-slate-700 rounded-[2.5rem] shadow-2xl p-8">
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Exploration Gear</h2>
            <button on:click={() => settingsDialog.close()} class="text-slate-500 hover:text-white transition-colors p-2">✕</button>
        </div>

        <div class="space-y-8">
            <div>
                <label class="flex items-center justify-between cursor-pointer group mb-2">
                    <span class="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Untamed Vocabulary (Profanity)</span>
                    <div class="relative inline-flex items-center">
                        <input type="checkbox" bind:checked={game.allowProfanity} class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                </label>
                <p class="text-[10px] text-slate-500 leading-relaxed">Adds slang and restricted words to your navigation options.</p>
            </div>
        </div>
    </div>
  </dialog>

  <!-- Path Rendering -->
  <div class="w-full max-w-lg flex flex-col gap-4 pr-2">
    <div class="flex gap-4 items-center">
      <div class={spineBase}>
        <div class={labelBase} title="Basecamp">🟢</div>
      </div>
      <div class={cardBase}>
        <span class="font-mono text-2xl font-black tracking-[0.2em] text-slate-400">{game.startWord}</span>
        <div class="w-2 h-2 rounded-full bg-slate-600"></div>
      </div>
    </div>

    <div class="flex flex-col gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
      {#each game.history.slice(1) as move, i}
        <div class="flex gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <div class={spineBase}>
            <div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-700 shadow-lg shrink-0">{i + 1}</div>
          </div>
          <div class="{cardBase} border-l-4 shadow-lg 
            {move.type === 'letter' ? 'border-l-blue-500' :
             move.type === 'synonym' ? 'border-l-purple-500' :
             move.type === 'antonym' ? 'border-l-orange-500' : 
             move.type === 'anagram' ? 'border-l-pink-500' : 'border-l-red-500'}">
            <span class="font-mono text-2xl tracking-[0.15em] font-bold">
              {#each move.word.split('') as char, i}
                <span class={getCharacterClasses(char, i, move)}>{char}</span>
              {/each}
            </span>
            <span class="text-[8px] font-black uppercase tracking-tighter text-slate-500">{move.type === 'letter' ? 'morph' : move.type}</span>
          </div>
        </div>
      {/each}
    </div>

    {#if game.isGameOver}
      <div class="ml-16 p-10 bg-emerald-500/10 border-4 border-emerald-500/30 rounded-[3rem] backdrop-blur-xl animate-in zoom-in duration-500 text-center shadow-2xl shadow-emerald-900/20">
        <div class="text-6xl mb-4">💎</div>
        <div class="text-emerald-400 text-5xl mb-2 italic font-black uppercase tracking-tighter">Treasure!</div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Journey completed in {game.score} steps</p>
        <div class="flex gap-4 justify-center">
          <button on:click={() => game.reset()} class="bg-slate-800 hover:bg-slate-700 text-[10px] font-black px-8 py-4 rounded-2xl border-2 border-slate-700 transition-all active:scale-95 shadow-xl">RETRY</button>
          <button on:click={() => levelsDialog.showModal()} class="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/40 active:scale-95 border-b-4 border-emerald-800">NEW JOURNEY</button>
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        <div class="flex gap-4 items-center {isShaking ? 'animate-shake' : ''}">
          <div class={spineBase}>
            <div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-700 border-dashed shrink-0 
              {validation.isValid ? (
                validation.type === 'letter' ? 'text-blue-500 border-blue-500' : 
                validation.type === 'synonym' ? 'text-purple-500 border-purple-500' : 
                validation.type === 'antonym' ? 'text-orange-500 border-orange-500' : 
                validation.type === 'anagram' ? 'text-pink-500 border-pink-500' : ''
              ) : (validation.errors.length > 0 ? 'text-red-500 border-red-500 shadow-lg' : 'text-slate-600')}">
              {game.score + 1}
            </div>
          </div>
          <form on:submit|preventDefault={handleSubmit} class="flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border relative
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

            <input 
              type="text" 
              bind:value={guess} 
              on:input={handleInput}
              placeholder="NEXT WAYPOINT..." 
              class="flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-800 text-transparent caret-white selection:bg-blue-500/30" 
              maxlength="20" 
            />
            <div class="group relative h-full">
                <button 
                  type="submit" 
                  class="text-white w-20 h-full transition-all active:scale-90 flex items-center justify-center shrink-0 
                    {validation.isValid ? (
                      validation.type === 'letter' ? 'bg-blue-600 hover:bg-blue-500' : 
                      validation.type === 'synonym' ? 'bg-purple-600 hover:bg-purple-500' : 
                      validation.type === 'antonym' ? 'bg-orange-600 hover:bg-orange-500' : 
                      validation.type === 'anagram' ? 'bg-pink-600 hover:bg-pink-500' : ''
                    ) : 'bg-slate-700 hover:bg-slate-600'}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                
                {#if !validation.isValid && guess.length >= 2}
                  <div class="invisible group-hover:visible absolute right-0 bottom-full mb-4 w-64 p-4 bg-slate-800 border border-red-500/50 rounded-2xl shadow-2xl text-[11px] text-red-200 leading-relaxed z-40 animate-in fade-in slide-in-from-bottom-2 text-left">
                    <p class="font-bold mb-1 underline underline-offset-4 decoration-red-500 uppercase tracking-widest text-[9px]">Roadblock</p>
                    <ul class="list-disc ml-3 space-y-1 text-left">
                      {#each validation.errors as err}
                        <li>{err}</li>
                      {/each}
                    </ul>
                    <div class="absolute top-full right-6 border-[10px] border-transparent border-t-slate-800"></div>
                  </div>
                {/if}
            </div>
          </form>
        </div>
        
        {#if activeErrors.length > 0}
          <div class="ml-16 animate-in slide-in-from-top-2 fade-in duration-300 flex flex-col gap-1 text-left">
            {#each activeErrors as err}
              <p class="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 inline-block self-start">
                {err}
              </p>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex gap-4 items-center mt-2 text-left">
        <div class={spineBase}>
          <div class={labelBase} title="Goal">💎</div>
        </div>
        <div class="{cardBase} border-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-[2rem]">
          <span class="font-mono text-2xl font-black tracking-[0.2em] text-emerald-400 animate-pulse">
            {game.finishWord}
          </span>
          <div class="w-10 h-10 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <section class="mt-12 max-w-lg w-full px-4">
    <div class="grid grid-cols-4 gap-4">
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
