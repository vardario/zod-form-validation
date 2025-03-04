<script context="module" lang="ts">
  import {
    validateFormData,
    setRequiresToForm,
    setValidationErrorsToForm,
    setFormDataToForm,
    objectToFormData,
    clearFormValidationErrors,
    formDataToObject
  } from '@vardario/zod-form-validation';
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  import type { ZodAny, AnyZodObject, z, ZodEffects } from 'zod';
  import type { PartialDeep } from 'type-fest';

  type T = $$Generic<AnyZodObject | ZodAny | ZodEffects<AnyZodObject>>;
  type ObjectType = z.infer<typeof schema>;
  let slotContainer: HTMLDivElement | undefined = undefined;

  export let schema: T;
  export let data: PartialDeep<ObjectType> | undefined = undefined;
  export let onChange: (data: PartialDeep<ObjectType>) => void = () => {};

  let form: HTMLFormElement;
  let doValidateOnInput = false;

  onMount(() => {
    const observer = new MutationObserver(() => {
      setRequiresToForm(form, schema);
    });
    if (slotContainer) {
      observer.observe(slotContainer, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
    };
  });

  $: {
    form && data && setFormDataToForm(form, data);
    data && console.log(objectToFormData(data));
  }
  $: form && setRequiresToForm(form, schema);

  function enhance(_form: HTMLFormElement) {
    clearFormValidationErrors(_form);
    form = _form;
  }

  function _onChange() {
    setRequiresToForm(form, schema);
    onChange(formDataToObject(new FormData(form), schema));

    if (doValidateOnInput) {
      validateFormData(new FormData(form), schema);
    }
  }

  function fromValidation() {
    onChange(formDataToObject(new FormData(form), schema));

    const result = validateFormData(new FormData(form), schema);

    if (result.success === false) {
      setValidationErrorsToForm(form, result.error);
      return false;
    }

    return true;
  }
</script>

<form
  novalidate
  use:enhance
  on:input={_onChange}
  on:submit
  on:submit={event => {
    doValidateOnInput = true;
    if (!fromValidation()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }}
  {...$$props}
>
  <div bind:this={slotContainer}>
    <slot />
  </div>
</form>
