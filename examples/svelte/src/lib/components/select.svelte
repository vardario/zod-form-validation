<script lang="ts">
  import { observerValidationErrors } from "@vardario/zod-form-validation";

  export let label: string | undefined = undefined;
  let errors: string[] = [];

  function enhance(input: HTMLSelectElement) {
    observerValidationErrors(input, (_errors) => {
      errors = _errors;
    });
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex flex-col-reverse gap-2">
    <select
      use:enhance
      class="p-2 valid:border rounded outline-none invalid:outline invalid:outline-red-600 outline-1 peer"
      id={$$props.name}
      {...$$props}
    >
      <slot />
    </select>
    {#if label}
      <label
        class="peer-data-[validation-required=true]:after:content-['*'] after:text-red-500 text-sm"
        for={$$props.name}
      >
        {label}
      </label>
    {/if}
  </div>

  {#each errors as error}
    <span class="text-sm text-red-600">
      {error}
    </span>
  {/each}
</div>
