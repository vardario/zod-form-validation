<script lang="ts">
  import { observerValidationErrors } from "@vardario/zod-form-validation";

  export let label: string | undefined = undefined;
  let errors: string[] = [];

  function enhance(input: HTMLFieldSetElement) {
    observerValidationErrors(input, (_errors) => {
      errors = _errors;
    });
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex flex-col-reverse gap-2">
    <fieldset
      use:enhance
      class="p-2 data-[validation-error=false]:border rounded outline-none data-[validation-error=true]:outline data-[validation-error=true]:outline-red-600 outline-1 peer flex gap-2"
      id={$$props.name}
      {...$$props}
    >
      <slot />
    </fieldset>
    {#if label}
      <label
        class="peer-data-[validation-required=true]:after:content-['*'] after:text-red-500 peer-invalid:text-red-500 text-sm"
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
  <div />
</div>
