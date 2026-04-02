<script lang="ts">
  import { type ValidationResult } from '../game.svelte';

  type Props = {
    value: string;
    validation: ValidationResult;
    hasErrors: boolean;
    onsubmit: (e: Event) => void;
    oninput: () => void;
    characterClasses: (char: string, index: number) => string;
  };

  let { value = $bindable(), validation, hasErrors, onsubmit, oninput, characterClasses }: Props = $props();

  const containerClasses = $derived.by(() => {
      const base = "flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border relative";
      
      if (validation.isValid) {
          if (validation.type === 'letter') return `${base} border-blue-500 shadow-blue-500/20`;
          if (validation.type === 'synonym') return `${base} border-purple-500 shadow-purple-500/20`;
          if (validation.type === 'antonym') return `${base} border-orange-500 shadow-orange-500/20`;
          if (validation.type === 'anagram') return `${base} border-pink-500 shadow-pink-500/20`;
      }
      
      if (hasErrors) return `${base} border-red-500 shadow-red-500/20`;
      
      return `${base} border-blue-500/30 shadow-blue-500/10`;
  });

  const buttonClasses = $derived.by(() => {
      const base = "text-white w-16 h-full transition-all active:scale-90 flex items-center justify-center shrink-0 flex-none border-l border-white/5";
      
      if (validation.isValid) {
          if (validation.type === 'letter') return `${base} bg-blue-600`;
          if (validation.type === 'synonym') return `${base} bg-purple-600`;
          if (validation.type === 'antonym') return `${base} bg-orange-600`;
          if (validation.type === 'anagram') return `${base} bg-pink-600`;
      }
      
      return `${base} bg-slate-800/50`;
  });
</script>

<div class="flex items-center gap-3 w-full">
    <form {onsubmit} class={containerClasses}>
        <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none font-mono text-2xl uppercase tracking-[0.2em] font-black">
            {#each value.toUpperCase().split('') as char, i}
                <span class={characterClasses(char, i)}>{char}</span>
            {/each}
        </div>
        
        <input 
            type="text" 
            bind:value 
            {oninput}
            placeholder="NEXT WORD..." 
            class="min-w-0 flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-400/40 text-transparent caret-white selection:bg-blue-500/30" 
            maxlength="20" 
        />
        
        <button type="submit" class={buttonClasses} aria-label="Submit Move">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
            </svg>
        </button>
    </form>

    <!-- Score Alignment Spacer -->
    <div class="w-12 shrink-0"></div>
</div>
