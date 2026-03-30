<script lang="ts">
  import { game, type ConnectionType } from './lib/game';
  import { scenarios } from './lib/scenarios';
  import './app.css';

  let guess = '';
  let showScenarios = false;
  let validationType: ConnectionType = 'unknown';

  const cardBase = "flex-1 flex items-center justify-between p-4 h-16 bg-slate-800/40 rounded-2xl border border-slate-700 shadow-xl transition-all w-full box-border";
  const spineBase = "w-12 flex flex-col items-center justify-center shrink-0 h-16";
  const labelBase = "text-[16px] font-black leading-none";

  async function handleInput() {
    if (guess.length >= 2) {
      validationType = await game.validateMove(guess);
    } else {
      validationType = 'unknown';
    }
  }

  function handleSubmit() {
    if (guess.trim()) {
      game.makeMove(guess.trim());
      guess = '';
      validationType = 'unknown';
    }
  }

  function selectScenario(scenario: any) {
    game.loadScenario(scenario);
    showScenarios = false;
    guess = '';
    validationType = 'unknown';
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

  const legendItems = [
    { label: 'Morph', color: 'bg-blue-500', tip: 'Change exactly one letter (e.g., CAT → BAT)' },
    { label: 'Anagram', color: 'bg-pink-500', tip: 'Rearrange the existing letters (e.g., ARC → CAR)' },
    { label: 'Synonym', color: 'bg-purple-500', tip: 'A word with a similar meaning (e.g., HAPPY → GLAD)' },
    { label: 'Antonym', color: 'bg-orange-500', tip: 'A word with the opposite meaning (e.g., COLD → HOT)' }
  ];

  $: state = $game;
</script>

<main class="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4">
  <header class="mb-10 text-center relative w-full max-w-lg">
    <h1 class="text-4xl md:text-5xl font-black mb-2 tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Word Connection</h1>
    <div class="flex justify-between items-end px-2">
      <div class="text-left">
        <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Session</p>
        <button on:click={() => showScenarios = !showScenarios} class="text-[10px] font-black tracking-widest uppercase bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700 transition-all shadow-xl active:scale-95">Levels</button>
      </div>
      <div class="text-right">
        <p class="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Score</p>
        <div class="text-3xl font-black text-white leading-none">{state.score}</div>
      </div>
    </div>

    {#if showScenarios}
      <div class="absolute top-full left-0 right-0 mt-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-20 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
        {#each scenarios as s}
          <button on:click={() => selectScenario(s)} class="w-full text-left p-5 hover:bg-slate-700/50 border-b border-slate-700 last:border-0 transition-colors group">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold group-hover:text-blue-400 transition-colors">{s.name}</span>
              <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-500 border border-slate-700">{s.difficulty}</span>
            </div>
            <p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>
          </button>
        {/each}
      </div>
    {/if}
  </header>

  <div class="w-full max-w-lg flex flex-col gap-4 pr-2">
    <!-- Start Word -->
    <div class="flex gap-4 items-center">
      <div class={spineBase}>
        <div class={labelBase} title="Start">🟢</div>
      </div>
      <div class={cardBase}>
        <span class="font-mono text-2xl font-black tracking-[0.2em] text-slate-400">{state.startWord}</span>
        <div class="w-2 h-2 rounded-full bg-slate-600"></div>
      </div>
    </div>

    <!-- History Container -->
    <div class="flex flex-col gap-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
      {#each state.history.slice(1) as move, i}
        <div class="flex gap-4 items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <div class={spineBase}>
            <div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 shadow-lg shrink-0">{i + 1}</div>
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

    {#if state.isGameOver}
      <div class="ml-16 p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl backdrop-blur-xl animate-in zoom-in duration-500 text-center">
        <div class="text-emerald-400 text-5xl mb-2 italic font-black uppercase tracking-tighter">Success</div>
        <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Path completed in {state.score} moves</p>
        <div class="flex gap-3 justify-center">
          <button on:click={() => game.reset()} class="bg-slate-800 hover:bg-slate-700 text-[10px] font-black px-8 py-3 rounded-xl border border-slate-700 transition-all active:scale-95">RETRY</button>
          <button on:click={() => showScenarios = true} class="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-95">NEXT</button>
        </div>
      </div>
    {:else}
      <!-- Input -->
      <div class="flex gap-4 items-center">
        <div class={spineBase}>
          <div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 border-dashed shrink-0 
            {validationType === 'unknown' ? 'text-slate-600' : 
             validationType === 'letter' ? 'text-blue-500 border-blue-500' : 
             validationType === 'synonym' ? 'text-purple-500 border-purple-500' : 
             validationType === 'antonym' ? 'text-orange-500 border-orange-500' : 
             validationType === 'anagram' ? 'text-pink-500 border-pink-500' : ''}">
            {state.score + 1}
          </div>
        </div>
        <form on:submit|preventDefault={handleSubmit} class="flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border 
          {validationType === 'unknown' ? 'border-blue-500/30 shadow-blue-500/10' : 
           validationType === 'letter' ? 'border-blue-500 shadow-blue-500/20' : 
           validationType === 'synonym' ? 'border-purple-500 shadow-purple-500/20' : 
           validationType === 'antonym' ? 'border-orange-500 shadow-orange-500/20' : 
           validationType === 'anagram' ? 'border-pink-500 shadow-pink-500/20' : ''}">
          <input 
            type="text" 
            bind:value={guess} 
            on:input={handleInput}
            placeholder="NEXT WORD..." 
            class="flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-800" 
            maxlength="20" 
          />
          <button 
            type="submit" 
            class="text-white w-20 h-full transition-all active:scale-90 flex items-center justify-center shrink-0 
              {validationType === 'unknown' ? 'bg-blue-600/50 cursor-not-allowed' : 
               validationType === 'letter' ? 'bg-blue-600 hover:bg-blue-500' : 
               validationType === 'synonym' ? 'bg-purple-600 hover:bg-purple-500' : 
               validationType === 'antonym' ? 'bg-orange-600 hover:bg-orange-500' : 
               validationType === 'anagram' ? 'bg-pink-600 hover:bg-pink-500' : ''}"
            disabled={validationType === 'unknown'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </form>
      </div>

      <!-- Goal -->
      <div class="flex gap-4 items-center mt-2">
        <div class={spineBase}>
          <div class={labelBase} title="Goal">🏁</div>
        </div>
        <div class="{cardBase} border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <span class="font-mono text-2xl font-black tracking-[0.2em] text-emerald-400 animate-pulse">
            {state.finishWord}
          </span>
          <div class="w-8 h-8 rounded-full border-2 border-emerald-500/20 flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Legend -->
  <section class="mt-12 max-w-lg w-full px-4">
    <div class="grid grid-cols-4 gap-4">
      {#each legendItems as item}
        <div class="group relative flex flex-col items-center cursor-help">
          <div class="w-full h-1.5 {item.color} rounded-full mb-2 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-y-150"></div>
          <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">{item.label}</span>
          <div class="invisible group-hover:visible absolute bottom-full mb-4 w-56 p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl text-[10px] text-slate-400 leading-relaxed z-30 animate-in fade-in slide-in-from-bottom-2">
            <p class="font-medium">{item.tip}</p>
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-slate-800"></div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</main>

<style>
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
