<script lang="ts">
  import type { ValidationResult } from '../types';

  interface Props {
    value?: string;
    validation: ValidationResult;
    hasErrors?: boolean;
    onsubmit: (e: Event) => void;
    oninput: () => void;
    characterClasses: (char: string, index: number) => string;
  }

  let { 
    value = $bindable(''), 
    validation, 
    hasErrors = false, 
    onsubmit, 
    oninput, 
    characterClasses 
  }: Props = $props();


  let inputEl: HTMLInputElement;

  const containerClasses = $derived.by(() => {
      const base = "flex-1 flex h-[60px] bg-slate-800/40 border-2 rounded-2xl transition-all shadow-xl overflow-hidden box-border relative w-full";
      
      if (validation.isValid) {
          if (validation.action === 'morph') return `${base} border-blue-500 shadow-blue-500/20`;
          if (validation.action === 'synonym') return `${base} border-purple-500 shadow-purple-500/20`;
          if (validation.action === 'antonym') return `${base} border-orange-500 shadow-orange-500/20`;
          if (validation.action === 'anagram') return `${base} border-pink-500 shadow-pink-500/20`;
      }
      
      if (hasErrors) {
          return `${base} border-red-500 shadow-red-500/20`;
      }
      
      return `${base} border-blue-500/40 focus-within:border-blue-400/80`;
  });

  const buttonClasses = $derived.by(() => {
      const base = "h-full px-6 font-black uppercase tracking-widest transition-all text-sm shrink-0 border-l-2 border-transparent";
      
      if (validation.isValid) {
          if (validation.action === 'morph') return `${base} bg-blue-600 text-white`;
          if (validation.action === 'synonym') return `${base} bg-purple-600 text-white`;
          if (validation.action === 'antonym') return `${base} bg-orange-600 text-white`;
          if (validation.action === 'anagram') return `${base} bg-pink-600 text-white`;
      }

      return `${base} bg-slate-800/80 text-slate-400`;
  });

  // Keep focus on the input after moves
  $effect(() => {
      if (value === '' && inputEl) {
          inputEl.focus();
      }
  });
</script>

<form {onsubmit} class={containerClasses}>
    <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none font-mono text-2xl uppercase tracking-[0.1em] font-black text-white">
        {#each value.toUpperCase().split('') as char, i}
            <span class={characterClasses(char, i)}>{char}</span>
        {/each}
    </div>
    
    <input 
        bind:this={inputEl}
        type="text" 
        bind:value 
        oninput={() => { value = value.toUpperCase().slice(0, 20); oninput(); }}
        placeholder="NEXT WORD..." 
        class="min-w-0 flex-1 bg-transparent focus:outline-none px-6 text-2xl font-mono uppercase tracking-widest font-black placeholder:text-slate-400/60 text-transparent caret-white selection:bg-blue-500/30" 
        maxlength="20"
        autofocus
    />
    
    <button type="submit" class={buttonClasses} aria-label="Submit Move">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
        </svg>
    </button>
</form>
