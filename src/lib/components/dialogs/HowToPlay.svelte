<script>
  export let show = false;
  export let onClose = () => {};
</script>

{#if show}
  <div class="modal-backdrop" tabindex="-1" aria-modal="true" role="dialog">
    <div class="modal-content">
      <h2>How To Play</h2>
      <ol>
        <li>Transform the start word into the goal word using valid moves.</li>
        <li>Move types:
          <ul>
            <li><b>Morph</b>: Change one letter to form a new valid word.</li>
            <li><b>Anagram</b>: Rearrange all letters to form a new valid word.</li>
            <li><b>Synonym</b>: Enter a word with a similar meaning.</li>
            <li><b>Antonym</b>: Enter a word with the opposite meaning.</li>
          </ul>
        </li>
        <li>Use the <b>Hint</b> (magic wand) for a clue. Limited uses per game.</li>
      </ol>
      <button class="close-btn" on:click={onClose} aria-label="Close How To Play">Close</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 2px 16px rgba(0,0,0,0.2);
  }
  .close-btn {
    margin-top: 1.5rem;
    padding: 0.5rem 1.5rem;
    border: none;
    background: #222;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
