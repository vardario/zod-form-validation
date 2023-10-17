<script lang="ts">
  let input: HTMLInputElement;
  function enhance(_input: HTMLInputElement) {
    input = _input;
  }
</script>

<div class="flex flex-col gap-2">
  <input use:enhance type="checkbox" class="hidden" {...$$props} />
</div>
