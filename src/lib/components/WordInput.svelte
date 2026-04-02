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
</script>

<form 
    {onsubmit} 
    class="flex-1 flex h-16 bg-slate-900 border-2 rounded-2xl transition-all shadow-2xl overflow-hidden box-border relative"
    class:border-blue-500={validation.isValid && validation.type === 'letter'}
    class:shadow-blue-500\/20={validation.isValid && validation.type === 'letter'}
    class:border-purple-500={validation.isValid && validation.type === 'synonym'}
    class:shadow-purple-500\/20={validation.isValid && validation.type === 'synonym'}
    class:border-orange-500={validation.isValid && validation.type === 'antonym'}
    class:shadow-orange-500\/20={validation.isValid && validation.type === 'antonym'}
    class:border-pink-500={validation.isValid && validation.type === 'anagram'}
    class:shadow-pink-500\/20={validation.isValid && validation.type === 'anagram'}
    class:border-red-500={hasErrors}
    class:shadow-red-500\/20={hasErrors}
    class:border-blue-500\/30={!validation.isValid && !hasErrors}
    class:shadow-blue-500\/10={!validation.isValid && !hasErrors}
>
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
        class="flex-1 bg-transparent focus:outline-none px-5 text-2xl font-mono uppercase tracking-[0.2em] font-black placeholder:text-slate-400/40 text-transparent caret-white selection:bg-blue-500/30" 
        maxlength="20" 
    />
    
    <button 
        type="submit" 
        class="text-white w-20 h-full transition-all active:scale-90 flex items-center justify-center shrink-0"
        class:bg-blue-600={validation.isValid && validation.type === 'letter'}
        class:bg-purple-600={validation.isValid && validation.type === 'synonym'}
        class:bg-orange-600={validation.isValid && validation.type === 'antonym'}
        class:bg-pink-600={validation.isValid && validation.type === 'anagram'}
        class:bg-slate-700={!validation.isValid}
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7" />
        </svg>
    </button>
</form>
