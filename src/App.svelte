<script lang="ts">
  import { game, type ValidationResult } from './lib/game.svelte';
  import { journeys } from './lib/journeys';
  import { dictionaryService } from './lib/dictionary.svelte';
  import Button from './lib/components/Button.svelte';
  import JourneyTile from './lib/components/JourneyTile.svelte';
  import TreasureChest from './lib/components/TreasureChest.svelte';
  import Tooltip from './lib/components/Tooltip.svelte';
  import WordInput from './lib/components/WordInput.svelte';
  import WordRow from './lib/components/WordRow.svelte';
  import './app.css';

  let guess = $state('');
  let validation: ValidationResult = $state({ isValid: false, type: 'unknown', errors: [] });
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

  let levelsDialog: HTMLDialogElement;
  let settingsDialog: HTMLDialogElement;
  let confirmDialog: HTMLDialogElement;
  let successDialog: HTMLDialogElement;
  let pendingAction: (() => void) | null = null;
  let confirmTitle = $state('Abandon Journey?');
  let confirmBody = $state('Your current progress will be lost forever.');
  let confirmActionLabel = $state('ABANDON');
  let confirmCancelLabel = $state('STAY ON JOURNEY');

  async function handleInput() {
    activeErrors = [];
    const word = guess.toUpperCase();
    if (word.length >= 2) {
        const isDuplicate = game.history.some(m => m.word === word) || word === game.finishWord;
        flashWords = isDuplicate ? [word] : [];
        validation = await game.validateMove(guess);
    } else {
        flashWords = [];
        validation = { isValid: false, type: 'unknown', errors: [] };
    }
  }

  async function handleSubmit(e?: Event) {
    if (e) e.preventDefault();
    if (!guess.trim()) return;
    const result = await game.validateMove(guess);
    if (result.isValid) {
      const isGoal = guess.toUpperCase() === game.finishWord;
      game.makeMove(guess.trim());
      guess = '';
      validation = { isValid: false, type: 'unknown', errors: [] };
      activeErrors = [];
      flashWords = [];
      if (isGoal) setTimeout(() => successDialog.showModal(), 500);
      setTimeout(() => { if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight; }, 50);
    } else {
      activeErrors = result.errors;
      triggerShake();
    }
  }

  function triggerShake() { isShaking = true; setTimeout(() => isShaking = false, 500); }

  function confirmAction(title: string, body: string, label: string, cancel: string, action: () => void) {
      if (game.history.length > 1 && !game.isGameOver) {
          confirmTitle = title; confirmBody = body; confirmActionLabel = label; confirmCancelLabel = cancel;
          pendingAction = action; confirmDialog.showModal();
      } else { action(); }
  }

  function selectJourney(journey: any) {
    game.loadJourney(journey);
    levelsDialog.close();
    guess = ''; validation = { isValid: false, type: 'unknown', errors: [] }; activeErrors = [];
  }

  function getInputCharacterClasses(char: string, index: number) {
    const prev = game.currentWord;
    const val = validation;
    if (val.isValid) {
      const colors = { letter: 'decoration-blue-500', synonym: 'decoration-purple-500', antonym: 'decoration-orange-500', anagram: 'decoration-pink-500', initial: '', unknown: '' };
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 ' + colors[val.type];
    }
    if (!val.isValid && val.diffCount && val.diffCount > 1) {
      if (char !== prev[index]) return 'underline underline-offset-4 decoration-2 decoration-red-500/60';
    }
    return '';
  }

  const legendItems = [
    { label: 'Morph', color: 'bg-blue-500', tip: 'Change exactly one letter.', examples: ['C<u class="decoration-blue-500 decoration-2">A</u>T ➔ C<u class="decoration-blue-500 decoration-2">O</u>T', 'F<u class="decoration-blue-500 decoration-2">I</u>RE ➔ F<u class="decoration-blue-500 decoration-2">A</u>RE', 'B<u class="decoration-blue-500 decoration-2">E</u>AR ➔ B<u class="decoration-blue-500 decoration-2">O</u>AR'] },
    { label: 'Anagram', color: 'bg-pink-500', tip: 'Rearrange the existing letters.', examples: ['<u class="decoration-pink-500 decoration-2">ARC</u> ➔ <u class="decoration-pink-500 decoration-2">CAR</u>', '<u class="decoration-pink-500 decoration-2">EAR</u> ➔ <u class="decoration-pink-500 decoration-2">ARE</u>', '<u class="decoration-pink-500 decoration-2">DIRE</u> ➔ <u class="decoration-pink-500 decoration-2">RIDE</u>'] },
    { label: 'Synonym', color: 'bg-purple-500', tip: 'A word with a similar meaning.', examples: ['<u class="decoration-purple-500 decoration-2">HAPPY</u> ➔ <u class="decoration-purple-500 decoration-2">GLAD</u>', '<u class="decoration-purple-500 decoration-2">SMALL</u> ➔ <u class="decoration-purple-500 decoration-2">TINY</u>', '<u class="decoration-purple-500 decoration-2">FAST</u> ➔ <u class="decoration-purple-500 decoration-2">QUICK</u>'] },
    { label: 'Antonym', color: 'bg-orange-500', tip: 'A word with the opposite meaning.', examples: ['<u class="decoration-orange-500 decoration-2">COLD</u> ➔ <u class="decoration-orange-500 decoration-2">HOT</u>', '<u class="decoration-orange-500 decoration-2">LOVE</u> ➔ <u class="decoration-orange-500 decoration-2">HATE</u>', '<u class="decoration-orange-500 decoration-2">DARK</u> ➔ <u class="decoration-orange-500 decoration-2">LIGHT</u>'] }
  ];

  function handleBackdropClick(e: MouseEvent, dialog: HTMLDialogElement) { if (e.target === dialog) dialog.close(); }

  function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') { showRandomConfig = false; levelsDialog?.close(); settingsDialog?.close(); confirmDialog?.close(); successDialog?.close(); }
  }

  function getObscurityLabel(val: number) { if (val <= 1) return 'Common'; if (val <= 3) return 'Typical'; if (val <= 6) return 'Rare'; return 'Obscure'; }
  function getObscurityColor(val: number) { if (val <= 1) return 'text-emerald-400'; if (val <= 3) return 'text-blue-400'; if (val <= 6) return 'text-purple-400'; return 'text-pink-400'; }
  function handleMouseMove(e: MouseEvent) { mouseX = e.clientX; mouseY = e.clientY; }

  async function showFinishObscurity() {
      const entry = await dictionaryService.getEntry(game.finishWord);
      activeObscurity = entry ? game.calculateObscurity(entry.rank) : 10;
  }

  function shareResult() {
      const typeEmojis = { letter: '🟦', synonym: '🟪', antonym: '🟧', anagram: '🟫', initial: '⬜', unknown: '❓' };
      const pathString = game.history.map(m => typeEmojis[m.type as keyof typeof typeEmojis]).join('');
      const text = `Word Journey: ${game.startWord} ➔ ${game.finishWord}\nScore: ${game.score}\nSteps: ${game.history.length - 1}\nPath: ${pathString}\n\n${window.location.origin}${window.location.pathname}?s=${game.startWord.toLowerCase()}&e=${game.finishWord.toLowerCase()}`;
      navigator.clipboard.writeText(text);
      showSharedToast = true; setTimeout(() => showSharedToast = false, 3000);
  }

  const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
  let filteredJourneys = $derived(
      journeys
        .filter(j => game.allowProfanity || !j.tags?.includes('profanity'))
        .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
  );

  function handleScroll() {
      if (!scrollContainer) return;
      showTopIndicator = scrollContainer.scrollTop > 10;
      showBottomIndicator = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight > 10;
  }

  function getDifficultyClasses(diff: string) {
      const base = "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border";
      if (diff === 'easy') return `${base} text-emerald-400 border-emerald-500/30 bg-emerald-500/10`;
      if (diff === 'medium') return `${base} text-yellow-400 border-yellow-500/30 bg-yellow-500/10`;
      if (diff === 'hard') return `${base} text-red-400 border-red-500/30 bg-red-500/10`;
      return base;
  }

  $effect(() => { handleScroll(); if (game.startWord) guess = ''; });
</script>

<svelte:window onkeydown={handleKeydown} onmousemove={handleMouseMove} />

{#if dictionaryService.status === 'hydrating' || dictionaryService.status === 'error'}
  <div class="fixed inset-0 bg-slate-950/90 z-[200] flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
    <div class="w-full max-w-xs">
        {#if dictionaryService.status === 'hydrating'}
            <h2 class="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Preparing the Map</h2>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
                <div class="h-full bg-blue-500 transition-all duration-300" style="width: {dictionaryService.progress}%"></div>
            </div>
            <div class="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest"><span>{dictionaryService.progress}%</span><span>Plotting Routes</span></div>
        {:else}
            <h2 class="text-2xl font-black text-red-500 mb-2 uppercase tracking-tighter italic">Map Error</h2>
            <Button onclick={() => location.reload()} variant="secondary" size="sm">RELOAD PAGE</Button>
        {/if}
    </div>
  </div>
{/if}

{#if showSharedToast}<div class="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">Copied to Clipboard!</div>{/if}

{#if activeObscurity !== null}
    <div class="fixed pointer-events-none z-[110] bg-slate-800/90 border-2 border-slate-700 p-2 px-3 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-100 flex flex-col items-center" style="left: {mouseX + 15}px; top: {mouseY + 15}px">
        <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Rarity Rank</span>
        <div class="flex items-center gap-1.5"><span class="text-base font-black {getObscurityColor(activeObscurity)} leading-none">{activeObscurity}</span><span class="text-[10px] font-bold text-slate-300 uppercase">{getObscurityLabel(activeObscurity)}</span></div>
    </div>
{/if}

<div class="fixed inset-0 bg-slate-900 text-white flex flex-col items-center overflow-hidden overscroll-none h-[100dvh]">
  <header class="flex-none w-full max-w-lg pt-8 pb-4 px-4">
    <div class="flex flex-col items-center mb-6 animate-in fade-in zoom-in duration-700">
        <div class="flex items-center gap-2"><span class="text-4xl md:text-5xl font-black bg-white text-slate-900 px-3 py-1 rounded-2xl transform -rotate-3 shadow-[4px_4px_0px_#3b82f6] border-2 border-slate-900 border-b-4 border-r-4 uppercase leading-none">WORD</span><div class="w-10 h-0.5 border-t-4 border-dashed border-slate-700 self-end mb-3"></div></div>
        <span class="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400 transform rotate-2 -mt-2 drop-shadow-2xl uppercase leading-none">JOURNEY</span>
    </div>

    <div class="flex justify-between items-center px-4 h-[52px]">
      <div class="flex gap-2 h-full items-center">
        <Button variant="secondary" size="icon" onclick={() => levelsDialog.showModal()} tooltip="Choose Journey" disabled={game.isGenerating || game.isSolving} class="h-full"><span>🗺️</span></Button>
        <Button variant="secondary" size="icon" onclick={() => confirmAction('Wave your wand?', 'Waving your wand will automatically find the shortest path to the final word from your current location.', 'WAVE THE WAND', 'I CAN DO IT MYSELF!', () => game.solve())} loading={game.isSolving} tooltip="Magic Path" disabled={game.isGenerating || game.isGameOver} class="h-full"><span>🪄</span></Button>
        <div class="random-config-container relative flex flex-col items-center group h-full" onmouseenter={() => showRandomConfig = true} onmouseleave={() => showRandomConfig = false}>
            <div class="relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 shadow-xl h-full z-20 transition-all overflow-hidden" class:rounded-b-none={showRandomConfig}>
                <button onclick={() => confirmAction('Abandon Journey?', 'Starting a new journey will clear your current progress.', 'START NEW', 'STAY ON JOURNEY', () => game.loadRandomJourney())} disabled={game.isGenerating || game.isSolving} class="flex items-center gap-2 text-xs font-black bg-blue-600 hover:bg-blue-500 h-full px-4 transition-all active:scale-95 leading-none border-r border-blue-700 shrink-0 text-white disabled:opacity-50">{#if game.isGenerating}<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{:else}<span class="text-lg">🎲</span><span class="font-mono text-base">{game.randomWordLength}</span>{/if}</button>
                <div class="px-2 h-full flex items-center text-slate-500"><svg class="w-4 h-4 transform transition-transform {showRandomConfig ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg></div>
            </div>
            {#if showRandomConfig}<div class="absolute top-[48px] left-0 right-0 p-6 pt-10 bg-slate-800 border-2 border-t-0 border-slate-700 rounded-b-[2rem] shadow-2xl z-10 animate-in slide-in-from-top-4 duration-300 w-64 origin-top backdrop-blur-md"><div class="space-y-6 text-left"><div><div class="flex justify-between items-end mb-3 text-slate-400"><span class="text-[10px] font-black uppercase tracking-widest">Length</span><span class="text-2xl font-black text-blue-400 leading-none">{game.randomWordLength}</span></div><input type="range" min="3" max="12" bind:value={game.randomWordLength} class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" /></div><div><div class="flex justify-between items-end mb-3 text-slate-400"><span class="text-[10px] font-black uppercase tracking-widest">Obscurity</span><span class="text-2xl font-black {getObscurityColor(game.randomMaxObscurity)} leading-none">{getObscurityLabel(game.randomMaxObscurity)}</span></div><input type="range" min="0" max="10" bind:value={game.randomMaxObscurity} class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" /></div></div></div>{/if}
        </div>
        <Button variant="secondary" size="icon" onclick={() => settingsDialog.showModal()} tooltip="Settings" disabled={game.isGenerating || game.isSolving} class="h-full"><span>⚙️</span></Button>
      </div>
      <div class="flex items-center gap-3 pr-2"><div class="text-4xl font-black text-white italic tracking-tighter">{game.score}</div><span class="text-3xl filter drop-shadow-lg">🏆</span></div>
    </div>
  </header>

  <section class="flex-none w-full max-w-lg px-6 pt-2 pb-6">
    <div class="flex justify-between gap-4 text-center text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">
      {#each legendItems as item}
        <Tooltip title={item.tip} position="bottom" class="flex-1 flex flex-col items-center">
            {#snippet children()}<div class="group relative flex flex-col items-center cursor-help w-full"><div class="w-full h-1.5 {item.color} rounded-full mb-2 opacity-40 group-hover:opacity-100 transition-all group-hover:scale-y-150"></div><span class="group-hover:text-slate-300 transition-colors">{item.label}</span></div>{/snippet}
            {#snippet content()}<div class="bg-slate-950/50 p-4 rounded-[1.5rem] font-mono text-sm space-y-3 min-w-[240px]">{#each item.examples as ex}<div class="text-white border-b border-slate-800 last:border-0 pb-2 last:pb-0"><span>{@html ex}</span></div>{/each}</div>{/snippet}
        </Tooltip>
      {/each}
    </div>
  </section>

  <div class="flex-1 w-full max-w-lg px-4 flex flex-col min-h-0 relative">
    <div class="flex-none pb-2">
        <WordRow type="origin">
            {#snippet spine()}<div class="w-2.5 h-2.5 rounded-full bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>{/snippet}
            {#snippet card()}<JourneyTile word={game.startWord} flash={flashWords.includes(game.startWord)} />{/snippet}
            {#snippet side()}<span class="text-sm font-black text-slate-400">+0</span>{/snippet}
        </WordRow>
    </div>

    <div class="flex-1 flex flex-col min-h-0 relative py-2">
        {#if showTopIndicator}<div class="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none"></div>{/if}
        {#if showBottomIndicator}<div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none"></div>{/if}

        <div bind:this={scrollContainer} onscroll={handleScroll} class="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pb-2 scroll-smooth">
            {#each game.history.slice(1) as move, i}
                {#if i < game.history.length - 2 || !game.isGameOver}
                    <WordRow type="waypoint">
                        {#snippet spine()}<div class="text-[10px] font-black text-slate-400 bg-slate-800 w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 shadow-lg">{i + 1}</div>{/snippet}
                        {#snippet card()}<JourneyTile word={move.word} type={move.type} flash={flashWords.includes(move.word)} />{/snippet}
                        {#snippet side()}<Tooltip title="Score Breakdown">{#snippet children()}<span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors cursor-help">+{move.moveScore}</span>{/snippet}{#snippet content()}<div class="space-y-3 min-w-[160px]"><div class="flex justify-between items-center text-[12px]"><span class="text-slate-400 font-bold uppercase tracking-widest">Base Move</span><span class="font-mono font-black text-white">100</span></div><div class="flex justify-between items-center text-[12px] text-emerald-400"><span class="italic font-bold">Rarity Bonus</span><span class="font-mono font-black">-{100 - (move.moveScore || 0)}</span></div><div class="flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg"><span class="uppercase tracking-tighter">TOTAL</span><span class="text-white font-mono">{move.moveScore}</span></div></div>{/snippet}</Tooltip>{/snippet}
                    </WordRow>
                {/if}
            {/each}

            {#if !game.isGameOver}
                <div class="flex flex-col gap-2 shrink-0">
                    <WordRow type="input">
                        {#snippet spine()}<div class="text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border border-slate-700 border-dashed text-slate-600">{game.history.length}</div>{/snippet}
                        {#snippet card()}<div class={isShaking ? 'animate-shake' : ''}><WordInput bind:value={guess} {validation} hasErrors={activeErrors.length > 0} onsubmit={handleSubmit} oninput={handleInput} characterClasses={getInputCharacterClasses} /></div>{/snippet}
                    </WordRow>
                    {#if activeErrors.length > 0}
                      <div class="ml-16 animate-in slide-in-from-top-2 fade-in duration-300 flex flex-col gap-1 text-left">{#each activeErrors as err}<p class="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 inline-block self-start">{err}</p>{/each}</div>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <div class="flex-none pb-8">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class={game.isGameOver ? 'cursor-pointer group/goal active:scale-[0.98] transition-all' : ''} onclick={() => game.isGameOver && successDialog.showModal()}>
            <WordRow type="destination">
                {#snippet spine()}
                    <div class="w-6 h-6 relative flex items-center justify-center">
                        {#if game.isGameOver}
                            <div class="absolute w-8 h-8 bg-emerald-400/20 blur-md rounded-full animate-pulse"></div>
                        {/if}
                        <div class="relative z-10">
                            <TreasureChest open={game.isGameOver} />
                        </div>
                    </div>
                {/snippet}
                {#snippet card()}
                    <div class="relative">
                        {#if game.isGameOver}
                            <div class="absolute -inset-0.5 bg-emerald-500/10 blur rounded-2xl animate-pulse"></div>
                        {/if}
                        <JourneyTile word={game.finishWord} isGoal type={game.isGameOver ? game.history[game.history.length - 1].type : undefined} flash={flashWords.includes(game.finishWord)} />
                    </div>
                {/snippet}
                {#snippet side()}
                    {#if game.isGameOver}
                        {@const last = game.history[game.history.length - 1]}
                        <Tooltip title="Score Breakdown">{#snippet children()}<span class="text-sm font-black text-slate-100 group-hover/row:text-white transition-colors cursor-help">+{last.moveScore}</span>{/snippet}{#snippet content()}<div class="space-y-3 min-w-[160px]"><div class="flex justify-between items-center text-[12px]"><span class="text-slate-400 font-bold uppercase tracking-widest">Base Move</span><span class="font-mono font-black text-white">100</span></div><div class="flex justify-between items-center text-[12px] text-emerald-400"><span class="italic font-bold">Rarity Bonus</span><span class="font-mono font-black">-{100 - (last.moveScore || 0)}</span></div><div class="flex justify-between items-center font-black mt-4 pt-4 border-t-2 border-slate-800 text-lg"><span class="uppercase tracking-tighter">TOTAL</span><span class="text-white font-mono">{last.moveScore}</span></div></div>{/snippet}</Tooltip>
                    {/if}
                {/snippet}
            </WordRow>
        </div>
    </div>
  </div>

  <footer class="flex-none w-full max-w-lg px-4 pb-8">
    {#if game.isGameOver}
        <div class="flex flex-col items-center">
            <Button size="md" variant="success" onclick={shareResult} class="w-full max-w-sm mb-2 shadow-2xl shadow-emerald-900/20 uppercase tracking-widest font-black italic">SHARE YOUR JOURNEY</Button>
        </div>
    {/if}
  </footer>
</div>

<!-- Dialogs -->
<dialog bind:this={confirmDialog} onclick={(e) => handleBackdropClick(e, confirmDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-sm outline-none"><div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in duration-200"><h2 class="text-xl font-black uppercase italic tracking-tighter text-white mb-2">{confirmTitle}</h2><p class="text-slate-400 text-sm mb-8">{confirmBody}</p><div class="flex flex-col gap-2"><Button variant="danger" onclick={() => { pendingAction?.(); confirmDialog.close(); }}>{confirmActionLabel}</Button><Button variant="secondary" onclick={() => confirmDialog.close()}>{confirmCancelLabel}</Button></div></div></dialog>
<dialog bind:this={levelsDialog} onclick={(e) => handleBackdropClick(e, levelsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none"><div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"><div class="p-6 border-b-2 border-slate-700 flex justify-between items-center bg-slate-800/50"><h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Choose journey</h2><button onclick={() => levelsDialog.close()} class="text-slate-500 hover:text-white transition-colors">✕</button></div><div class="overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2 text-left">{#each filteredJourneys as s}{@const result = game.completedJourneys[s.id]}<button onclick={() => confirmAction('Abandon Journey?', 'Starting a new journey will clear your current progress.', 'START NEW', 'STAY ON JOURNEY', () => selectJourney(s))} class="w-full text-left p-5 bg-slate-900/30 hover:bg-slate-700 border-2 border-slate-700/50 rounded-2xl transition-all group relative"><div class="flex justify-between items-center mb-1"><div class="flex items-center gap-2"><span class="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{s.name}</span>{#if result}<span class="text-[10px]" title="Completed!">✅</span>{/if}</div><span class={getDifficultyClasses(s.difficulty)}>{s.difficulty}</span></div><div class="flex justify-between items-end"><p class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.startWord} ➔ {s.finishWord}</p>{#if result}<span class="text-[9px] font-black text-emerald-500 uppercase">Best: {result.score} 🏆</span>{/if}</div></button>{/each}</div></div></dialog>
<dialog bind:this={settingsDialog} onclick={(e) => handleBackdropClick(e, settingsDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-md outline-none"><div class="bg-slate-800 border-2 border-slate-700 rounded-[2rem] shadow-2xl p-8"><div class="flex justify-between items-center mb-8"><h2 class="text-xl font-black uppercase italic tracking-tighter text-white">Settings</h2><button onclick={() => settingsDialog.close()} class="text-slate-500 hover:text-white transition-colors">✕</button></div><label class="flex items-center justify-between cursor-pointer group"><span class="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Untamed Vocabulary (Profanity)</span><div class="relative inline-flex items-center"><input type="checkbox" bind:checked={game.allowProfanity} class="sr-only peer"><div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></div></label></div></dialog>
<dialog bind:this={successDialog} onclick={(e) => handleBackdropClick(e, successDialog)} class="bg-transparent backdrop:bg-slate-950/80 p-4 w-full max-w-lg outline-none"><div class="bg-slate-800 border-2 border-slate-700 rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in duration-300 relative"><button onclick={() => successDialog.close()} class="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors text-2xl font-bold">✕</button><div class="w-24 h-24 mx-auto mb-6"><TreasureChest open /></div><h2 class="text-4xl font-black text-emerald-400 mb-2 italic uppercase tracking-tighter">Treasure Found!</h2><p class="text-slate-400 text-sm mb-10 italic">Your journey across the dictionary is complete.</p><div class="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700/50 mb-10"><div class="flex justify-between items-center mb-4 border-b border-slate-800 pb-4 px-2"><span class="text-xs font-black text-slate-500 uppercase">Total Score</span><span class="text-3xl font-black text-white italic">{game.score}</span></div><div class="flex justify-between items-center px-2"><span class="text-xs font-black text-slate-500 uppercase">Total Steps</span><span class="text-xl font-black text-white">{game.history.length - 1}</span></div></div><div class="flex flex-col gap-3"><Button variant="primary" size="lg" onclick={shareResult}>SHARE JOURNEY</Button><div class="grid grid-cols-2 gap-3"><Button variant="secondary" onclick={() => { game.reset(); successDialog.close(); }}>RETRY</Button><Button variant="secondary" onclick={() => { successDialog.close(); levelsDialog.showModal(); }}>NEW MAP</Button></div></div></div></dialog>

<style>
  @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
  .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
</style>
