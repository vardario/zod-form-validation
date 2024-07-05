<script context="module" lang="ts">
  import {
    validateFormData,
    setRequiresToForm,
    setValidationErrorsToForm,
    setFormDataToForm,
    objectToFormData,
    clearFormValidationErrors    
  } from '@vardario/zod-form-validation';
</script>

<script lang="ts">
  import type { ZodAny, AnyZodObject, z, ZodEffects } from 'zod';
  import type { PartialDeep } from 'type-fest';

  type T = $$Generic<AnyZodObject | ZodAny | ZodEffects<AnyZodObject>>;
  type ObjectType = z.infer<typeof schema>;

  export let schema: T;
  export let data: PartialDeep<ObjectType> | undefined = undefined;

  let form: HTMLFormElement;
  let doValidateOnInput = false;

  $: {
    form && data && setFormDataToForm(form, data);
    data && console.log(objectToFormData(data));
  }
  $: form && setRequiresToForm(form, schema);

  function enhance(_form: HTMLFormElement) {
    clearFormValidationErrors(_form);
    form = _form;
  }

  function fromValidation() {
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
  on:input={() => doValidateOnInput && fromValidation()}
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
  <slot />
</form>
