<script context="module" lang="ts">
  import { validateForm, setFormData } from "@vardario/zod-form-validation";
</script>

<script lang="ts">
  import type { ZodAny, AnyZodObject, z, ZodEffects } from "zod";
  import type { PartialDeep } from "type-fest";

  type T = $$Generic<AnyZodObject | ZodAny | ZodEffects<AnyZodObject>>;
  type ObjectType = z.infer<typeof schema>;

  export let schema: T;
  export let data: PartialDeep<ObjectType> | undefined = undefined;

  let form: HTMLFormElement;

  function formValidation(_form: HTMLFormElement) {
    form = _form;
    if (schema) {
      validateForm(_form, schema);
    }
  }

  $: form && data && setFormData(form, data);
</script>

<form use:formValidation {...$$props}>
  <slot />
</form>
